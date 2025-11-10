import {
  Dapem,
  DataDebitur,
  DataKeluarga,
  JadwalAngsuran,
  Jaminan,
  Jenis,
  Produk,
  Unit,
  User,
} from "@prisma/client";

export interface IPermission {
  path: string;
  name: string;
  access: string[];
}

export interface IPageProps<T> {
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  filters: { key: string; value: any }[];
  data: T[];
}

export interface IUser extends User {
  Unit: Unit;
}

export interface CalculationInputs {
  plafon: number;
  tenor: number; // TENOR DALAM MINGGU
  margin: number;
  produkId: string;
  jenisId: string;
  salary: number;
  pelunasan: number;
  by_admin: number;
  by_tatalaksana: number;
  by_tabungan: number;
  by_materai: number;
}

export interface CalculationResults {
  totalBiayaAwal: number;
  plafonDiterima: number;
  calculatedDsr: number;
  maxDsr: number;
  dsrValidationPassed: boolean;
  byAdmin: number;
  byTabungan: number;
  byTatalaksana: number;
  byMaterai: number;
  pelunasan: number;
}

interface IDataDebitur extends DataDebitur {
  DataKeluarga: DataKeluarga[];
}
export interface IDapem extends Dapem {
  DataDebitur: IDataDebitur;
  Produk: Produk;
  Jenis: Jenis;
  CreatedBy: User;
  ApprovedBy: User;
  JadwalAngsuran: JadwalAngsuran[];
  Jaminan: Jaminan[];
  Petugas: User;
}

export interface ITagihan extends JadwalAngsuran {
  Dapem: IDapem;
  statusPembayaran: string;
}
export interface IDebitur extends DataDebitur {
  Dapem: IDapem[];
  DataKeluarga: DataKeluarga[];
}
