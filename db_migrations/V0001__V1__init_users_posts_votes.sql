CREATE TABLE IF NOT EXISTS t_p8398492_vs_comparative_platf.users (
  id SERIAL PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p8398492_vs_comparative_platf.sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p8398492_vs_comparative_platf.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE IF NOT EXISTS t_p8398492_vs_comparative_platf.posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p8398492_vs_comparative_platf.users(id),
  title TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Разное',
  votes_a INTEGER NOT NULL DEFAULT 0,
  votes_b INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p8398492_vs_comparative_platf.votes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES t_p8398492_vs_comparative_platf.posts(id),
  user_id INTEGER NOT NULL REFERENCES t_p8398492_vs_comparative_platf.users(id),
  choice TEXT NOT NULL CHECK (choice IN ('a', 'b')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON t_p8398492_vs_comparative_platf.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON t_p8398492_vs_comparative_platf.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON t_p8398492_vs_comparative_platf.sessions(user_id);
