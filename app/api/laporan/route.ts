import prisma from "@/components/Prisma";
import { calculateWeeklyPayment } from "@/components/Util";
import { Dapem, DataDebitur, JadwalAngsuran, User } from "@prisma/client";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export interface IProblemLap extends Dapem {
  DataDebitur: DataDebitur;
  JadwalAngsuran: JadwalAngsuran[];
  Petugas?: User;
}

export interface ILaporan {
  alldeb: number;
  debactive: number;
  kyd: number;
  paid: number;
  os: number;
  sisaos: number;
  sisaospokok: number;
  tertagih: number;
  tertagihpokok: number;
  problem: IProblemLap[];
  monthints: number;
  tertunggak: number;
  tertunggakpokok: number;
}

export const GET = async (req: NextRequest) => {
  const [alldeb, debactive, allplaf, allinst, allpaid, problem] =
    await prisma.$transaction([
      prisma.dataDebitur.count({
        where: {
          Dapem: {
            some: { status_sub: { notIn: ["BATAL", "DRAFT", "TOLAK"] } },
          },
        },
      }),
      prisma.dataDebitur.count({
        where: { Dapem: { some: { status_sub: "SETUJU" } } },
      }),
      prisma.dapem.findMany({
        where: { status: true, status_sub: { in: ["LUNAS", "SETUJU"] } },
      }),
      prisma.jadwalAngsuran.findMany(),
      prisma.dapem.findMany({
        where: { status: true, status_sub: { in: ["LUNAS"] } },
      }),
      prisma.dapem.findMany({
        where: {
          status_sub: "SETUJU",
          JadwalAngsuran: {
            some: {
              tanggal_bayar: null,
              jadwal_bayar: {
                lte: moment().toDate(),
              },
            },
          },
        },
        include: {
          DataDebitur: true,
          Petugas: true,
          JadwalAngsuran: { orderBy: { angsuran_ke: "asc" } },
        },
      }),
    ]);

  const kyd = allplaf.reduce((sum, record) => sum + record.plafon, 0);
  const tertagih = allinst.filter((a) => a.tanggal_bayar !== null);
  const os = allinst.reduce(
    (sum, record) => sum + record.margin + record.pokok,
    0
  );
  const sisaos =
    os -
    tertagih.reduce((sum, record) => sum + record.margin + record.pokok, 0);
  const sisaospokok =
    kyd - tertagih.reduce((sum, record) => sum + record.pokok, 0);

  return NextResponse.json(
    {
      alldeb,
      debactive,
      kyd,
      paid: allpaid.length,
      os,
      sisaos,
      sisaospokok,
      tertagih: tertagih.reduce(
        (sum, record) => sum + record.margin + record.pokok,
        0
      ),
      tertagihpokok: tertagih.reduce((sum, record) => sum + record.pokok, 0),
      problem,
      monthints: allplaf
        .filter((d) => d.status_sub === "SETUJU")
        .reduce(
          (sum, record) =>
            sum +
            calculateWeeklyPayment(record.plafon, record.margin, record.tenor),
          0
        ),
      tertunggak: allinst
        .filter(
          (a) =>
            a.tanggal_bayar === null &&
            moment(a.jadwal_bayar).isSameOrBefore(moment())
        )
        .reduce((sum, record) => sum + record.margin + record.pokok, 0),
      tertunggakpokok: allinst
        .filter(
          (a) =>
            a.tanggal_bayar === null &&
            moment(a.jadwal_bayar).isSameOrBefore(moment())
        )
        .reduce((sum, record) => sum + record.pokok, 0),
    },
    { status: 200 }
  );
};
