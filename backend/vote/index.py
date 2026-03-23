"""
Голосование за вариант A или B в посте-сравнении.
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p8398492_vs_comparative_platf")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def json_response(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") != "POST":
        return json_response(405, {"error": "Method not allowed"})

    session_id = (event.get("headers") or {}).get("x-session-id", "")
    if not session_id:
        return json_response(401, {"error": "Необходима авторизация"})

    body = json.loads(event.get("body") or "{}")
    post_id = body.get("post_id")
    choice = body.get("choice")

    if not post_id or choice not in ("a", "b"):
        return json_response(400, {"error": "Укажи post_id и choice (a или b)"})

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        f"SELECT u.id FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        return json_response(401, {"error": "Сессия истекла"})
    user_id = row[0]

    cur.execute(f"SELECT id FROM {SCHEMA}.posts WHERE id = %s", (post_id,))
    if not cur.fetchone():
        conn.close()
        return json_response(404, {"error": "Пост не найден"})

    cur.execute(
        f"SELECT choice FROM {SCHEMA}.votes WHERE post_id = %s AND user_id = %s",
        (post_id, user_id)
    )
    existing = cur.fetchone()
    if existing:
        conn.close()
        return json_response(409, {"error": "Ты уже голосовал", "my_vote": existing[0]})

    cur.execute(
        f"INSERT INTO {SCHEMA}.votes (post_id, user_id, choice) VALUES (%s, %s, %s)",
        (post_id, user_id, choice)
    )
    col = "votes_a" if choice == "a" else "votes_b"
    cur.execute(
        f"UPDATE {SCHEMA}.posts SET {col} = {col} + 1 WHERE id = %s "
        f"RETURNING votes_a, votes_b",
        (post_id,)
    )
    votes_a, votes_b = cur.fetchone()
    conn.commit()
    conn.close()

    return json_response(200, {"votes_a": votes_a, "votes_b": votes_b, "my_vote": choice})
