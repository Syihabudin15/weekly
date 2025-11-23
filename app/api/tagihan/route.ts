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
    // Tambahkan filter hari
    const dayFilter = searchParams.get("day") || "";

    const today = dayjs();
    let startOfWeek = today.startOf("week"); // default minggu ini (tergantung locale Day.js, bisa Minggu atau Senin)
    let endOfWeek = today.endOf("week");

    if (weekFilter === "next") {
      startOfWeek = today.add(1, "week").startOf("week");
      endOfWeek = today.add(1, "week").endOf("week");
    } else if (weekFilter === "prev") {
      startOfWeek = today.subtract(1, "week").startOf("week");
      endOfWeek = today.subtract(1, "week").endOf("week");
    }

    // Tentukan day index untuk filter, Day.js default: 0=Minggu, 1=Senin, ..., 6=Sabtu
    // Asumsi: client mengirim nilai index 0-6 atau nama hari yang cocok (misalnya 'senin')
    let targetDayIndex: number | undefined;

    // Contoh mapping nama hari ke index (sesuaikan dengan locale Day.js Anda)
    // Jika Day.js Anda menggunakan locale Indonesia dan startOf('week') adalah Senin (index 1)
    const dayMap = {
      minggu: 0,
      senin: 1,
      selasa: 2,
      rabu: 3,
      kamis: 4,
      jumat: 5,
      sabtu: 6,
    };
    const normalizedDayFilter = dayFilter.toLowerCase();

    if (normalizedDayFilter in dayMap) {
      targetDayIndex = dayMap[normalizedDayFilter as keyof typeof dayMap];
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
          // Tambahkan kondisi filter hari jika dayFilter ada
          ...(targetDayIndex !== undefined
            ? [
                {
                  // Gunakan raw query untuk filter hari karena Prisma tidak memiliki operator hari
                  // Ini mungkin memerlukan setup Prisma yang mendukung `$queryRaw` atau `extensions`
                  // Untuk solusi yang lebih mudah (tapi kurang efisien), kita akan filter setelah mengambil data,
                  // NAMUN untuk query yang lebih baik, kita akan buat logika di bawah ini lebih fleksibel/mencari cara lain
                },
              ]
            : []),
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
          include: { DataDebitur: true },
        },
      },
      orderBy: { jadwal_bayar: "asc" },
    });

    // Karena filter hari sulit dilakukan langsung di query Prisma tanpa raw SQL,
    // kita akan melakukan filter di sisi Node.js setelah data diambil dalam rentang minggu yang dipilih.
    // **PERHATIAN: Untuk set data yang sangat besar, ini kurang efisien.**
    const filteredByDay = dayFilter
      ? data.filter((a) => {
          const dayIndexOfJadwal = dayjs(a.jadwal_bayar).day(); // 0=Minggu, 1=Senin, ...
          return dayIndexOfJadwal === targetDayIndex;
        })
      : data;

    const now = new Date();
    // Tambahkan properti statusPembayaran secara dinamis
    const formatted = filteredByDay.map((a) => {
      // Gunakan filteredByDay
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
    console.error("GET /api/tagihan error:", error);
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
