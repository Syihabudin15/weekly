import prisma, { generateCOAId } from "@/components/Prisma";
import { GetDefaultPageprop, ResponseServer } from "@/components/ServerUtil";
import { COA, COAType } from "@prisma/client";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { pageSize, search, skip } = GetDefaultPageprop(req);
  const type = req.nextUrl.searchParams.get("type");
  const data = await prisma.cOA.findMany({
    where: {
      ...(search && { name: { contains: search } }),
      ...(type && { type: type as COAType }),
      status: true,
    },
    skip: skip,
    take: pageSize,
  });
  const total = await prisma.cOA.count({
    where: {
      ...(search && { name: { contains: search } }),
      ...(type && { type: type as COAType }),
      status: true,
    },
  });

  return ResponseServer(200, "OK", data, total);
};

export const POST = async (req: NextRequest) => {
  const data: COA = await req.json();
  const { id, ...saved } = data;
  const genId = await generateCOAId(data.type);
  await prisma.cOA.create({ data: { id: genId, ...saved } });

  return ResponseServer(200, `COA ${data.name} berhasil ditambahkan`);
};

export const PUT = async (req: NextRequest) => {
  const data: COA = await req.json();
  const { id, ...saved } = data;
  await prisma.cOA.update({
    where: { id },
    data: { ...saved, updated_at: new Date() },
  });

  return ResponseServer(200, `Edit data COA ${data.name} berhasil`);
};

export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return ResponseServer(404, "Maaf data COA tidak ditemukan!");
  const find = await prisma.cOA.findFirst({ where: { id } });
  if (!find) return ResponseServer(404, "Maaf data COA tidak ditemukan!");

  await prisma.cOA.update({
    where: { id },
    data: { status: false },
  });

  return ResponseServer(200, `Data COA ${find.name} berhasil dihapus`);
};
