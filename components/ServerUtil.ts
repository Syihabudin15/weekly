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
