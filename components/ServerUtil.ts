import { NextRequest, NextResponse } from "next/server";

export const GetDefaultPageprop = (req: NextRequest) => {
  const page = Number(req.nextUrl.searchParams.get("page") || 1);
  const pageSize = Number(req.nextUrl.searchParams.get("pageSize") || 20);
  const search = req.nextUrl.searchParams.get("search");
  const backdate = req.nextUrl.searchParams.get("backdate");

  const skip = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    skip,
    search,
    backdate,
  };
};

export function ResponseServer<T>(
  status: number,
  msg: string,
  data?: T[],
  total?: number
) {
  return NextResponse.json(
    {
      status,
      msg,
      data,
      total,
    },
    { status }
  );
}

export const getWilayahName = async (
  provinsiId: number,
  kotaId: number,
  kecamatanId: number,
  kelurahanId: number
) => {
  const base = "https://wilayah.id/api";
  const headers = { "Content-Type": "application/json" };

  const [prov, kota, kec, kel] = await Promise.all([
    fetch(`${base}/provinsi/${provinsiId}`, { headers }).then((r) => r.json()),
    fetch(`${base}/kabupaten/${kotaId}`, { headers }).then((r) => r.json()),
    fetch(`${base}/kecamatan/${kecamatanId}`, { headers }).then((r) =>
      r.json()
    ),
    fetch(`${base}/kelurahan/${kelurahanId}`, { headers }).then((r) =>
      r.json()
    ),
  ]);

  return {
    provinsi: prov?.data?.name || "",
    kota: kota?.data?.name || "",
    kecamatan: kec?.data?.name || "",
    kelurahan: kel?.data?.name || "",
  };
};
