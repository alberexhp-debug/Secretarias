"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-7xl mb-6">⚠️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Algo salió mal</h1>
        <p className="text-gray-500 mb-8">Ocurrió un error inesperado. Intenta de nuevo o vuelve al inicio.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700"
          >
            Reintentar
          </button>
          <Link
            href="/panel"
            className="bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50"
          >
            Ir al panel
          </Link>
        </div>
      </div>
    </div>
  );
}
