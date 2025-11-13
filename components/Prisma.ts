import { JadwalAngsuran, PrismaClient } from "@prisma/client";
import { IDapem } from "./Interface";
import { calculateWeeklyPayment } from "./Util";
import moment from "moment";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

export async function generateUniqueLoanId() {
  const prefix = "WLID-";
  const padLength = 6; // jumlah digit angka

  // Ambil record terakhir berdasarkan ID (urut desc)
  const lastRecord = await prisma.dapem.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });

  let newNumber = 1;

  if (lastRecord && lastRecord.id) {
    // Ekstrak angka dari ID terakhir, contoh "PNM-000123" → 123
    const lastNumber = parseInt(lastRecord.id.replace(prefix, "")) || 0;
    newNumber = lastNumber + 1;
  }

  // Format ulang dengan leading zero
  const newId = `${prefix}${String(newNumber).padStart(padLength, "0")}`;

  return newId;
}

function generateNoTrx(prefix: string, loanId: string, week: number) {
  return `${prefix}-${loanId}-${String(week).padStart(2, "0")}`;
}

export function generateJadwalAngsuran(dapem: IDapem) {
  const jadwals: JadwalAngsuran[] = [];
  const angsuran = calculateWeeklyPayment(
    dapem.plafon,
    dapem.margin,
    dapem.tenor
  );
  const pokok = dapem.plafon / dapem.tenor;

  for (let i = 0; i < dapem.tenor; i++) {
    const id = generateNoTrx("INV", dapem.id, i + 1);
    jadwals.push({
      id,
      jadwal_bayar: moment(dapem.process_date || new Date())
        .add(i, "week")
        .toDate(),
      tanggal_bayar: null,
      angsuran_ke: i + 1,
      pokok: pokok,
      margin: angsuran - pokok,
      keterangan: null,
      status_kunjungan: "BELUM",
      file: null,
      dapemId: dapem.id,
    });
  }
  return jadwals;
}
