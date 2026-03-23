"""
Лента постов: создать пост, получить ленту, поставить/убрать лайк.
"""
import json
import os
import psycopg2

SCHEMA = "t_p8398492_vs_comparative_platf"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user(cur, session_id: str):
    cur.execute(
        f"SELECT u.id, u.name, u.username, u.avatar_url "
        f"FROM {SCHEMA}.sessions_new s JOIN {SCHEMA}.users_new u ON u.id = s.user_id "
        f"WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    return cur.fetchone()


def json_ok(data: dict) -> dict:
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def json_err(status: int, msg: str) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    session_id = headers.get("x-session-id", "")
    path = event.get("path", "/")

    # GET / — лента постов
    if method == "GET":
        params = event.get("queryStringParameters") or {}
        offset = int(params.get("offset", 0))
        limit = min(int(params.get("limit", 20)), 50)

        conn = get_conn()
        cur = conn.cursor()

        user_id = None
        if session_id:
            row = get_user(cur, session_id)
            if row:
                user_id = row[0]

        cur.execute(
            f"SELECT p.id, p.text, p.image_url, p.likes, p.comments_count, p.created_at, "
            f"u.id, u.name, u.username, u.avatar_url "
            f"FROM {SCHEMA}.posts_new p "
            f"JOIN {SCHEMA}.users_new u ON u.id = p.user_id "
            f"ORDER BY p.created_at DESC LIMIT %s OFFSET %s",
            (limit, offset)
        )
        rows = cur.fetchall()
        posts = []
        for r in rows:
            my_like = False
            if user_id:
                cur.execute(
                    f"SELECT 1 FROM {SCHEMA}.likes_new WHERE post_id = %s AND user_id = %s",
                    (r[0], user_id)
                )
                my_like = bool(cur.fetchone())
            posts.append({
                "id": r[0], "text": r[1], "image_url": r[2],
                "likes": r[3], "comments_count": r[4], "created_at": str(r[5]),
                "author": {"id": r[6], "name": r[7], "username": r[8], "avatar_url": r[9]},
                "my_like": my_like
            })
        conn.close()
        return json_ok({"posts": posts})

    # POST / — создать пост
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "create")

        if not session_id:
            return json_err(401, "Необходима авторизация")

        conn = get_conn()
        cur = conn.cursor()
        user = get_user(cur, session_id)
        if not user:
            conn.close()
            return json_err(401, "Сессия истекла")

        # Создать пост
        if action == "create":
            text = (body.get("text") or "").strip()
            image_url = (body.get("image_url") or "").strip() or None
            if not text:
                conn.close()
                return json_err(400, "Напиши что-нибудь")
            if len(text) > 5000:
                conn.close()
                return json_err(400, "Слишком длинный пост")

            cur.execute(
                f"INSERT INTO {SCHEMA}.posts_new (user_id, text, image_url) "
                f"VALUES (%s, %s, %s) RETURNING id, created_at",
                (user[0], text, image_url)
            )
            post_id, created_at = cur.fetchone()
            conn.commit()
            conn.close()
            return json_ok({"post": {
                "id": post_id, "text": text, "image_url": image_url,
                "likes": 0, "comments_count": 0, "created_at": str(created_at),
                "author": {"id": user[0], "name": user[1], "username": user[2], "avatar_url": user[3]},
                "my_like": False
            }})

        # Лайк / анлайк
        if action == "like":
            post_id = body.get("post_id")
            if not post_id:
                conn.close()
                return json_err(400, "Укажи post_id")

            cur.execute(
                f"SELECT 1 FROM {SCHEMA}.likes_new WHERE post_id = %s AND user_id = %s",
                (post_id, user[0])
            )
            already = bool(cur.fetchone())
            if already:
                cur.execute(
                    f"DELETE FROM {SCHEMA}.likes_new WHERE post_id = %s AND user_id = %s",
                    (post_id, user[0])
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.posts_new SET likes = GREATEST(likes - 1, 0) WHERE id = %s RETURNING likes",
                    (post_id,)
                )
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.likes_new (post_id, user_id) VALUES (%s, %s)",
                    (post_id, user[0])
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.posts_new SET likes = likes + 1 WHERE id = %s RETURNING likes",
                    (post_id,)
                )
            likes = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return json_ok({"likes": likes, "my_like": not already})

    return json_err(405, "Method not allowed")
