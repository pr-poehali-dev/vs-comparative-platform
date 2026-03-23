"""
CRUD для постов-сравнений: получить список, создать пост, проголосовать.
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p8398492_vs_comparative_platf")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}
CATEGORIES = ["Техника", "Города", "Еда", "Музыка", "Спорт", "Кино", "Природа", "Разное"]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_from_session(cur, session_id: str):
    cur.execute(
        f"SELECT u.id, u.name, u.avatar_url FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    return cur.fetchone()


def json_response(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    headers = event.get("headers") or {}
    session_id = headers.get("x-session-id", "")

    # GET /  — лента постов
    if method == "GET" and (path == "/" or path.endswith("/posts")):
        params = event.get("queryStringParameters") or {}
        category = params.get("category", "")
        offset = int(params.get("offset", 0))
        limit = min(int(params.get("limit", 20)), 50)

        conn = get_conn()
        cur = conn.cursor()

        user_id = None
        if session_id:
            row = get_user_from_session(cur, session_id)
            if row:
                user_id = row[0]

        base_query = (
            f"SELECT p.id, p.title, p.option_a, p.option_b, p.category, "
            f"p.votes_a, p.votes_b, p.created_at, u.name, u.avatar_url, u.id "
            f"FROM {SCHEMA}.posts p "
            f"JOIN {SCHEMA}.users u ON u.id = p.user_id "
        )
        if category and category in CATEGORIES:
            cur.execute(
                base_query + "WHERE p.category = %s ORDER BY p.created_at DESC LIMIT %s OFFSET %s",
                (category, limit, offset)
            )
        else:
            cur.execute(
                base_query + "ORDER BY p.created_at DESC LIMIT %s OFFSET %s",
                (limit, offset)
            )

        rows = cur.fetchall()
        posts = []
        for r in rows:
            my_vote = None
            if user_id:
                cur.execute(
                    f"SELECT choice FROM {SCHEMA}.votes WHERE post_id = %s AND user_id = %s",
                    (r[0], user_id)
                )
                vote_row = cur.fetchone()
                if vote_row:
                    my_vote = vote_row[0]
            posts.append({
                "id": r[0], "title": r[1], "option_a": r[2], "option_b": r[3],
                "category": r[4], "votes_a": r[5], "votes_b": r[6],
                "created_at": str(r[7]), "author_name": r[8], "author_avatar": r[9],
                "author_id": r[10], "my_vote": my_vote
            })

        conn.close()
        return json_response(200, {"posts": posts})

    # POST / — создать пост
    if method == "POST":
        if not session_id:
            return json_response(401, {"error": "Необходима авторизация"})

        conn = get_conn()
        cur = conn.cursor()
        user = get_user_from_session(cur, session_id)
        if not user:
            conn.close()
            return json_response(401, {"error": "Сессия истекла"})

        body = json.loads(event.get("body") or "{}")
        title = (body.get("title") or "").strip()
        option_a = (body.get("option_a") or "").strip()
        option_b = (body.get("option_b") or "").strip()
        category = body.get("category", "Разное")

        if not title or not option_a or not option_b:
            conn.close()
            return json_response(400, {"error": "Заполни все поля"})
        if category not in CATEGORIES:
            category = "Разное"

        cur.execute(
            f"INSERT INTO {SCHEMA}.posts (user_id, title, option_a, option_b, category) "
            f"VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at",
            (user[0], title, option_a, option_b, category)
        )
        post_id, created_at = cur.fetchone()
        conn.commit()
        conn.close()

        return json_response(200, {
            "post": {
                "id": post_id, "title": title, "option_a": option_a, "option_b": option_b,
                "category": category, "votes_a": 0, "votes_b": 0,
                "created_at": str(created_at), "author_name": user[1],
                "author_avatar": user[2], "author_id": user[0], "my_vote": None
            }
        })

    return json_response(405, {"error": "Method not allowed"})
