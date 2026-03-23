import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/194acc27-c20b-4c38-88a0-a087c5463b1e";
const POSTS_URL = "https://functions.poehali.dev/2839deb8-2841-485d-9d32-42f1edc51f0c";

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Post {
  id: number;
  text: string;
  image_url: string | null;
  likes: number;
  comments_count: number;
  created_at: string;
  author: { id: number; name: string; username: string; avatar_url: string | null };
  my_like: boolean;
}

type NavTab = "feed" | "search" | "profile";
type AuthMode = "login" | "register";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSession() { return localStorage.getItem("vs_session") || ""; }
function saveSession(id: string) { localStorage.setItem("vs_session", id); }
function clearSession() { localStorage.removeItem("vs_session"); }

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч`;
  return `${Math.floor(h / 24)} д`;
}

function Avatar({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (src) return <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0 text-white"
      style={{
        width: size, height: size, fontSize: size * 0.38,
        background: "linear-gradient(135deg, var(--vs-orange), var(--vs-purple))"
      }}
    >
      {initials}
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (sid: string, user: User) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({ name: "", username: "", email: "", login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); setError(""); }

  async function submit() {
    setLoading(true);
    setError("");
    const body = mode === "login"
      ? { action: "login", login: form.login, password: form.password }
      : { action: "register", name: form.name, username: form.username, email: form.email, password: form.password };

    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      saveSession(data.session_id);
      onAuth(data.session_id, data.user);
    } else {
      setError(data.error || "Ошибка");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "var(--vs-dark)" }}>
      {/* Logo */}
      <div className="text-center mb-8">
        <div
          className="text-6xl font-black tracking-tighter mb-2 select-none"
          style={{
            fontFamily: "'Oswald', sans-serif",
            background: "linear-gradient(135deg, var(--vs-orange), var(--vs-purple))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}
        >V.S</div>
        <p className="text-sm" style={{ color: "#6B7280" }}>Социальная сеть для сравнений</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--vs-card)", border: "1px solid var(--vs-border)" }}>
        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-5" style={{ background: "var(--vs-dark)" }}>
          {(["login", "register"] as AuthMode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={mode === m ? { background: "var(--vs-orange)", color: "#fff" } : { color: "#6B7280" }}
            >
              {m === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === "register" && (
            <>
              <input
                className="vs-search w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600"
                placeholder="Имя"
                value={form.name}
                onChange={e => set("name", e.target.value)}
              />
              <input
                className="vs-search w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600"
                placeholder="Имя пользователя (без пробелов)"
                value={form.username}
                onChange={e => set("username", e.target.value)}
              />
              <input
                type="email"
                className="vs-search w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600"
                placeholder="Email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
              />
            </>
          )}
          {mode === "login" && (
            <input
              className="vs-search w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600"
              placeholder="Email или имя пользователя"
              value={form.login}
              onChange={e => set("login", e.target.value)}
            />
          )}
          <input
            type="password"
            className="vs-search w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600"
            placeholder="Пароль"
            value={form.password}
            onChange={e => set("password", e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
          />

          {error && <p className="text-xs px-1" style={{ color: "#F87171" }}>{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 mt-1"
            style={{ background: "linear-gradient(135deg, var(--vs-orange), var(--vs-pink))", fontFamily: "'Oswald', sans-serif", letterSpacing: "0.06em" }}
          >
            {loading ? "..." : mode === "login" ? "ВОЙТИ" : "СОЗДАТЬ АККАУНТ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, session, onLike }: { post: Post; session: string; onLike: (id: number, likes: number, myLike: boolean) => void }) {
  const [liking, setLiking] = useState(false);

  async function handleLike() {
    if (liking) return;
    setLiking(true);
    const res = await fetch(POSTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": session },
      body: JSON.stringify({ action: "like", post_id: post.id }),
    });
    const data = await res.json();
    if (res.ok) onLike(post.id, data.likes, data.my_like);
    setLiking(false);
  }

  return (
    <div className="vs-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Avatar src={post.author.avatar_url} name={post.author.name} size={38} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{post.author.name}</p>
          <p className="text-xs" style={{ color: "#4A5568" }}>@{post.author.username} · {timeAgo(post.created_at)}</p>
        </div>
        <button style={{ color: "#4A5568" }}>
          <Icon name="MoreHorizontal" size={18} />
        </button>
      </div>

      {/* Text */}
      <div className="px-4 pb-3">
        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{post.text}</p>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-3">
          <img src={post.image_url} alt="" className="w-full rounded-xl object-cover max-h-72" />
        </div>
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-4 px-4 py-2.5"
        style={{ borderTop: "1px solid var(--vs-border)" }}
      >
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-sm transition-all active:scale-95"
          style={{ color: post.my_like ? "var(--vs-orange)" : "#4A5568" }}
        >
          <Icon name={post.my_like ? "Heart" : "Heart"} size={17} style={{ fill: post.my_like ? "var(--vs-orange)" : "none", color: post.my_like ? "var(--vs-orange)" : "#4A5568" } as React.CSSProperties} />
          <span>{post.likes > 0 ? post.likes : ""}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm" style={{ color: "#4A5568" }}>
          <Icon name="MessageCircle" size={17} />
          <span>{post.comments_count > 0 ? post.comments_count : ""}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm ml-auto" style={{ color: "#4A5568" }}>
          <Icon name="Share2" size={17} />
        </button>
      </div>
    </div>
  );
}

// ─── Create Post ──────────────────────────────────────────────────────────────
function CreatePostBar({ user, session, onCreated }: { user: User; session: string; onCreated: (p: Post) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function submit() {
    if (!text.trim() || loading) return;
    setLoading(true);
    const res = await fetch(POSTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": session },
      body: JSON.stringify({ action: "create", text }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setText("");
      setExpanded(false);
      onCreated(data.post);
    }
  }

  return (
    <div className="vs-card rounded-2xl p-4 mb-4">
      <div className="flex gap-3">
        <Avatar src={user.avatar_url} name={user.name} size={38} />
        <div className="flex-1">
          <textarea
            rows={expanded ? 4 : 2}
            placeholder="Что у тебя нового?"
            value={text}
            onChange={e => setText(e.target.value)}
            onFocus={() => setExpanded(true)}
            className="w-full resize-none text-sm text-white placeholder:text-gray-600 bg-transparent outline-none"
            style={{ lineHeight: "1.5" }}
          />
          {expanded && (
            <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: "1px solid var(--vs-border)" }}>
              <div className="flex gap-3">
                <button className="flex items-center gap-1.5 text-xs" style={{ color: "#4A5568" }}>
                  <Icon name="Image" size={16} />
                  <span>Фото</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: text.length > 4500 ? "#F87171" : "#4A5568" }}>
                  {text.length}/5000
                </span>
                <button
                  onClick={submit}
                  disabled={!text.trim() || loading}
                  className="px-4 py-1.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, var(--vs-orange), var(--vs-pink))", fontFamily: "'Oswald', sans-serif" }}
                >
                  {loading ? "..." : "Опубликовать"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Feed Page ────────────────────────────────────────────────────────────────
function FeedPage({ posts, user, session, loading, onLike, onCreated }: {
  posts: Post[]; user: User; session: string; loading: boolean;
  onLike: (id: number, likes: number, myLike: boolean) => void;
  onCreated: (p: Post) => void;
}) {
  return (
    <div>
      <CreatePostBar user={user} session={session} onCreated={onCreated} />
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="vs-card rounded-2xl h-32 animate-pulse" style={{ opacity: 0.4 }} />
          ))}
        </div>
      )}
      {!loading && posts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📝</div>
          <p className="font-semibold text-white mb-1">Лента пуста</p>
          <p className="text-sm" style={{ color: "#4A5568" }}>Напиши первый пост!</p>
        </div>
      )}
      <div className="space-y-3">
        {posts.map(p => <PostCard key={p.id} post={p} session={session} onLike={onLike} />)}
      </div>
    </div>
  );
}

// ─── Search Page ──────────────────────────────────────────────────────────────
function SearchPage({ posts, session, onLike }: { posts: Post[]; session: string; onLike: (id: number, likes: number, myLike: boolean) => void }) {
  const [q, setQ] = useState("");
  const found = q.trim() ? posts.filter(p =>
    p.text.toLowerCase().includes(q.toLowerCase()) ||
    p.author.name.toLowerCase().includes(q.toLowerCase()) ||
    p.author.username.toLowerCase().includes(q.toLowerCase())
  ) : [];

  return (
    <div>
      <div className="relative mb-4">
        <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4A5568" } as React.CSSProperties} />
        <input
          autoFocus
          type="text"
          placeholder="Поиск постов и людей..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="vs-search w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600"
        />
      </div>
      {!q && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-white font-semibold">Введи запрос</p>
        </div>
      )}
      {q && found.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">😕</div>
          <p className="text-white font-semibold">Ничего не найдено</p>
        </div>
      )}
      <div className="space-y-3">
        {found.map(p => <PostCard key={p.id} post={p} session={session} onLike={onLike} />)}
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ user, posts, onLogout }: { user: User; posts: Post[]; onLogout: () => void }) {
  const myPosts = posts.filter(p => p.author.id === user.id);
  const totalLikes = myPosts.reduce((s, p) => s + p.likes, 0);

  return (
    <div>
      {/* Cover / Avatar */}
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{ background: "linear-gradient(135deg, rgba(255,85,0,0.12), rgba(139,69,255,0.12))", border: "1px solid var(--vs-border)" }}
      >
        <div className="h-20" style={{ background: "linear-gradient(135deg, rgba(255,85,0,0.3), rgba(139,69,255,0.3))" }} />
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-6 mb-3">
            <div className="ring-4" style={{ borderRadius: "50%", ringColor: "var(--vs-dark)" }}>
              <Avatar src={user.avatar_url} name={user.name} size={56} />
            </div>
            <button
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ border: "1px solid var(--vs-border)", color: "#9CA3AF" }}
            >
              Редактировать
            </button>
          </div>
          <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>{user.name}</h2>
          <p className="text-xs mb-2" style={{ color: "#4A5568" }}>@{user.username}</p>
          {user.bio && <p className="text-sm text-white">{user.bio}</p>}
          <div className="flex gap-4 mt-3">
            {[
              { label: "постов", value: myPosts.length },
              { label: "лайков", value: totalLikes },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-base font-black" style={{ fontFamily: "'Oswald', sans-serif", color: "var(--vs-orange)" }}>{s.value}</div>
                <div className="text-xs" style={{ color: "#4A5568" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My posts */}
      {myPosts.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4A5568" }}>Мои посты</p>
          <div className="space-y-3">
            {myPosts.map(p => <PostCard key={p.id} post={p} session="" onLike={() => {}} />)}
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
        style={{ background: "rgba(255,45,107,0.08)", border: "1px solid rgba(255,45,107,0.2)", color: "var(--vs-pink)" }}
      >
        <Icon name="LogOut" size={16} />
        Выйти
      </button>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function Index() {
  const [session, setSession] = useState(getSession);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<NavTab>("feed");
  const [checked, setChecked] = useState(false);

  // Verify session on mount
  useEffect(() => {
    if (!session) { setChecked(true); return; }
    fetch(AUTH_URL, { headers: { "X-Session-Id": session } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) setUser(d.user);
        else { clearSession(); setSession(""); }
      })
      .finally(() => setChecked(true));
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(POSTS_URL, session ? { headers: { "X-Session-Id": session } } : {});
    const d = await res.json();
    setPosts(d.posts || []);
    setLoading(false);
  }, [session]);

  useEffect(() => { if (checked) loadPosts(); }, [checked]);

  function handleAuth(sid: string, u: User) {
    setSession(sid);
    setUser(u);
    loadPosts();
  }

  function handleLogout() {
    fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": session },
      body: JSON.stringify({ action: "logout" }),
    });
    clearSession();
    setSession("");
    setUser(null);
    setTab("feed");
  }

  function handleLike(id: number, likes: number, myLike: boolean) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes, my_like: myLike } : p));
  }

  function handleCreated(post: Post) {
    setPosts(prev => [post, ...prev]);
  }

  const navItems: { id: NavTab; icon: string; label: string }[] = [
    { id: "feed", icon: "Home", label: "Лента" },
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "profile", icon: "User", label: "Профиль" },
  ];

  const titles: Record<NavTab, string> = { feed: "Лента", search: "Поиск", profile: "Профиль" };

  // Loader
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--vs-dark)" }}>
        <span className="text-4xl font-black" style={{ fontFamily: "'Oswald', sans-serif", background: "linear-gradient(135deg,var(--vs-orange),var(--vs-purple))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>V.S</span>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div className="min-h-screen" style={{ background: "var(--vs-dark)", fontFamily: "'Golos Text', sans-serif" }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(10,12,18,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--vs-border)" }}
      >
        <span
          className="text-xl font-black tracking-tighter select-none"
          style={{ fontFamily: "'Oswald', sans-serif", background: "linear-gradient(135deg,var(--vs-orange),var(--vs-purple))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
        >V.S</span>
        <span className="text-sm font-semibold text-white">{titles[tab]}</span>
        <button onClick={loadPosts} className="transition-all active:scale-90" style={{ color: "#4A5568" }}>
          <Icon name="RefreshCw" size={18} />
        </button>
      </header>

      {/* Content */}
      <main className="pt-16 pb-20 px-4 max-w-md mx-auto">
        <div className="pt-4">
          {tab === "feed" && <FeedPage posts={posts} user={user} session={session} loading={loading} onLike={handleLike} onCreated={handleCreated} />}
          {tab === "search" && <SearchPage posts={posts} session={session} onLike={handleLike} />}
          {tab === "profile" && <ProfilePage user={user} posts={posts} onLogout={handleLogout} />}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ background: "rgba(10,12,18,0.94)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--vs-border)" }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto px-2 py-2">
          {navItems.map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all active:scale-95"
                style={{ color: active ? "var(--vs-orange)" : "#4A5568" }}
              >
                <div className="relative">
                  <Icon name={item.icon as "Home"} size={21} />
                  {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: "var(--vs-orange)" }} />}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
