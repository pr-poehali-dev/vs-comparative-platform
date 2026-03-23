"""
Авторизация через Google OAuth 2.0.
Обменивает code на токен, получает профиль, создаёт/обновляет пользователя и сессию.
"""
import json
import os
import secrets
import urllib.request
import urllib.parse
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p8398492_vs_comparative_platf")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def google_token_exchange(code: str, redirect_uri: str) -> dict:
    data = urllib.parse.urlencode({
        "code": code,
        "client_id": os.environ["GOOGLE_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def google_get_user(access_token: str) -> dict:
    req = urllib.request.Request(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") == "GET":
        params = event.get("queryStringParameters") or {}
        action = params.get("action")

        if action == "url":
            redirect_uri = params.get("redirect_uri", "")
            auth_url = (
                "https://accounts.google.com/o/oauth2/v2/auth?"
                + urllib.parse.urlencode({
                    "client_id": os.environ["GOOGLE_CLIENT_ID"],
                    "redirect_uri": redirect_uri,
                    "response_type": "code",
                    "scope": "openid email profile",
                    "access_type": "offline",
                })
            )
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"url": auth_url})}

        if action == "me":
            session_id = (event.get("headers") or {}).get("x-session-id", "")
            if not session_id:
                return {"statusCode": 401, "headers": {**CORS, "Content-Type": "application/json"},
                        "body": json.dumps({"error": "no session"})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                f"SELECT u.id, u.name, u.email, u.avatar_url FROM {SCHEMA}.sessions s "
                f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
                f"WHERE s.id = %s AND s.expires_at > NOW()",
                (session_id,)
            )
            row = cur.fetchone()
            conn.close()
            if not row:
                return {"statusCode": 401, "headers": {**CORS, "Content-Type": "application/json"},
                        "body": json.dumps({"error": "invalid session"})}
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"id": row[0], "name": row[1], "email": row[2], "avatar_url": row[3]})}

    if event.get("httpMethod") == "POST":
        body = json.loads(event.get("body") or "{}")
        code = body.get("code", "")
        redirect_uri = body.get("redirect_uri", "")

        token_data = google_token_exchange(code, redirect_uri)
        access_token = token_data["access_token"]
        profile = google_get_user(access_token)

        google_id = profile["id"]
        email = profile.get("email", "")
        name = profile.get("name", "")
        avatar_url = profile.get("picture", "")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (google_id, email, name, avatar_url) VALUES (%s, %s, %s, %s) "
            f"ON CONFLICT (google_id) DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url "
            f"RETURNING id",
            (google_id, email, name, avatar_url)
        )
        user_id = cur.fetchone()[0]

        session_id = secrets.token_urlsafe(32)
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s, %s)",
            (session_id, user_id)
        )
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({
                "session_id": session_id,
                "user": {"id": user_id, "name": name, "email": email, "avatar_url": avatar_url}
            })
        }

    return {"statusCode": 405, "headers": CORS, "body": ""}
