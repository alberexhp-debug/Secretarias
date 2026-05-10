import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-7xl mb-6">🤖</div>
        <h1 className="text-5xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-xl text-gray-500 mb-8">Esta página no existe o fue movida.</p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700"
          >
            Ir al inicio
          </Link>
          <Link
            href="/panel"
            className="bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50"
          >
            Mi panel
          </Link>
        </div>
      </div>
    </div>
  );
}
