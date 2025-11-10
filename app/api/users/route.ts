import prisma from "@/components/Prisma";
import { GetDefaultPageprop, ResponseServer } from "@/components/ServerUtil";
import { User } from "@prisma/client";
import { NextRequest } from "next/server";
import bcrypt from "bcrypt";

export const GET = async (req: NextRequest) => {
  const { pageSize, search, skip } = GetDefaultPageprop(req);
  const data = await prisma.user.findMany({
    where: {
      ...(search && { name: { contains: search } }),
      status: true,
    },
    skip: skip,
    take: pageSize,
    include: {
      Role: true,
      Unit: true,
    },
  });
  const total = await prisma.user.count({
    where: {
      ...(search && { name: { contains: search } }),
      status: true,
    },
  });

  return ResponseServer(200, "OK", data, total);
};
export const POST = async (req: NextRequest) => {
  const data: User = await req.json();
  const { id, ...saved } = data;
  saved.password = await bcrypt.hash(data.password, 10);
  await prisma.user.create({ data: saved });

  return ResponseServer(200, `Pengguna ${data.name} berhasil ditambahkan`);
};
export const PUT = async (req: NextRequest) => {
  const data: User = await req.json();
  const { id, ...saved } = data;
  await prisma.user.update({
    where: { id: req.nextUrl.searchParams.get("id") || "123" },
    data: { ...saved, updated_at: new Date() },
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
