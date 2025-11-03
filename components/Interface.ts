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

export interface CalculationInputs {
  plafon: number;
  tenorWeeks: number; // TENOR DALAM MINGGU
  annualMarginRate: number;
  produkId: string;
  jenisId: string;
  salary: number;
  pelunasan: number;
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
