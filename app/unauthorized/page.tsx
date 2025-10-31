"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Akses Ditolak
          </h1>

          <p className="text-gray-600 mb-6">
            Anda tidak memiliki izin untuk mengakses halaman ini. Silakan
            hubungi administrator jika Anda merasa ini adalah kesalahan.
          </p>

          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Kembali ke Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
