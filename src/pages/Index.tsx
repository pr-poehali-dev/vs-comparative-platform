import { useState } from "react";
import Icon from "@/components/ui/icon";

const IMG_PHONES = "https://cdn.poehali.dev/projects/e2ff8c9c-6ce9-4d14-bfaa-9a4bc72f785a/files/456f81b4-339f-4c28-8a3b-10d0b7cc4a26.jpg";
const IMG_CITIES = "https://cdn.poehali.dev/projects/e2ff8c9c-6ce9-4d14-bfaa-9a4bc72f785a/files/0d2d0308-c5af-4597-b3ea-b6652803faac.jpg";
const IMG_DRINKS = "https://cdn.poehali.dev/projects/e2ff8c9c-6ce9-4d14-bfaa-9a4bc72f785a/files/9110cf64-e2c1-4ae7-9e8c-46ee819e8e8a.jpg";

type NavTab = "feed" | "popular" | "search" | "messages" | "profile";

interface Battle {
  id: number;
  category: string;
  left: { label: string; emoji: string };
  right: { label: string; emoji: string };
  leftVotes: number;
  rightVotes: number;
  image?: string;
  hot?: boolean;
  comments: number;
  userVote: "left" | "right" | null;
}

const initialBattles: Battle[] = [
  {
    id: 1,
    category: "Техника",
    left: { label: "iPhone", emoji: "🍎" },
    right: { label: "Android", emoji: "🤖" },
    leftVotes: 2847,
    rightVotes: 3211,
    image: IMG_PHONES,
    hot: true,
    comments: 142,
    userVote: null,
  },
  {
    id: 2,
    category: "Города",
    left: { label: "Нью-Йорк", emoji: "🗽" },
    right: { label: "Токио", emoji: "🗼" },
    leftVotes: 1540,
    rightVotes: 2890,
    image: IMG_CITIES,
    hot: false,
    comments: 87,
    userVote: null,
  },
  {
    id: 3,
    category: "Напитки",
    left: { label: "Кофе", emoji: "☕" },
    right: { label: "Чай", emoji: "🍵" },
    leftVotes: 4200,
    rightVotes: 1890,
    image: IMG_DRINKS,
    hot: true,
    comments: 203,
    userVote: null,
  },
  {
    id: 4,
    category: "Сезоны",
    left: { label: "Лето", emoji: "☀️" },
    right: { label: "Зима", emoji: "❄️" },
    leftVotes: 3100,
    rightVotes: 2400,
    hot: false,
    comments: 65,
    userVote: null,
  },
  {
    id: 5,
    category: "Еда",
    left: { label: "Пицца", emoji: "🍕" },
    right: { label: "Суши", emoji: "🍣" },
    leftVotes: 5600,
    rightVotes: 5400,
    hot: true,
    comments: 318,
    userVote: null,
  },
];

const trendingBattles = [
  { label: "Кот vs Собака 🐱🐶", votes: 12400, diff: "+5.2%" },
  { label: "Netflix vs Кино 🎬", votes: 8900, diff: "+3.8%" },
  { label: "Mac vs Windows 💻", votes: 7300, diff: "+2.1%" },
  { label: "Спорт vs Игры 🎮", votes: 5100, diff: "+1.7%" },
  { label: "Море vs Горы 🏔️", votes: 4800, diff: "+0.9%" },
];

const categories = ["Все", "Техника", "Города", "Еда", "Музыка", "Спорт", "Кино", "Природа"];

function formatVotes(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "к";
  return String(n);
}

function VsCard({ battle, onVote }: { battle: Battle; onVote: (id: number, side: "left" | "right") => void }) {
  const total = battle.leftVotes + battle.rightVotes;
  const leftPct = Math.round((battle.leftVotes / total) * 100);
  const rightPct = 100 - leftPct;
  const voted = battle.userVote;

  return (
    <div className="vs-card rounded-2xl overflow-hidden">
      {battle.image && (
        <div className="relative h-44 overflow-hidden">
          <img src={battle.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,12,18,0.2), rgba(10,12,18,0.85))" }} />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", color: "#fff" }}>
              {battle.category}
            </span>
            {battle.hot && (
              <span className="badge-hot px-2 py-0.5 rounded-full text-white uppercase tracking-wider">
                🔥 Горячее
              </span>
            )}
          </div>
        </div>
      )}

      {!battle.image && (
        <div className="px-4 pt-4 flex items-center justify-between">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(255,85,0,0.15)", color: "var(--vs-orange)", border: "1px solid rgba(255,85,0,0.3)" }}>
            {battle.category}
          </span>
          {battle.hot && (
            <span className="badge-hot px-2 py-0.5 rounded-full text-white uppercase tracking-wider">
              🔥 Горячее
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="grid grid-cols-[1fr_48px_1fr] gap-2 mb-4 items-center">
          <button
            onClick={() => onVote(battle.id, "left")}
            className={`vote-btn-left rounded-xl p-3 text-center cursor-pointer ${voted === "left" ? "voted" : ""}`}
          >
            <div className="text-2xl mb-1">{battle.left.emoji}</div>
            <div className="font-semibold text-sm text-white leading-tight">{battle.left.label}</div>
            {voted && (
              <div className="text-xs mt-1 font-bold" style={{ color: "var(--vs-orange)" }}>{leftPct}%</div>
            )}
          </button>

          <div className="flex items-center justify-center">
            <div
              className="font-black text-xl animate-vs-pulse select-none"
              style={{
                fontFamily: "'Oswald', sans-serif",
                background: "linear-gradient(135deg, var(--vs-orange), var(--vs-purple))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              VS
            </div>
          </div>

          <button
            onClick={() => onVote(battle.id, "right")}
            className={`vote-btn-right rounded-xl p-3 text-center cursor-pointer ${voted === "right" ? "voted" : ""}`}
          >
            <div className="text-2xl mb-1">{battle.right.emoji}</div>
            <div className="font-semibold text-sm text-white leading-tight">{battle.right.label}</div>
            {voted && (
              <div className="text-xs mt-1 font-bold" style={{ color: "var(--vs-purple)" }}>{rightPct}%</div>
            )}
          </button>
        </div>

        <div className="mb-3">
          <div className="flex rounded-full overflow-hidden h-2" style={{ background: "var(--vs-border)" }}>
            <div className="progress-left h-full" style={{ width: `${leftPct}%`, borderRadius: "9999px 0 0 9999px" }} />
            <div className="progress-right h-full" style={{ width: `${rightPct}%`, borderRadius: "0 9999px 9999px 0" }} />
          </div>
          <div className="flex justify-between mt-1.5 text-xs" style={{ color: "#4A5568" }}>
            <span>{formatVotes(battle.leftVotes)} голосов</span>
            <span>{formatVotes(battle.rightVotes)} голосов</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--vs-border)" }}>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-xs transition-colors hover:text-white" style={{ color: "#4A5568" }}>
              <Icon name="MessageCircle" size={14} />
              <span>{battle.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs transition-colors hover:text-white" style={{ color: "#4A5568" }}>
              <Icon name="Share2" size={14} />
              <span>Поделиться</span>
            </button>
          </div>
          <button className="flex items-center gap-1 text-xs transition-colors hover:text-white" style={{ color: "#4A5568" }}>
            <Icon name="Bookmark" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedPage({ battles, onVote }: { battles: Battle[]; onVote: (id: number, side: "left" | "right") => void }) {
  const [activeCategory, setActiveCategory] = useState("Все");
  const filtered = activeCategory === "Все" ? battles : battles.filter(b => b.category === activeCategory);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0"
            style={
              activeCategory === cat
                ? { background: "var(--vs-orange)", color: "#fff" }
                : { background: "var(--vs-card)", border: "1px solid var(--vs-border)", color: "#6B7280" }
            }
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map((b) => (
          <VsCard key={b.id} battle={b} onVote={onVote} />
        ))}
      </div>
    </div>
  );
}

function PopularPage({ battles }: { battles: Battle[] }) {
  const sorted = [...battles].sort((a, b) => (b.leftVotes + b.rightVotes) - (a.leftVotes + a.rightVotes));

  return (
    <div>
      <div className="mb-5">
        <h2
          className="text-base font-bold text-white mb-3 tracking-widest uppercase"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          В тренде сегодня
        </h2>
        <div className="space-y-2">
          {trendingBattles.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "var(--vs-card)", border: "1px solid var(--vs-border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                  style={
                    i === 0
                      ? { background: "linear-gradient(135deg, var(--vs-orange), var(--vs-pink))", color: "#fff" }
                      : i === 1
                      ? { background: "rgba(255,85,0,0.2)", color: "var(--vs-orange)" }
                      : { background: "var(--vs-border)", color: "#6B7280" }
                  }
                >
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-white">{t.label}</span>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold" style={{ color: "var(--vs-orange)" }}>{t.diff}</div>
                <div className="text-xs" style={{ color: "#4A5568" }}>{formatVotes(t.votes)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-base font-bold text-white mb-3 tracking-widest uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
        Топ сравнения
      </h2>
      <div className="space-y-3">
        {sorted.map((b, i) => (
          <div
            key={b.id}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "var(--vs-card)", border: "1px solid var(--vs-border)" }}
          >
            <div
              className="text-lg font-black w-8 text-center flex-shrink-0"
              style={{ fontFamily: "'Oswald', sans-serif", color: i === 0 ? "var(--vs-orange)" : "#4A5568" }}
            >
              #{i + 1}
            </div>
            {b.image ? (
              <img src={b.image} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ background: "var(--vs-border)" }}>
                {b.left.emoji}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{b.left.label} vs {b.right.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "#4A5568" }}>{formatVotes(b.leftVotes + b.rightVotes)} голосов</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold" style={{ fontFamily: "'Oswald', sans-serif", color: "var(--vs-purple)" }}>{b.comments}</div>
              <div className="text-xs" style={{ color: "#4A5568" }}>коммент.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchPage() {
  const [query, setQuery] = useState("");
  const suggestions = ["iPhone vs Android", "Лето vs Зима", "Кофе vs Чай", "Netflix vs Кино", "Кот vs Собака"];
  const filtered = query ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())) : suggestions;

  return (
    <div>
      <div className="relative mb-5">
        <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4A5568" } as React.CSSProperties} />
        <input
          type="text"
          placeholder="Найди любое сравнение..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="vs-search w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600"
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4A5568" }}>
        {query ? "Результаты" : "Популярные запросы"}
      </p>
      <div className="space-y-2 mb-5">
        {filtered.map((s, i) => (
          <button
            key={i}
            onClick={() => setQuery(s)}
            className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all"
            style={{ background: "var(--vs-card)", border: "1px solid var(--vs-border)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,85,0,0.1)" }}>
                <Icon name="Zap" size={14} style={{ color: "var(--vs-orange)" } as React.CSSProperties} />
              </div>
              <span className="text-sm text-white font-medium">{s}</span>
            </div>
            <Icon name="ArrowRight" size={14} style={{ color: "#4A5568" } as React.CSSProperties} />
          </button>
        ))}
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4A5568" }}>Категории</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { name: "Техника", emoji: "💻", color: "rgba(0,229,255,0.1)", border: "rgba(0,229,255,0.2)", text: "#00E5FF" },
          { name: "Города", emoji: "🏙️", color: "rgba(139,69,255,0.1)", border: "rgba(139,69,255,0.2)", text: "var(--vs-purple)" },
          { name: "Еда", emoji: "🍕", color: "rgba(255,85,0,0.1)", border: "rgba(255,85,0,0.2)", text: "var(--vs-orange)" },
          { name: "Музыка", emoji: "🎵", color: "rgba(255,45,107,0.1)", border: "rgba(255,45,107,0.2)", text: "var(--vs-pink)" },
          { name: "Спорт", emoji: "⚽", color: "rgba(255,85,0,0.1)", border: "rgba(255,85,0,0.2)", text: "var(--vs-orange)" },
          { name: "Природа", emoji: "🌿", color: "rgba(0,229,255,0.1)", border: "rgba(0,229,255,0.2)", text: "#00E5FF" },
        ].map((cat) => (
          <button
            key={cat.name}
            className="flex items-center gap-2 p-3 rounded-xl transition-all"
            style={{ background: cat.color, border: `1px solid ${cat.border}` }}
          >
            <span className="text-xl">{cat.emoji}</span>
            <span className="text-sm font-semibold" style={{ color: cat.text }}>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessagesPage() {
  const chats = [
    { name: "Алексей", avatar: "👤", message: "Согласен, iPhone намного лучше!", time: "2м", unread: 3 },
    { name: "Мария К.", avatar: "👩", message: "Ты голосовал за Токио?", time: "15м", unread: 0 },
    { name: "Команда V.S", avatar: "⚡", message: "Добро пожаловать в V.S! Голосуй...", time: "1ч", unread: 1 },
    { name: "Дмитрий", avatar: "🧑", message: "Смотри какое сравнение!", time: "3ч", unread: 0 },
  ];

  return (
    <div>
      <div className="relative mb-4">
        <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4A5568" } as React.CSSProperties} />
        <input
          type="text"
          placeholder="Поиск диалогов..."
          className="vs-search w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600"
        />
      </div>
      <div className="space-y-1">
        {chats.map((chat, i) => (
          <button
            key={i}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-80"
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: "var(--vs-border)" }}>
              {chat.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{chat.name}</span>
                <span className="text-xs" style={{ color: "#4A5568" }}>{chat.time}</span>
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: "#4A5568" }}>{chat.message}</p>
            </div>
            {chat.unread > 0 && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "var(--vs-orange)" }}>
                {chat.unread}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ battles }: { battles: Battle[] }) {
  const totalVotes = battles.filter(b => b.userVote).length;

  return (
    <div>
      <div
        className="rounded-2xl p-5 mb-4 text-center"
        style={{ background: "linear-gradient(135deg, rgba(255,85,0,0.12), rgba(139,69,255,0.12))", border: "1px solid var(--vs-border)" }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl"
          style={{ background: "linear-gradient(135deg, var(--vs-orange), var(--vs-purple))" }}
        >
          🧑
        </div>
        <h2 className="text-lg font-bold text-white mb-0.5" style={{ fontFamily: "'Oswald', sans-serif" }}>
          Иван Петров
        </h2>
        <p className="text-sm" style={{ color: "#4A5568" }}>@ivanpetrov · На платформе с марта 2026</p>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Сравнений", value: "12", color: "var(--vs-orange)" },
            { label: "Голосов", value: String(totalVotes), color: "var(--vs-purple)" },
            { label: "Рейтинг", value: "🔥847", color: "#00E5FF" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: "var(--vs-card)" }}>
              <div className="text-lg font-black" style={{ fontFamily: "'Oswald', sans-serif", color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: "#4A5568" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {[
          { icon: "User", label: "Редактировать профиль", danger: false },
          { icon: "Bell", label: "Уведомления", danger: false },
          { icon: "Shield", label: "Приватность", danger: false },
          { icon: "HelpCircle", label: "Поддержка", danger: false },
          { icon: "LogOut", label: "Выйти", danger: true },
        ].map((item, i) => (
          <button
            key={i}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all hover:opacity-80"
            style={{ background: "var(--vs-card)", border: "1px solid var(--vs-border)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: item.danger ? "rgba(255,45,107,0.15)" : "rgba(255,85,0,0.1)" }}
            >
              <Icon name={item.icon as "User"} size={15} style={{ color: item.danger ? "var(--vs-pink)" : "var(--vs-orange)" } as React.CSSProperties} />
            </div>
            <span className="text-sm font-medium" style={{ color: item.danger ? "var(--vs-pink)" : "#fff" }}>{item.label}</span>
            {!item.danger && <Icon name="ChevronRight" size={14} className="ml-auto" style={{ color: "#4A5568" } as React.CSSProperties} />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  const [tab, setTab] = useState<NavTab>("feed");
  const [battles, setBattles] = useState<Battle[]>(initialBattles);
  const [showCreate, setShowCreate] = useState(false);

  function handleVote(id: number, side: "left" | "right") {
    setBattles(prev =>
      prev.map(b => {
        if (b.id !== id || b.userVote) return b;
        return {
          ...b,
          userVote: side,
          leftVotes: side === "left" ? b.leftVotes + 1 : b.leftVotes,
          rightVotes: side === "right" ? b.rightVotes + 1 : b.rightVotes,
        };
      })
    );
  }

  const navItems: { id: NavTab; icon: string; label: string }[] = [
    { id: "feed", icon: "Home", label: "Лента" },
    { id: "popular", icon: "TrendingUp", label: "Топ" },
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "messages", icon: "MessageCircle", label: "Чаты" },
    { id: "profile", icon: "User", label: "Профиль" },
  ];

  const pageTitle: Record<NavTab, string> = {
    feed: "Лента",
    popular: "Популярное",
    search: "Поиск",
    messages: "Сообщения",
    profile: "Профиль",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--vs-dark)", fontFamily: "'Golos Text', sans-serif" }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(10,12,18,0.88)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--vs-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="text-2xl font-black tracking-tighter select-none"
            style={{
              fontFamily: "'Oswald', sans-serif",
              background: "linear-gradient(135deg, var(--vs-orange), var(--vs-purple))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            V.S
          </div>
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--vs-orange)", boxShadow: "0 0 8px var(--vs-orange)", animation: "pulse-glow 2s ease-in-out infinite" }}
          />
        </div>

        <h1 className="text-sm font-semibold text-white">{pageTitle[tab]}</h1>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, var(--vs-orange), var(--vs-pink))" }}
        >
          <Icon name="Plus" size={14} />
          <span>Создать</span>
        </button>
      </header>

      {/* Main content */}
      <main className="pt-16 pb-24 px-4 max-w-md mx-auto">
        <div className="pt-4">
          {tab === "feed" && <FeedPage battles={battles} onVote={handleVote} />}
          {tab === "popular" && <PopularPage battles={battles} />}
          {tab === "search" && <SearchPage />}
          {tab === "messages" && <MessagesPage />}
          {tab === "profile" && <ProfilePage battles={battles} />}
        </div>
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(10,12,18,0.94)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid var(--vs-border)",
        }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto px-2 py-2">
          {navItems.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95"
                style={{ color: active ? "var(--vs-orange)" : "#4A5568" }}
              >
                <div className="relative">
                  <Icon name={item.icon as "Home"} size={20} />
                  {active && (
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: "var(--vs-orange)" }}
                    />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl p-5 animate-slide-up"
            style={{ background: "var(--vs-card)", border: "1px solid var(--vs-border)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--vs-border)" }} />
            <h3
              className="text-lg font-bold text-white mb-4 uppercase tracking-widest"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Новое сравнение
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "var(--vs-orange)" }}>
                  Вариант А
                </label>
                <input
                  className="vs-search w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600"
                  placeholder="Например: iPhone"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "var(--vs-purple)" }}>
                  Вариант Б
                </label>
                <input
                  className="vs-search w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600"
                  placeholder="Например: Android"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#4A5568" }}>
                Категория
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.slice(1).map(cat => (
                  <button
                    key={cat}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:border-orange-500/50"
                    style={{ background: "var(--vs-border)", color: "#6B7280" }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-widest uppercase active:scale-98 transition-all"
              style={{
                background: "linear-gradient(135deg, var(--vs-orange), var(--vs-pink))",
                fontFamily: "'Oswald', sans-serif",
              }}
              onClick={() => setShowCreate(false)}
            >
              Опубликовать сравнение
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
