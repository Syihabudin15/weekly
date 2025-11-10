import prisma from "@/components/Prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const provId = req.nextUrl.searchParams.get("provId");
  const regencyId = req.nextUrl.searchParams.get("regencyId");
  const districtId = req.nextUrl.searchParams.get("districtId");

  const result = {
    provinsi: [],
    kota: [],
    kecamatan: [],
    kelurahan: [],
  };

  const reqProvince = await fetch("https://wilayah.id/api/provinces.json");
  const { data: dataProv } = await reqProvince.json();
  result.provinsi = dataProv;
  if (provId) {
    const reqCity = await fetch(
      `https://wilayah.id/api/regencies/${provId}.json`
    );
    const { data: dataCity } = await reqCity.json();
    result.kota = dataCity;
  }

  if (regencyId) {
    const reqDistrict = await fetch(
      `https://wilayah.id/api/districts/${regencyId}.json`
    );
    const { data: dataDistrict } = await reqDistrict.json();
    result.kecamatan = dataDistrict;
  }
  if (districtId) {
    const reqVillage = await fetch(
      `https://wilayah.id/api/villages/${districtId}.json`
    );
    const { data: dataVillage } = await reqVillage.json();
    result.kelurahan = dataVillage;
  }

  return NextResponse.json({ data: result }, { status: 200 });
};

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  console.log(id);
  try {
    if (!id) {
      return NextResponse.json({ msg: "Not found" }, { status: 404 });
    }
    const find = await prisma.dataDebitur.findFirst({ where: { id } });
    if (!find) {
      return NextResponse.json({ msg: "Not found" }, { status: 404 });
    }

    // 1️⃣ ambil nama provinsi
    const provRes = await fetch("https://wilayah.id/api/provinces.json");
    const provData = await provRes.json();
    const provinsi =
      provData.data.find((p: any) => p.code == find.provinsi)?.name || "";

    // 2️⃣ ambil nama kota/kabupaten berdasarkan provinsi
    const kotaRes = await fetch(
      `https://wilayah.id/api/regencies/${find.provinsi}.json`
    );
    const kotaData = await kotaRes.json();
    const kota =
      kotaData.data.find((k: any) => String(k.code) === String(find.kota))
        ?.name || "";

    // 3️⃣ ambil nama kecamatan berdasarkan kota
    const kecRes = await fetch(
      `https://wilayah.id/api/districts/${find.kota}.json`
    );
    const kecData = await kecRes.json();
    const kecamatan =
      kecData.data.find((c: any) => String(c.code) === String(find.kecamatan))
        ?.name || "";

    // 4️⃣ ambil nama kelurahan berdasarkan kecamatan
    const kelRes = await fetch(
      `https://wilayah.id/api/villages/${find.kecamatan}.json`
    );
    const kelData = await kelRes.json();
    const kelurahan =
      kelData.data.find((v: any) => String(v.code) === String(find.kelurahan))
        ?.name || "";

    return Response.json(
      { provinsi, kota, kecamatan, kelurahan },
      { status: 200 }
    );
  } catch (err) {
    console.error("Gagal mengambil data wilayah:", err);
    return NextResponse.json({ msg: "Internal Server Error" }, { status: 404 });
  }
}
