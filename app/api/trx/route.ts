import { ITransaction } from "@/components/Interface";
import prisma, { generateTrxId } from "@/components/Prisma";
import { GetDefaultPageprop, ResponseServer } from "@/components/ServerUtil";
import moment from "moment";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { backdate } = GetDefaultPageprop(req);

  const [pemasukan, pengeluaran, allpemasukan, allpengeluaran] =
    await prisma.$transaction([
      prisma.transaction.findMany({
        where: {
          ...(backdate &&
            backdate !== "," && {
              created_at: {
                gte: moment(backdate.split(",")[0]).toDate(),
                lte: moment(backdate.split(",")[1]).toDate(),
              },
            }),
          status: true,
          COA: { type: "MASUK" },
        },
        orderBy: { created_at: "desc" },
        include: { COA: true },
      }),
      prisma.transaction.findMany({
        where: {
          ...(backdate &&
            backdate !== "," && {
              created_at: {
                gte: moment(backdate.split(",")[0]).toDate(),
                lte: moment(backdate.split(",")[1]).toDate(),
              },
            }),
          status: true,
          COA: { type: "KELUAR" },
        },
        include: { COA: true },
      }),
      prisma.transaction.findMany({
        where: {
          status: true,
          COA: { type: "MASUK" },
        },
        include: { COA: true },
      }),
      prisma.transaction.findMany({
        where: {
          status: true,
          COA: { type: "KELUAR" },
        },
        include: { COA: true },
      }),
    ]);

  return ResponseServer(
    200,
    "OK",
    [{ pemasukan, pengeluaran, allpemasukan, allpengeluaran }],
    0
  );
};

export const POST = async (req: NextRequest) => {
  const data: ITransaction = await req.json();
  const { id, COA, ...saved } = data;
  const genId = await generateTrxId();
  await prisma.transaction.create({ data: { id: genId, ...saved } });

  return ResponseServer(200, `Transaksi berhasil ditambahkan`);
};

export const PUT = async (req: NextRequest) => {
  const data: ITransaction = await req.json();
  const { id, COA, ...saved } = data;
  await prisma.transaction.update({
    where: { id },
    data: { ...saved, updated_at: new Date() },
  });

  return ResponseServer(200, `Edit data Transaksi ${data.id} berhasil`);
};

export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return ResponseServer(404, "Maaf data Transaksi tidak ditemukan!");
  const find = await prisma.transaction.findFirst({ where: { id } });
  if (!find) return ResponseServer(404, "Maaf data Transaksi tidak ditemukan!");

  await prisma.transaction.update({
    where: { id },
    data: { status: false },
  });

  return ResponseServer(200, `Data Transaksi ${find.id} berhasil dihapus`);
};
