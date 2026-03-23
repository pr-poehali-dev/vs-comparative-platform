"""
Регистрация, вход и получение профиля текущего пользователя по email/паролю.
"""
import json
import os
import secrets
import hashlib
import psycopg2

SCHEMA = "t_p8398492_vs_comparative_platf"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def json_ok(data: dict) -> dict:
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False)}


def json_err(status: int, msg: str) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg})}


def get_user_by_session(cur, session_id: str):
    cur.execute(
        f"SELECT u.id, u.name, u.username, u.email, u.avatar_url, u.bio "
        f"FROM {SCHEMA}.sessions_new s JOIN {SCHEMA}.users_new u ON u.id = s.user_id "
        f"WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    session_id = headers.get("x-session-id", "")

    if method == "GET":
        if not session_id:
            return json_err(401, "Не авторизован")
        conn = get_conn()
        cur = conn.cursor()
        row = get_user_by_session(cur, session_id)
        conn.close()
        if not row:
            return json_err(401, "Сессия истекла")
        return json_ok({"user": {"id": row[0], "name": row[1], "username": row[2],
                                  "email": row[3], "avatar_url": row[4], "bio": row[5]}})

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        action = body.get("action")

        if action == "register":
            name = (body.get("name") or "").strip()
            username = (body.get("username") or "").strip().lower()
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""

            if not name or not username or not email or not password:
                return json_err(400, "Заполни все поля")
            if len(password) < 6:
                return json_err(400, "Пароль минимум 6 символов")
            if len(username) < 3:
                return json_err(400, "Имя пользователя минимум 3 символа")
            if " " in username:
                return json_err(400, "В имени пользователя нельзя использовать пробелы")

            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.users_new WHERE email = %s OR username = %s",
                        (email, username))
            if cur.fetchone():
                conn.close()
                return json_err(409, "Email или имя пользователя уже заняты")

            pw_hash = hash_password(password)
            cur.execute(
                f"INSERT INTO {SCHEMA}.users_new (email, username, name, password_hash) "
                f"VALUES (%s, %s, %s, %s) RETURNING id",
                (email, username, name, pw_hash)
            )
            user_id = cur.fetchone()[0]
            sid = secrets.token_urlsafe(32)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions_new (id, user_id) VALUES (%s, %s)",
                        (sid, user_id))
            conn.commit()
            conn.close()
            return json_ok({"session_id": sid,
                            "user": {"id": user_id, "name": name, "username": username,
                                     "email": email, "avatar_url": None, "bio": None}})

        if action == "login":
            login = (body.get("login") or "").strip().lower()
            password = body.get("password") or ""
            if not login or not password:
                return json_err(400, "Введи логин и пароль")

            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                f"SELECT id, name, username, email, avatar_url, bio, password_hash "
                f"FROM {SCHEMA}.users_new WHERE email = %s OR username = %s",
                (login, login)
            )
            row = cur.fetchone()
            if not row or hash_password(password) != row[6]:
                conn.close()
                return json_err(401, "Неверный логин или пароль")

            sid = secrets.token_urlsafe(32)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions_new (id, user_id) VALUES (%s, %s)",
                        (sid, row[0]))
            conn.commit()
            conn.close()
            return json_ok({"session_id": sid,
                            "user": {"id": row[0], "name": row[1], "username": row[2],
                                     "email": row[3], "avatar_url": row[4], "bio": row[5]}})

        if action == "logout":
            if session_id:
                conn = get_conn()
                cur = conn.cursor()
                cur.execute(f"UPDATE {SCHEMA}.sessions_new SET expires_at = NOW() WHERE id = %s",
                            (session_id,))
                conn.commit()
                conn.close()
            return json_ok({"ok": True})

    return json_err(405, "Method not allowed")
