// File ini mensimulasikan sebuah API Endpoint untuk Monitoring Status Pengajuan.
// Data dihitung dari agregasi model Dapem berdasarkan status_sub (EStatusPengajuan).

// Handler untuk metode GET
export async function GET(request: Request) {
  // SIMULASI PENGAMBILAN DATA STATUS PENGAJUAN
  // Dalam implementasi nyata, ini akan menjadi beberapa query Prisma, contoh:
  // const statusCounts = await prisma.Dapem.groupBy({ by: ['status_sub'], _count: true });

  // 1. Ringkasan (Summary) Status Pengajuan
  const applicationSummary = [
    // Total Dapem dengan status tertentu
    { status: "DRAFT", count: 55, color: "#3b82f6" }, // Biru
    { status: "PENDING", count: 120, color: "#f59e0b" }, // Oranye/Kuning
    { status: "SETUJU", count: 450, color: "#10b981" }, // Hijau
    { status: "TOLAK", count: 25, color: "#ef4444" }, // Merah
    { status: "BATAL", count: 10, color: "#7c3aed" }, // Ungu
    { status: "LUNAS", count: 150, color: "#a855f7" }, // Magenta
  ];

  // 2. Daftar Detail Pengajuan Terbaru (untuk Tabel)
  const recentApplications = [
    // Diambil dari Dapem, di-join dengan DataDebitur dan diurutkan berdasarkan created_at DESC
    {
      id: "A001",
      customer: "Andi Pratama",
      plafon: 50000000,
      tenor: 12,
      status_sub: "SETUJU",
      createdAt: new Date(Date.now() - 3600000 * 5),
    },
    {
      id: "A002",
      customer: "Bela Septiana",
      plafon: 120000000,
      tenor: 36,
      status_sub: "PENDING",
      createdAt: new Date(Date.now() - 3600000 * 10),
    },
    {
      id: "A003",
      customer: "Candra Dewi",
      plafon: 25000000,
      tenor: 6,
      status_sub: "DRAFT",
      createdAt: new Date(Date.now() - 3600000 * 15),
    },
    {
      id: "A004",
      customer: "Doni Firmansyah",
      plafon: 75000000,
      tenor: 24,
      status_sub: "TOLAK",
      createdAt: new Date(Date.now() - 3600000 * 20),
    },
    {
      id: "A005",
      customer: "Eka Lestari",
      plafon: 300000000,
      tenor: 60,
      status_sub: "LUNAS",
      createdAt: new Date(Date.now() - 3600000 * 30),
    },
  ];

  const responseData = {
    summary: applicationSummary,
    recent: recentApplications,
  };

  // Mengembalikan data sebagai respons JSON dengan status 200 OK
  return Response.json(responseData, { status: 200 });
}
