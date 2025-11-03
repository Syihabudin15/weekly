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
