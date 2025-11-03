import prisma from "@/components/Prisma";
import { GetDefaultPageprop, ResponseServer } from "@/components/ServerUtil";
import { Produk } from "@prisma/client";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { pageSize, search, skip } = GetDefaultPageprop(req);
  const data = await prisma.produk.findMany({
    where: {
      ...(search && { name: { contains: search } }),
      status: true,
    },
    skip: skip,
    take: pageSize,
  });
  const total = await prisma.produk.count({
    where: {
      ...(search && { name: { contains: search } }),
      status: true,
    },
  });

  return ResponseServer(200, "OK", data, total);
};

export const POST = async (req: NextRequest) => {
  const data: Produk = await req.json();
  const { id, ...saved } = data;
  await prisma.produk.create({ data: saved });

  return ResponseServer(200, `Produk kredit ${data.name} berhasil ditambahkan`);
};

export const PUT = async (req: NextRequest) => {
  const data: Produk = await req.json();
  const { id, ...saved } = data;
  await prisma.produk.update({
    where: { id: req.nextUrl.searchParams.get("id") || "123" },
    data: { ...saved, updated_at: new Date() },
  });

  return ResponseServer(200, `Edit data produk kredit ${data.name} berhasil`);
};

export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return ResponseServer(404, "Maaf data produk kredit tidak ditemukan!");
  const find = await prisma.produk.findFirst({ where: { id } });
  if (!find)
    return ResponseServer(404, "Maaf data produk kredit tidak ditemukan!");

  await prisma.produk.update({
    where: { id },
    data: { status: false },
  });

  return ResponseServer(
    200,
    `Data produk kredit ${find.name} berhasil dihapus`
  );
};
