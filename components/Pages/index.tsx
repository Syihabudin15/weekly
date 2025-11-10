"use client";

import { LoaderCircle } from "lucide-react";
import dynamic from "next/dynamic";

export const SimulasiPage = dynamic(
  () => import("@/components/Pages/Simulasi"),
  {
    ssr: false,
    loading: () => <LoaderCircle size={15} />,
  }
);
export const DashboardPage = dynamic(
  () => import("@/components/Pages/Dashboard"),
  {
    ssr: false,
    loading: () => <LoaderCircle size={15} />,
  }
);
export const MonitoringPage = dynamic(
  () => import("@/components/Pages/Monitoring"),
  {
    ssr: false,
    loading: () => <LoaderCircle size={15} />,
  }
);
export const PengajuanPage = dynamic(
  () => import("@/components/Pages/Pengajuan"),
  {
    ssr: false,
    loading: () => <LoaderCircle size={15} />,
  }
);
export const UpsertPengajuan = dynamic(
  () => import("@/components/Pages/UpsertPengajuan"),
  {
    ssr: false,
    loading: () => <LoaderCircle size={15} />,
  }
);
export const DetailPengajuan = dynamic(
  () => import("@/components/Pages/DetailPengajuan"),
  {
    ssr: false,
    loading: () => <LoaderCircle size={15} />,
  }
);
export const CabangPage = dynamic(() => import("@/components/Pages/Cabang"), {
  ssr: false,
  loading: () => <LoaderCircle size={15} />,
});
export const JenisPage = dynamic(() => import("@/components/Pages/Jenis"), {
  ssr: false,
  loading: () => <LoaderCircle size={15} />,
});
export const ProdukPage = dynamic(() => import("@/components/Pages/Produk"), {
  ssr: false,
  loading: () => <LoaderCircle size={15} />,
});

export const DebiturPage = dynamic(() => import("@/components/Pages/Debitur"), {
  ssr: false,
  loading: () => <LoaderCircle size={15} />,
});
export const TagihanPage = dynamic(() => import("@/components/Pages/Tagihan"), {
  ssr: false,
  loading: () => <LoaderCircle size={15} />,
});
export const PelunasanPage = dynamic(
  () => import("@/components/Pages/Pelunasan"),
  {
    ssr: false,
    loading: () => <LoaderCircle size={15} />,
  }
);

export const RolePage = dynamic(() => import("@/components/Pages/Role"), {
  ssr: false,
  loading: () => <LoaderCircle size={15} />,
});
export const UserPage = dynamic(() => import("@/components/Pages/User"), {
  ssr: false,
  loading: () => <LoaderCircle size={15} />,
});
export const SettingPage = dynamic(() => import("@/components/Pages/Setting"), {
  ssr: false,
  loading: () => <LoaderCircle size={15} />,
});
