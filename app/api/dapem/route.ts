import { IDapem } from "@/components/Interface";
import prisma from "@/components/Prisma";
import { ResponseServer } from "@/components/ServerUtil";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const data: IDapem = await req.json();
  try {
    const {
      id,
      DataDebitur,
      Produk,
      Jenis,
      JadwalAngsuran,
      CreatedBy,
      ApprovedBy,
      ...saved
    } = data;
    await prisma.$transaction(async (tx) => {
      const dapem = await tx.dapem.create({
        data: saved,
      });
    });
    return ResponseServer(200, "OK");
  } catch (err) {
    console.log(err);
    return ResponseServer(500, "Internal Server Error");
  }
};
