import prisma from "@/components/Prisma";
import { GetDefaultPageprop, ResponseServer } from "@/components/ServerUtil";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { pageSize, search, skip } = GetDefaultPageprop(req);
  const data = await prisma.role.findMany({
    where: {
      ...(search && { name: search }),
      status: true,
    },
    skip: skip,
    take: pageSize,
  });
  const total = await prisma.role.count({
    where: {
      ...(search && { name: search }),
      status: true,
    },
  });

  return ResponseServer(200, "OK", { data, total });
};
export const POST = async (req: NextRequest) => {
  const data: Role = await req.json();
  const { id, ...saved } = data;
  await prisma.role.create({ data: saved });

  return ResponseServer(200, `Role ${data.name} berhasil ditambahkan`);
};
export const PUT = async (req: NextRequest) => {
  const data: Role = await req.json();
  const { id, ...saved } = data;
  await prisma.role.update({
    where: { id },
    data: saved,
  });

  return ResponseServer(200, `Edit data role ${data.name} berhasil`);
};
export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return ResponseServer(404, "Maaf data role tidak ditemukan!");
  const find = await prisma.role.findFirst({ where: { id } });
  if (!find) return ResponseServer(404, "Maaf data role tidak ditemukan!");

  await prisma.role.update({
    where: { id },
    data: { status: false },
  });

  return ResponseServer(200, `Data role ${find.name} berhasil dihapus`);
};
