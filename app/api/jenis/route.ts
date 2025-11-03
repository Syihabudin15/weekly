import prisma from "@/components/Prisma";
import { GetDefaultPageprop, ResponseServer } from "@/components/ServerUtil";
import { Jenis, User } from "@prisma/client";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { pageSize, search, skip } = GetDefaultPageprop(req);
  const data = await prisma.jenis.findMany({
    where: {
      ...(search && { name: { contains: search } }),
      status: true,
    },
    skip: skip,
    take: pageSize,
  });
  const total = await prisma.jenis.count({
    where: {
      ...(search && { name: { contains: search } }),
      status: true,
    },
  });

  return ResponseServer(200, "OK", data, total);
};

export const POST = async (req: NextRequest) => {
  const data: Jenis = await req.json();
  const { id, ...saved } = data;
  await prisma.jenis.create({ data: saved });

  return ResponseServer(200, `Jenis kredit ${data.name} berhasil ditambahkan`);
};

export const PUT = async (req: NextRequest) => {
  const data: Jenis = await req.json();
  const { id, ...saved } = data;
  await prisma.jenis.update({
    where: { id: req.nextUrl.searchParams.get("id") || "123" },
    data: { ...saved, updated_at: new Date() },
  });

  return ResponseServer(200, `Edit data jenis kredit ${data.name} berhasil`);
};

export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return ResponseServer(404, "Maaf data jenis kredit tidak ditemukan!");
  const find = await prisma.jenis.findFirst({ where: { id } });
  if (!find)
    return ResponseServer(404, "Maaf data jenis kredit tidak ditemukan!");

  await prisma.jenis.update({
    where: { id },
    data: { status: false },
  });

  return ResponseServer(200, `Data jenis kredit ${find.name} berhasil dihapus`);
};
