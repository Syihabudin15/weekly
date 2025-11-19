import { NextRequest, NextResponse } from "next/server";
import prisma from "@/components/Prisma";

export const GET = async (req: NextRequest) => {
  try {
    // Ambil parameter pencarian (opsional)
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    // Ambil data debitur beserta Dapem
    const debiturData = await prisma.dataDebitur.findMany({
      where: search
        ? {
            name: {
              contains: search,
            },
          }
        : {},
      include: {
        Dapem: {
          orderBy: { process_date: "desc" },
          where: { OR: [{ status_sub: "SETUJU" }, { status_sub: "LUNAS" }] },
          include: {
            JadwalAngsuran: true, // kalau mau hitung angsuran mingguan
          },
        },
      },
    });
    return NextResponse.json({ data: debiturData });
  } catch (error: any) {
    console.error("❌ Error fetching debitur:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengambil data debitur." },
      { status: 500 }
    );
  }
};
