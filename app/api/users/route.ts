import prisma from "@/components/Prisma";
import { GetDefaultPageprop, ResponseServer } from "@/components/ServerUtil";
import { User } from "@prisma/client";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { pageSize, search, skip } = GetDefaultPageprop(req);
  const data = await prisma.user.findMany({
    where: {
      ...(search && { name: search }),
    },
    skip: skip,
    take: pageSize,
  });

  return ResponseServer(200, "OK", data);
};
export const POST = async (req: NextRequest) => {
  const data: User = await req.json();
  const { id, ...saved } = data;
  await prisma.user.create({ data: saved });

  return ResponseServer(200, `Pengguna ${data.name} berhasil ditambahkan`);
};
export const PUT = async (req: NextRequest) => {
  const data: User = await req.json();
  const { id, ...saved } = data;
  await prisma.user.update({
    where: { id },
    data: saved,
  });

  return ResponseServer(200, `Edit data pengguna ${data.name} berhasil`);
};
export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return ResponseServer(404, "Maaf data pengguna tidak ditemukan!");
  const find = await prisma.user.findFirst({ where: { id } });
  if (!find) return ResponseServer(404, "Maaf data pengguna tidak ditemukan!");

  await prisma.user.update({
    where: { id },
    data: { status: false },
  });

  return ResponseServer(200, `Data pengguna ${find.name} berhasil dihapus`);
};
