"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const AVATAR_EMOJIS: Record<string, string> = {
  "avatar-1": "👩",
  "avatar-2": "👨",
  "avatar-3": "👩‍💼",
  "avatar-4": "👨‍💼",
  "avatar-5": "🧑‍💼",
  "avatar-6": "👩‍🔬",
  "avatar-7": "👨‍🔬",
  "avatar-8": "🧑‍🎨",
  "avatar-9": "👩‍🏫",
  "avatar-10": "👨‍🏫",
  "avatar-11": "🧑‍🔧",
  "avatar-12": "👩‍🍳",
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

interface PanelNavProps {
  userName: string;
  secretaryName: string;
  secretaryAvatar: string;
}

export default function PanelNav({ userName, secretaryName, secretaryAvatar }: PanelNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const emoji = AVATAR_EMOJIS[secretaryAvatar] || "👩";

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
        {/* Secretary status */}
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
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
        <div className="px-4 py-2 text-xs text-gray-400 mb-1">
          {userName}
        </div>
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
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
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
