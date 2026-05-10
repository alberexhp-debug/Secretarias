"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const AVATAR_EMOJIS: Record<string, string> = {
  "avatar-1": "👩", "avatar-2": "👨", "avatar-3": "👩‍💼", "avatar-4": "👨‍💼",
  "avatar-5": "🧑‍💼", "avatar-6": "👩‍🔬", "avatar-7": "👨‍🔬", "avatar-8": "🧑‍🎨",
  "avatar-9": "👩‍🏫", "avatar-10": "👨‍🏫", "avatar-11": "🧑‍🔧", "avatar-12": "👩‍🍳",
};

const navItems = [
  { href: "/panel", label: "Inicio", icon: "🏠" },
  { href: "/panel/tickets", label: "Tickets", icon: "🎫" },
  { href: "/panel/conversaciones", label: "Conversaciones", icon: "💬" },
  { href: "/panel/agenda", label: "Agenda", icon: "📅" },
  { href: "/panel/contactos", label: "Contactos", icon: "👥" },
  { href: "/panel/metricas", label: "Métricas", icon: "📊" },
  { href: "/panel/configuracion", label: "Configuración", icon: "⚙️" },
];

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  urgent: boolean;
  createdAt: string;
}

interface PanelNavProps {
  userName: string;
  secretaryName: string;
  secretaryAvatar: string;
}

export default function PanelNav({ userName, secretaryName, secretaryAvatar }: PanelNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const emoji = AVATAR_EMOJIS[secretaryAvatar] || "👩";

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/panel/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }

  async function markAllRead() {
    await fetch("/api/panel/notifications", { method: "PATCH", body: JSON.stringify({}) });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-gray-900">Secretario IA</span>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl">
          <span className="text-xl">{emoji}</span>
          <div>
            <div className="text-xs font-medium text-green-800">{secretaryName}</div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span className="text-xs text-green-600">Activo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = item.href === "/panel" ? pathname === "/panel" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="px-4 py-2 text-xs text-gray-400 mb-1">{userName}</div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50"
        >
          <span>🚪</span>
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 z-40">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-bold text-gray-900">Secretario IA</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification bell — visible on mobile too */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) markAllRead(); }}
              className="relative p-2 text-gray-500 hover:text-gray-700"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-semibold text-sm text-gray-900">Notificaciones</span>
                  {notifications.some((n) => !n.read) && (
                    <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
                      Marcar todas leídas
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-8">Sin notificaciones</p>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link || "/panel"}
                        onClick={() => setNotifOpen(false)}
                        className={`block px-4 py-3 hover:bg-gray-50 ${!n.read ? "bg-indigo-50/40" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{n.urgent ? "🚨" : "🔔"}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                            <p className="text-xs text-gray-500 truncate">{n.body}</p>
                          </div>
                          {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-500 hover:text-gray-700">
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Desktop notification bell (top-right of content area) */}
      <div className="hidden md:block fixed top-4 right-4 z-50" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) markAllRead(); }}
          className="relative p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-700 shadow-sm"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-sm text-gray-900">Notificaciones</span>
              {notifications.some((n) => !n.read) && (
                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
                  Marcar todas leídas
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Sin notificaciones</p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || "/panel"}
                    onClick={() => setNotifOpen(false)}
                    className={`block px-4 py-3 hover:bg-gray-50 ${!n.read ? "bg-indigo-50/40" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{n.urgent ? "🚨" : "🔔"}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                        <p className="text-xs text-gray-500 truncate">{n.body}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-xl">
            <NavContent />
          </div>
        </>
      )}

      {/* Mobile padding */}
      <div className="md:hidden h-14" />
    </>
  );
}
