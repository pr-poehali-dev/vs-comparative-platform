DROP VIEW IF EXISTS t_p8398492_vs_comparative_platf.posts_view;
DROP INDEX IF EXISTS t_p8398492_vs_comparative_platf.idx_posts_created_at;
DROP INDEX IF EXISTS t_p8398492_vs_comparative_platf.idx_posts_user_id;
DROP INDEX IF EXISTS t_p8398492_vs_comparative_platf.idx_sessions_user_id;

CREATE TABLE t_p8398492_vs_comparative_platf.users_new (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p8398492_vs_comparative_platf.sessions_new (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p8398492_vs_comparative_platf.users_new(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE t_p8398492_vs_comparative_platf.posts_new (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p8398492_vs_comparative_platf.users_new(id),
  text TEXT NOT NULL,
  image_url TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p8398492_vs_comparative_platf.likes_new (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES t_p8398492_vs_comparative_platf.posts_new(id),
  user_id INTEGER NOT NULL REFERENCES t_p8398492_vs_comparative_platf.users_new(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE t_p8398492_vs_comparative_platf.comments_new (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES t_p8398492_vs_comparative_platf.posts_new(id),
  user_id INTEGER NOT NULL REFERENCES t_p8398492_vs_comparative_platf.users_new(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_new_created ON t_p8398492_vs_comparative_platf.posts_new(created_at DESC);
CREATE INDEX idx_posts_new_user ON t_p8398492_vs_comparative_platf.posts_new(user_id);
CREATE INDEX idx_likes_new_post ON t_p8398492_vs_comparative_platf.likes_new(post_id);
CREATE INDEX idx_comments_new_post ON t_p8398492_vs_comparative_platf.comments_new(post_id);
