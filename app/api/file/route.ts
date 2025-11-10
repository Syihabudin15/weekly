import { getContainerClient } from "@/components/Azure";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const field_name = formData.get("field_name") as string;

    const arrayBuffer = await file.arrayBuffer();
    const buff = Buffer.from(arrayBuffer);
    const containerClient = getContainerClient();
    const blobName = `${field_name}/${Date.now()}-${file.name}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(buff, {
      blobHTTPHeaders: {
        blobContentType: "application/pdf",
        blobContentDisposition: "inline",
      },
    });

    return NextResponse.json({ msg: "OK", url: blockBlobClient.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Gagal upload file!." }, { status: 500 });
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
