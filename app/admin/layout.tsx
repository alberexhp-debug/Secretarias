import { getSession, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Admin — Secretario IA" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || !isAdmin(user)) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-56 fixed inset-y-0 left-0 bg-gray-900 border-r border-gray-800 flex flex-col z-10">
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">Super Admin</div>
          <div className="text-white font-bold text-sm truncate">{user.email}</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <AdminLink href="/admin" icon="📊" label="Dashboard" />
          <AdminLink href="/admin/usuarios" icon="👥" label="Usuarios" />
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <Link href="/panel" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            <span>↩</span> Mi panel
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen bg-gray-950 text-white">
        {children}
      </main>
    </div>
  );
}

function AdminLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-sm"
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}
