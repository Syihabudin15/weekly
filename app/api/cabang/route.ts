import prisma from "@/components/Prisma";
import { GetDefaultPageprop, ResponseServer } from "@/components/ServerUtil";
import { Unit } from "@prisma/client";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { pageSize, search, skip } = GetDefaultPageprop(req);
  const data = await prisma.unit.findMany({
    where: {
      ...(search && { name: { contains: search } }),
      status: true,
    },
    skip: skip,
    take: pageSize,
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
  const data: Unit = await req.json();
  const { id, ...saved } = data;
  await prisma.unit.create({ data: saved });

  return ResponseServer(200, `Unit Cabang ${data.name} berhasil ditambahkan`);
};
export const PUT = async (req: NextRequest) => {
  const data: Unit = await req.json();
  const { id, ...saved } = data;
  await prisma.unit.update({
    where: { id: req.nextUrl.searchParams.get("id") || "123" },
    data: { ...saved },
  });

  return ResponseServer(200, `Edit data unit cabang ${data.name} berhasil`);
};
export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return ResponseServer(404, "Maaf data unit cabang tidak ditemukan!");
  const find = await prisma.unit.findFirst({ where: { id } });
  if (!find)
    return ResponseServer(404, "Maaf data unit cabang tidak ditemukan!");

  await prisma.unit.update({
    where: { id },
    data: { status: false },
  });

  return ResponseServer(200, `Data unit cabang ${find.name} berhasil dihapus`);
};
