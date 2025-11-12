import prisma from "@/components/Prisma";
import { User } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

export const GET = async (req: NextRequest) => {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
  }
  const find = await prisma.user.findFirst({
    where: { id: session?.user.id },
  });
  return NextResponse.json({ data: find });
};

export const POST = async (req: NextRequest) => {
  const data: User = await req.json();
  try {
    await prisma.user.update({
      where: { id: data.id },
      data: data,
    });
    return NextResponse.json({ msg: "OK" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ msg: "Internal Server Error" }, { status: 500 });
  }
};

export const PUT = async (req: NextRequest) => {
  const { id, password, newPassword } = await req.json();

  try {
    const find = await prisma.user.findFirst({
      where: { id },
    });
    if (!find)
      return NextResponse.json(
        { status: 404, msg: "Not found" },
        { status: 404 }
      );
    console.log({ find });
    const verify = await bcrypt.compare(password, find.password);
    if (!verify)
      return NextResponse.json(
        { status: 401, msg: "Password saat ini salah!" },
        { status: 401 }
      );

    const pass = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: find.id },
      data: { password: pass },
    });
    return NextResponse.json({ msg: "OK" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ msg: "Internal Server Error" }, { status: 500 });
  }
};
