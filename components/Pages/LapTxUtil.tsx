import moment from "moment";
import { ITransaction } from "../Interface";
import { HeaderPage } from "./PrintLaporan";
import { formatterRupiah } from "../Util";
import "moment/locale/id";
moment.locale("id");

export const LapTxBulanan = (
  pemasukan: ITransaction[],
  pengeluaran: ITransaction[],
  allpemasukan: ITransaction[],
  allpengeluaran: ITransaction[],
  backdate?: string[]
) => {
  const allmasuk = allpemasukan.reduce(
    (sum, record) => sum + record.nominal,
    0
  );
  const allkeluar = allpengeluaran.reduce(
    (sum, record) => sum + record.nominal,
    0
  );
  const masuk = pemasukan.reduce((sum, record) => sum + record.nominal, 0);
  const keluar = pengeluaran.reduce((sum, record) => sum + record.nominal, 0);

  return `
    ${HeaderPage(
      "LAPORAN DATA TRANSAKSI",
      backdate && backdate.length === 2 && backdate[0]
        ? `PERIODE ${moment(backdate[0]).format("DD/MM/YYYY")} - ${moment(
            backdate[1]
          ).format("DD/MM/YYYY")}`
        : "PERIODE TIDAK DIPILIH"
    )}
    
    <p class="text-center font-bold mt-5">SELURUH TRANSAKSI</p>
    <div class="flex justify-center flex-wrap gap-4 mb-8 mt-4">
      <div class="border rounded-lg p-3 w-56 border-blue-500 text-blue-500">
        <p class="font-semibold opacity-80">TRANSAKSI MASUK</p>
        <p class="font-semibold">${allpemasukan.length} Tx</p>
        <p class="font-semibold">${formatterRupiah(allmasuk)}</p>
      </div>
      <div class="border rounded-lg p-3 w-56 border-red-500 text-red-500">
        <p class="font-semibold opacity-80">TRANSAKSI KELUAR</p>
        <p class="font-semibold">${allpengeluaran.length} Tx</p>
        <p class="font-semibold">${formatterRupiah(allkeluar)}</p>
      </div>
      <div class="border rounded-lg p-3 w-56 border-green-500 text-green-500">
        <p class="font-semibold opacity-80">SALDO AKHIR</p>
        <p class="font-semibold">Total Tx : ${
          allpemasukan.length + allpengeluaran.length
        } Tx</p>
        <p class="font-semibold">Saldo Akhir : ${formatterRupiah(
          allmasuk - allkeluar
        )}</p>
      </div>
    </div>

    <p class="text-center font-bold">TRANSAKSI PADA PERIODE YANG DIPILIH</p>
      <div class="flex justify-center flex-wrap gap-4 mt-4 mb-8">
        <div class="border rounded-lg p-3 w-56 border-blue-500 text-blue-500">
          <p class="font-semibold opacity-80">TRANSAKSI MASUK</p>
          <p class="font-semibold">${pemasukan.length} Tx</p>
          <p class="font-semibold">${formatterRupiah(masuk)}</p>
        </div>
        <div class="border rounded-lg p-3 w-56 border-red-500 text-red-500">
          <p class="font-semibold opacity-80">TRANSAKSI KELUAR</p>
          <p class="font-semibold">${pengeluaran.length} Tx</p>
          <p class="font-semibold">${formatterRupiah(keluar)}</p>
        </div>
        <div class="border rounded-lg p-3 w-56 border-green-500 text-green-500">
          <p class="font-semibold opacity-80">SELISIH TRANSAKSI</p>
          <p class="font-semibold">Total Tx : ${
            pemasukan.length + pengeluaran.length
          } Tx</p>
          <p class="font-semibold">Selisih : ${formatterRupiah(
            masuk - keluar
          )}</p>
        </div>
      </div>
      
      <p class="my-2 italic">Transaksi Masuk pada periode yang dipilih</p>

    <table style="width:100%; border-collapse: collapse; margin-top:10px;">
      <thead>
        <tr>
          <th style="border: 1px solid #aaa; padding: 4px;">No.</th>
          <th style="border: 1px solid #aaa; padding: 4px;">Akun</th>
          <th style="border: 1px solid #aaa; padding: 4px;">Keterangan</th>
          <th style="border: 1px solid #aaa; padding: 4px;">Nominal</th>
          <th style="border: 1px solid #aaa; padding: 4px;">Tanggal</th>
        </tr>
      </thead>
      ${pemasukan
        .map(
          (p, index) => `<tbody class="text-xs">
        <tr>
          <td style="border: 1px solid #aaa; padding: 1px 3px;text-align: center;">${
            index + 1
          }</td>
          <td style="border: 1px solid #aaa; padding: 1px 3px;">${`(${p.COA.id}) ${p.COA.name}`}</td>
          <td style="border: 1px solid #aaa; padding: 1px 3px;">
            ${p.desc}
          </td>
          <td style="border: 1px solid #aaa; padding: 1px 3px;">${formatterRupiah(
            p.nominal
          )}</td>
          <td style="border: 1px solid #aaa; padding: 1px 3px;">
            ${moment(p.created_at).format("DD/MM/YYYY")}
          </td>
        </tr>
        </tbody>`
        )
        .join("")}
    </table>

    <div class="mt-4"></div>
    <p class="my-2 italic">Transaksi Keluar pada periode yang dipilih</p>

    <table style="width:100%; border-collapse: collapse; margin-top:10px;">
      <thead>
        <tr>
          <th style="border: 1px solid #aaa; padding: 4px;">No.</th>
          <th style="border: 1px solid #aaa; padding: 4px;">Akun</th>
          <th style="border: 1px solid #aaa; padding: 4px;">Keterangan</th>
          <th style="border: 1px solid #aaa; padding: 4px;">Nominal</th>
          <th style="border: 1px solid #aaa; padding: 4px;">Tanggal</th>
        </tr>
      </thead>
      ${pengeluaran
        .map(
          (p, index) => `<tbody class="text-xs">
        <tr>
          <td style="border: 1px solid #aaa; padding: 1px 3px;text-align: center;">${
            index + 1
          }</td>
          <td style="border: 1px solid #aaa; padding: 1px 3px;">${`(${p.COA.id}) ${p.COA.name}`}</td>
          <td style="border: 1px solid #aaa; padding: 1px 3px;">
            ${p.desc}
          </td>
          <td style="border: 1px solid #aaa; padding: 1px 3px;">${formatterRupiah(
            p.nominal
          )}</td>
          <td style="border: 1px solid #aaa; padding: 1px 3px;">
            ${moment(p.created_at).format("DD/MM/YYYY")}
          </td>
        </tr>
        </tbody>`
        )
        .join("")}
    </table>
  `;
};
