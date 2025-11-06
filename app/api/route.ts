import prisma from "@/components/Prisma";
import { NextResponse } from "next/server";
import dayjs from "dayjs";

type KpisResp = {
  totalPlafon: number;
  totalDebitur: number;
  totalOutstanding: number;
  totalBilled: number;
  nplRate: number; // percent
  nominalNPL: number;
};

export async function GET() {
  try {
    // Ambil semua Dapem aktif beserta jadwal dan relasi
    const dApems = await prisma.dapem.findMany({
      where: { status: true },
      include: {
        Produk: true,
        DataDebitur: true,
        JadwalAngsuran: true,
      },
    });

    // Kalkulasi dasar
    const totalPlafon = dApems.reduce((s, d) => s + (d.plafon ?? 0), 0);

    // totalBilled: jumlah pokok+margin pada jadwal yang sudah dibayar
    let totalBilled = 0;
    // Untuk aging / NPL
    const now = dayjs();
    type AgingBucket = {
      group: string;
      debtors: number;
      outstanding: number;
      color: string;
    };
    const agingBuckets: Record<string, AgingBucket> = {
      lancar: {
        group: "Lancar (0)",
        debtors: 0,
        outstanding: 0,
        color: "#10b981",
      },
      kurangLancar: {
        group: "Kurang Lancar (1-30)",
        debtors: 0,
        outstanding: 0,
        color: "#f59e0b",
      },
      diragukan: {
        group: "Diragukan (31-90)",
        debtors: 0,
        outstanding: 0,
        color: "#f97316",
      },
      macet: {
        group: "Macet (> 90)",
        debtors: 0,
        outstanding: 0,
        color: "#ef4444",
      },
    };

    // For identifying problem accounts (max overdue days)
    const problemList: Array<{
      account: string;
      customer: string;
      plafon: number;
      overdueDays: number;
      collector: string | null;
      installmentNumber: number;
      installmentNominal: number | null;
    }> = [];

    // Iterate each Dapem to compute billed/outstanding and overdue info
    for (const d of dApems) {
      // sum paid amounts (pokok + margin) for this Dapem
      const paidSchedules = d.JadwalAngsuran.filter((j) => !!j.tanggal_bayar);
      const paidSum = paidSchedules.reduce(
        (s, j) => s + (j.pokok ?? 0) + (j.margin ?? 0),
        0
      );
      totalBilled += paidSum;

      // outstanding for this Dapem: simple approach = plafon - paidSum
      const outstanding = (d.plafon ?? 0) - paidSum;

      // determine max overdue days among unpaid schedules
      // consider schedules where tanggal_bayar == null and jadwal_bayar < now
      let maxOverdue = 0;
      let nextUnpaidInstallmentNominal: number | null = null;
      let nextUnpaidInstallmentNumber = 0;
      const unpaidSchedules = d.JadwalAngsuran.filter(
        (j) => !j.tanggal_bayar
      ).sort((a, b) => (a.angsuran_ke ?? 0) - (b.angsuran_ke ?? 0));

      for (const sched of unpaidSchedules) {
        if (sched.jadwal_bayar) {
          const days = now.diff(dayjs(sched.jadwal_bayar), "day");
          if (days > maxOverdue) maxOverdue = days;
        }
      }

      // next unpaid installment (first in unpaidSchedules)
      if (unpaidSchedules.length > 0) {
        const next = unpaidSchedules[0];
        nextUnpaidInstallmentNominal = (next.pokok ?? 0) + (next.margin ?? 0);
        nextUnpaidInstallmentNumber = next.angsuran_ke ?? 0;
      }

      // classify into aging bucket based on maxOverdue
      if (maxOverdue === 0) {
        agingBuckets.lancar.debtors += 1;
        agingBuckets.lancar.outstanding += outstanding;
      } else if (maxOverdue <= 30) {
        agingBuckets.kurangLancar.debtors += 1;
        agingBuckets.kurangLancar.outstanding += outstanding;
      } else if (maxOverdue <= 90) {
        agingBuckets.diragukan.debtors += 1;
        agingBuckets.diragukan.outstanding += outstanding;
      } else {
        agingBuckets.macet.debtors += 1;
        agingBuckets.macet.outstanding += outstanding;
      }

      // push candidate for problem accounts if any overdue
      if (maxOverdue > 0) {
        problemList.push({
          account: d.id, // adapt jika ada nomor transaksi
          customer: d.DataDebitur?.name ?? "—",
          plafon: d.plafon ?? 0,
          overdueDays: maxOverdue,
          collector: null, // tidak ada field collector di schema
          installmentNumber: nextUnpaidInstallmentNumber,
          installmentNominal: nextUnpaidInstallmentNominal,
        });
      }
    }

    const totalOutstanding = Math.max(0, totalPlafon - totalBilled);

    // NPL: Dapem with any overdue > 90 days
    const nplDebtors = problemList.filter((p) => p.overdueDays > 90);
    const nominalNPL = nplDebtors.reduce((s, p) => s + (p.plafon ?? 0), 0);
    const nplRate =
      totalOutstanding > 0 ? (nominalNPL / totalOutstanding) * 100 : 0;

    // Product distribution (sum plafon per Produk)
    const prodMap = new Map<string, { name: string; value: number }>();
    for (const d of dApems) {
      const pid = d.produkId;
      const pname = d.Produk?.name ?? "Lainnya";
      const prev = prodMap.get(pid);
      if (prev) prev.value += d.plafon ?? 0;
      else prodMap.set(pid, { name: pname, value: d.plafon ?? 0 });
    }
    const productDistribution = Array.from(prodMap.entries()).map(
      ([k, v], idx) => {
        // simple color palette fallback
        const colors = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];
        return {
          name: v.name,
          value: v.value,
          color: colors[idx % colors.length],
        };
      }
    );

    // Aging data array formatted for chart
    const agingData = Object.values(agingBuckets).map((b) => ({
      group: b.group,
      debtors: b.debtors,
      outstanding: b.outstanding,
      color: b.color,
    }));

    // Problem accounts: sort by overdueDays desc, top 5
    const problemAccounts = problemList
      .sort((a, b) => b.overdueDays - a.overdueDays)
      .slice(0, 5)
      .map((p, idx) => ({
        key: String(idx + 1),
        account: p.account,
        customer: p.customer,
        plafon: p.plafon,
        overdueDays: p.overdueDays,
        collector: p.collector,
        installmentNumber: p.installmentNumber,
        installmentNominal: p.installmentNominal,
      }));

    const resp = {
      kpis: {
        totalPlafon,
        totalDebitur: dApems.length,
        totalOutstanding,
        totalBilled,
        nplRate: Number(nplRate.toFixed(2)),
        nominalNPL,
      } as KpisResp,
      productDistribution,
      agingData,
      problemAccounts,
    };

    return NextResponse.json(resp, { status: 200 });
  } catch (err) {
    console.error("API /api/monitoring error:", err);
    return NextResponse.json(
      {
        error: "Gagal mengambil data monitoring",
        detail: (err as any).message ?? err,
      },
      { status: 500 }
    );
  }
}
