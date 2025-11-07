import prisma from "@/components/Prisma";
import { NextRequest, NextResponse } from "next/server";
import dayjs from "dayjs";
import { EKunjungan } from "@prisma/client";
import { getContainerClient } from "@/components/Azure";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const weekFilter = searchParams.get("week") || "current";
    const today = dayjs();
    let startOfWeek = today.startOf("week"); // default minggu ini
    let endOfWeek = today.endOf("week");

    if (weekFilter === "next") {
      startOfWeek = today.add(1, "week").startOf("week");
      endOfWeek = today.add(1, "week").endOf("week");
    } else if (weekFilter === "prev") {
      startOfWeek = today.subtract(1, "week").startOf("week");
      endOfWeek = today.subtract(1, "week").endOf("week");
    }

    const data = await prisma.jadwalAngsuran.findMany({
      where: {
        AND: [
          {
            jadwal_bayar: {
              gte: startOfWeek.toDate(),
              lte: endOfWeek.toDate(),
            },
          },
          {
            OR: [
              { Dapem: { DataDebitur: { name: { contains: search } } } },
              { id: { contains: search } },
            ],
          },
        ],
      },
      include: {
        Dapem: {
          include: {
            DataDebitur: true,
          },
        },
      },
      orderBy: { jadwal_bayar: "asc" },
    });

    const now = new Date();

    // Tambahkan properti statusPembayaran secara dinamis
    const formatted = data.map((a) => {
      let statusPembayaran: "LUNAS" | "BELUM LUNAS" | "TERLAMBAT" =
        "BELUM LUNAS";
      if (a.tanggal_bayar) {
        statusPembayaran = "LUNAS";
      } else if (new Date(a.jadwal_bayar) < now) {
        statusPembayaran = "TERLAMBAT";
      }
      return { ...a, statusPembayaran };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /jadwal-angsuran error:", error);
    return NextResponse.json(
      { msg: "Gagal mengambil data angsuran." },
      { status: 500 }
    );
  }
};

export const PUT = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const id = formData.get("id") as string;
    const tanggal_bayar = formData.get("tanggal_bayar") as string;
    const keterangan = formData.get("keterangan") as string;
    const status_kunjungan = formData.get("status_kunjungan") as EKunjungan;
    const file = formData.get("file") as File | null;

    let filePath: string | null = null;

    if (!id) {
      return NextResponse.json(
        { msg: "ID angsuran tidak ditemukan." },
        { status: 400 }
      );
    }
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buff = Buffer.from(arrayBuffer);
      const containerClient = getContainerClient();
      const blobName = `tagihan/${Date.now()}-${file.name}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(buff);

      filePath = blockBlobClient.url;
    }

    const updated = await prisma.jadwalAngsuran.update({
      where: { id },
      data: {
        tanggal_bayar: tanggal_bayar ? new Date(tanggal_bayar) : null,
        keterangan,
        status_kunjungan,
        file: filePath,
      },
    });

    return NextResponse.json({ msg: "Berhasil diupdate", data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { msg: "Gagal mengupdate angsuran." },
      { status: 500 }
    );
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json(
        { msg: "URL file wajib disertakan." },
        { status: 400 }
      );
    }

    // Pastikan URL valid dan milik container kita
    const containerClient = getContainerClient();
    const containerUrl = containerClient.url; // contoh: https://myblob.blob.core.windows.net/container-name

    if (!fileUrl.startsWith(containerUrl)) {
      return NextResponse.json(
        { msg: "URL tidak valid atau bukan milik container ini." },
        { status: 400 }
      );
    }

    // Ambil nama blob dari URL
    const blobName = decodeURIComponent(
      fileUrl.replace(`${containerUrl}/`, "")
    );
    const blobClient = containerClient.getBlobClient(blobName);

    // Cek apakah file ada
    const exists = await blobClient.exists();
    if (!exists) {
      return NextResponse.json(
        { msg: "File tidak ditemukan di Azure Blob." },
        { status: 404 }
      );
    }

    // Hapus file
    await blobClient.delete();

    return NextResponse.json({
      msg: "File berhasil dihapus dari Azure.",
      file: blobName,
    });
  } catch (error: any) {
    console.error("DELETE /azure-file error:", error);
    return NextResponse.json(
      { msg: "Gagal menghapus file dari Azure.", error: error.message },
      { status: 500 }
    );
  }
};
