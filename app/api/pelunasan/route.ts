// /app/api/repayments/route.ts
import { NextResponse } from "next/server";
import prisma from "@/components/Prisma";

type LoanStatus = "ONGOING" | "PAID_OFF" | "DEFAULT";

export async function GET() {
  try {
    // Ambil semua Dapem aktif (status = true) beserta jadwal dan debitur
    const dapems = await prisma.dapem.findMany({
      where: { status: true, status_sub: "SETUJU" },
      include: {
        DataDebitur: { select: { id: true, name: true } },
        JadwalAngsuran: true,
      },
      orderBy: { created_at: "desc" },
    });

    const now = new Date();

    const result = dapems.map((d) => {
      const tenorWeeks = d.tenor ?? 0;
      // total of scheduled payments (sum pokok+margin from JadwalAngsuran)
      const totalScheduled = d.JadwalAngsuran.reduce(
        (s, j) => s + (j.pokok ?? 0) + (j.margin ?? 0),
        0
      );

      // weeklyInstallment: prefer average from schedules; fallback to simple division
      const weeklyInstallment =
        tenorWeeks > 0
          ? Math.round(
              totalScheduled > 0
                ? totalScheduled / tenorWeeks
                : (d.plafon + Math.round((d.plafon * (d.margin ?? 0)) / 100)) /
                    tenorWeeks
            )
          : 0;

      const paidInstallments = d.JadwalAngsuran.filter(
        (j) => j.tanggal_bayar
      ).length;

      // next payment: earliest jadwal_bayar where belum dibayar
      const nextUnpaid = d.JadwalAngsuran.filter((j) => !j.tanggal_bayar).sort(
        (a, b) =>
          new Date(a.jadwal_bayar).getTime() -
          new Date(b.jadwal_bayar).getTime()
      )[0];

      const nextPaymentDate = nextUnpaid
        ? new Date(nextUnpaid.jadwal_bayar)
        : null;

      // status logic
      let status: LoanStatus = "ONGOING";
      if (tenorWeeks > 0 && paidInstallments >= tenorWeeks) status = "PAID_OFF";
      else if (nextPaymentDate && nextPaymentDate.getTime() < now.getTime())
        status = "DEFAULT";
      else status = "ONGOING";

      return {
        loanId: d.id,
        userId: d.DataDebitur?.name ?? "—",
        plafond: d.plafon ?? 0,
        tenorWeeks,
        weeklyInstallment,
        paidInstallments,
        nextPaymentDate,
        status,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("GET /api/repayments error:", err);
    return NextResponse.json(
      { message: "Gagal mengambil data pelunasan", error: err?.message ?? err },
      { status: 500 }
    );
  }
}
