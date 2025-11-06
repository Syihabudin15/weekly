import { IDapem } from "@/components/Interface";
import prisma, {
  generateJadwalAngsuran,
  generateUniqueLoanId,
} from "@/components/Prisma";
import { GetDefaultPageprop, ResponseServer } from "@/components/ServerUtil";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { skip, pageSize, search } = GetDefaultPageprop(req);
  const data = await prisma.dapem.findMany({
    where: {
      status: true,
      ...(search && { DataDebitur: { name: { contains: search } } }),
    },
    skip: skip,
    take: pageSize,
    include: {
      DataDebitur: { include: { DataKeluarga: true } },
      Produk: true,
      Jenis: true,
      CreatedBy: true,
      ApprovedBy: true,
      JadwalAngsuran: true,
    },
  });
  const total = await prisma.dapem.count({
    where: {
      status: true,
      ...(search && { DataDebitur: { name: { contains: search } } }),
    },
    skip: skip,
    take: pageSize,
  });

  return ResponseServer<IDapem>(200, "OK", data as IDapem[], total);
};

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
    const PNMID = await generateUniqueLoanId();
    await prisma.$transaction(async (tx) => {
      if (!data.dataDebiturId) {
        const { id: idDeb, DataKeluarga, ...savedDeb } = DataDebitur;
        const saveDeb = await tx.dataDebitur.create({ data: savedDeb });
        saved.dataDebiturId = saveDeb.id;
      }
      await tx.dataKeluarga.deleteMany({ where: { dataDebiturId: id } });
      for (const keluarga of DataDebitur.DataKeluarga) {
        const { id, ...savedKel } = keluarga;
        await tx.dataKeluarga.create({
          data: { ...savedKel, dataDebiturId: saved.dataDebiturId },
        });
      }
      await tx.dapem.create({
        data: { id: PNMID, ...saved },
      });
    });
    return ResponseServer(200, "OK");
  } catch (err) {
    console.log(err);
    return ResponseServer(500, "Internal Server Error");
  }
};

export const PUT = async (req: NextRequest) => {
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
    if (saved.status_sub === "SETUJU") {
      await prisma.$transaction(async (tx) => {
        await tx.dapem.update({
          where: { id },
          data: { ...saved, updated_at: new Date() },
        });
        const jadwalAngsuran = generateJadwalAngsuran(data);
        await tx.jadwalAngsuran.createMany({ data: jadwalAngsuran });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        const { id: idDeb, DataKeluarga, ...debitur } = DataDebitur;
        await tx.dataDebitur.update({
          where: { id: idDeb },
          data: { ...debitur },
        });
        await tx.dataKeluarga.deleteMany({ where: { dataDebiturId: idDeb } });
        for (const keluarga of DataDebitur.DataKeluarga) {
          const { id, ...savedKel } = keluarga;
          await tx.dataKeluarga.create({
            data: { ...savedKel, dataDebiturId: idDeb },
          });
        }
        await tx.dapem.update({
          where: { id },
          data: { ...saved, updated_at: new Date() },
        });
      });
    }
    return ResponseServer(200, "OK");
  } catch (err) {
    console.log(err);
    return ResponseServer(500, "Internal Server Error");
  }
};

export const PATCH = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return ResponseServer(404, "Data tidak ditemukan atau sudah dihapus!");
  }
  const find = await prisma.dapem.findFirst({
    where: { id },
    include: {
      DataDebitur: { include: { DataKeluarga: true } },
      Produk: true,
      Jenis: true,
      ApprovedBy: true,
      CreatedBy: true,
      JadwalAngsuran: true,
    },
  });
  if (!find) {
    return ResponseServer(404, "Data tidak ditemukan atau sudah dihapus!");
  }
  return ResponseServer<IDapem>(200, "OK", [find as IDapem]);
};

export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  try {
    if (!id)
      return ResponseServer(404, "Data tidak ditemukan atau sudah dihapus!");
    const find = await prisma.dapem.findFirst({ where: { id } });
    if (!find)
      return ResponseServer(404, "Data tidak ditemukan atau sudah dihapus!");

    await prisma.dapem.update({
      where: { id },
      data: { status: false },
    });
    return ResponseServer(200, "OK");
  } catch (err) {
    console.log(err);
    return ResponseServer(500, "Internal Server Error");
  }
};
