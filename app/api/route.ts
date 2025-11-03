// File ini mensimulasikan sebuah API Endpoint untuk Dashboard Monitoring Pembiayaan.
// Di lingkungan nyata, handler ini akan menggunakan Prisma Client untuk berinteraksi dengan database.

// Handler untuk metode GET
export async function GET(request: Request) {
  // SIMULASI PENGAMBILAN DATA MENGGUNAKAN PRISMA
  // Dalam implementasi nyata, kode akan terlihat seperti:
  // const totalPlafon = await prisma.Dapem.aggregate({ _sum: { plafon: true } });
  // const totalDebitur = await prisma.DataDebitur.count();
  // dll.

  const mockKPIs = {
    // [Dapem] - Sum dari kolom 'plafon' dari semua pembiayaan yang disetujui
    totalPlafon: 8000000000,

    // [DataDebitur] - Count unik dari DataDebitur yang terkait dengan Dapem aktif
    totalDebitur: 1050,

    // [Dapem] & [JadwalAngsuran] - Outstanding adalah Plafon dikurangi total pokok yang sudah dibayar
    totalOutstanding: 6500000000,

    // [JadwalAngsuran] - Sum dari (pokok + margin) untuk angsuran yang statusnya sudah lunas/tertagih di periode ini
    totalBilled: 500000000,

    // [Dapem] & [JadwalAngsuran] - Dihitung dari outstanding yang jatuh tempo > 90 hari
    nplRate: 3.25,

    // [Dapem] & [JadwalAngsuran] - Nominal outstanding dari pembiayaan NPL
    nominalNPL: 6500000000 * 0.0325,
  };

  const mockProductDistribution = [
    // [Produk] & [Dapem] - Agregasi total plafon berdasarkan Produk.name
    { name: "Multiguna", value: 4000000000, color: "#3b82f6" },
    { name: "Modal Kerja", value: 2500000000, color: "#f59e0b" },
    { name: "Investasi", value: 1500000000, color: "#10b981" },
  ];

  const mockAgingData = [
    // [JadwalAngsuran] - Filter berdasarkan selisih hari antara jadwal_bayar dan tanggal_bayar
    {
      group: "Lancar (0)",
      debtors: 950,
      outstanding: 6000000000,
      color: "#10b981",
    },
    {
      group: "Kurang Lancar (1-30)",
      debtors: 50,
      outstanding: 300000000,
      color: "#f59e0b",
    },
    {
      group: "Diragukan (31-90)",
      debtors: 35,
      outstanding: 150000000,
      color: "#f97316",
    },
    {
      group: "Macet (> 90)",
      debtors: 15,
      outstanding: 50000000,
      color: "#ef4444",
    },
  ];

  const mockProblemAccounts = [
    // [Dapem], [DataDebitur], [JadwalAngsuran] - Query untuk mencari angsuran yang overdue tertinggi
    // Nama Debitur dari DataDebitur, Plafon dari Dapem, Angsuran Ke/Nominal dari JadwalAngsuran
    {
      key: "1",
      account: "TRX/003/24",
      customer: "Dewi Anggraini",
      plafon: 450000000,
      overdueDays: 125,
      collector: "Ani",
      installmentNumber: 8,
      installmentNominal: 50000000,
    },
    {
      key: "2",
      account: "TRX/012/24",
      customer: "Fajar Kurniawan",
      plafon: 15000000,
      overdueDays: 45,
      collector: "Bima",
      installmentNumber: 3,
      installmentNominal: 1500000,
    },
    {
      key: "3",
      account: "TRX/008/24",
      customer: "Siti Rahma",
      plafon: 75000000,
      overdueDays: 32,
      collector: "Ani",
      installmentNumber: 15,
      installmentNominal: 2500000,
    },
    {
      key: "4",
      account: "TRX/021/24",
      customer: "Joko Susilo",
      plafon: 120000000,
      overdueDays: 95,
      collector: "Cahyo",
      installmentNumber: 6,
      installmentNominal: 10000000,
    },
    {
      key: "5",
      account: "TRX/001/24",
      customer: "Budi Santoso",
      plafon: 50000000,
      overdueDays: 7,
      collector: "Bima",
      installmentNumber: 2,
      installmentNominal: 8000000,
    },
  ];
  // -------------------------------------------------------------------

  // Gabungkan semua data ke dalam satu objek respons
  const responseData = {
    kpis: mockKPIs,
    productDistribution: mockProductDistribution,
    agingData: mockAgingData,
    problemAccounts: mockProblemAccounts,
  };

  // Mengembalikan data sebagai respons JSON dengan status 200 OK
  return Response.json(responseData, { status: 200 });
}
