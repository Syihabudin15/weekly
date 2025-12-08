import moment from "moment";
import { IDapem } from "../Interface";
import { HeaderPage } from "./PrintLaporan";
import { calculateWeeklyPayment, formatterRupiah } from "../Util";
import { ILaporan } from "@/app/api/laporan/route";
import "moment/locale/id";
moment.locale("id");

export const LapPermohonan = (data: IDapem[], backdate?: string) => {
  const totalPlafon = data
    .filter((d) => d.status_sub === "SETUJU")
    .reduce((sum, record) => sum + record.plafon, 0);
  const totalAdm = data
    .filter((d) => d.status_sub === "SETUJU")
    .reduce((sum, record) => sum + record.plafon * (record.by_admin / 100), 0);
  const totalMaterai = data
    .filter((d) => d.status_sub === "SETUJU")
    .reduce((sum, record) => sum + record.by_materai, 0);
  const totalTab = data
    .filter((d) => d.status_sub === "SETUJU")
    .reduce((sum, record) => sum + record.by_tabungan, 0);
  const totalAngs = data
    .filter((d) => d.status_sub === "SETUJU")
    .reduce(
      (sum, record) =>
        sum +
        calculateWeeklyPayment(record.plafon, record.margin, record.tenor),
      0
    );

  return `
    ${HeaderPage(
      "LAPORAN DATA PEMBIAYAAN",
      backdate && backdate !== ","
        ? `PERIODE ${moment(backdate.split(",")[0]).format(
            "DD/MM/YYYY"
          )} ${moment(backdate.split(",")[1]).format("DD/MM/YYYY")}- `
        : "PERIODE TIDAK DIPILIH"
    )}
      
      <div class="flex justify-center flex-wrap gap-4 mt-8">
        <div class="border rounded-lg p-4 w-56">
          <p class="font-semibold opacity-80">TOTAL PERMOHONAN</p>
          <p class="font-semibold">${data.length} Debitur</p>
          <p class="font-semibold">${formatterRupiah(
            data.reduce((sum, record) => sum + record.plafon, 0)
          )}</p>
        </div>
        <div class="border rounded-lg p-4 w-56 border-yellow-500 text-yellow-500">
          <p class="font-semibold opacity-80">PERMOHONAN PENDING</p>
          <p class="font-semibold">${
            data.filter((d) => d.status_sub === "PENDING").length
          } Debitur</p>
          <p class="font-semibold">${formatterRupiah(
            data
              .filter((d) => d.status_sub === "PENDING")
              .reduce((sum, record) => sum + record.plafon, 0)
          )}</p>
        </div>
        <div class="border rounded-lg p-4 w-56 border-red-500 text-red-500">
          <p class="font-semibold opacity-80">PERMOHONAN DITOLAK</p>
          <p class="font-semibold">${
            data.filter((d) => d.status_sub === "TOLAK").length
          } Debitur</p>
          <p class="font-semibold">${formatterRupiah(
            data
              .filter((d) => d.status_sub === "TOLAK")
              .reduce((sum, record) => sum + record.plafon, 0)
          )}</p>
        </div>
        <div class="border rounded-lg p-4 w-56 border-blue-500 text-blue-500">
          <p class="font-semibold opacity-80">PERMOHONAN DISETUJUI</p>
          <p class="font-semibold">${
            data.filter((d) => d.status_sub === "SETUJU").length
          } Debitur</p>
          <p class="font-semibold">${formatterRupiah(
            data
              .filter((d) => d.status_sub === "SETUJU")
              .reduce((sum, record) => sum + record.plafon, 0)
          )}</p>
        </div>
      </div>
      
      <p class="my-2 italic">Daftar permohonan yang disetujui</p>

    <table style="width:100%; border-collapse: collapse; margin-top:10px;">
      <thead>
        <tr>
          <th style="border: 1px solid #aaa; padding: 5px;">No.</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Nama Lengkap</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Plafon & Tenor</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Angsuran</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Adm & Materai</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Tabungan</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Tgl Proses & Lunas</th>
        </tr>
      </thead>
      <tbody class="text-xs">
        ${data
          .filter((d) => d.status_sub === "SETUJU")
          .map((a, index) => {
            return `
            <tr>
              <td style="border: 1px solid #aaa; padding: 1px 3px;text-align: center;">${
                index + 1
              }</td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">${
                a.DataDebitur.name
              }</td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">
                <p>${formatterRupiah(a.plafon)}</p>
              <p>${a.tenor} Minggu</p>
              </td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">${formatterRupiah(
                calculateWeeklyPayment(a.plafon, a.margin, a.tenor)
              )}</td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">
                <p>${formatterRupiah(a.plafon * (a.by_admin / 100))}</p>
                <p>${formatterRupiah(a.by_materai)}</p>
              </td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">${formatterRupiah(
                a.by_tabungan
              )}</td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">
                <p>${moment(a.process_date).format("DD/MM/YYYY")}</p>
                <p>${moment(a.process_date)
                  .add(a.tenor, "week")
                  .format("DD/MM/YYYY")}</p>
              </td>
            </tr>
          `;
          })
          .join("")}
          <tr class="font-bold">
            <td style="border: 1px solid #aaa; padding: 1px 3px;text-align: center;"></td>
            <td style="border: 1px solid #aaa; padding: 1px 3px;text-align:center;">REKAP</td>
            <td style="border: 1px solid #aaa; padding: 1px 3px;">
              ${formatterRupiah(totalPlafon)}
            </td>
            <td style="border: 1px solid #aaa; padding: 1px 3px;">${formatterRupiah(
              totalAngs
            )}</td>
            <td style="border: 1px solid #aaa; padding: 1px 3px;">
              <p>${formatterRupiah(totalAdm)}</p>
              <p>${formatterRupiah(totalMaterai)}</p>
            </td>
            <td style="border: 1px solid #aaa; padding: 1px 3px;">${formatterRupiah(
              totalTab
            )}</td>
            <td style="border: 1px solid #aaa; padding: 1px 3px;"></td>
          </tr>
      </tbody>
    </table>
  `;
};

export const FullReport = (data: ILaporan) => {
  return `
    ${HeaderPage(
      "FULL REPORT KREDIT MINGGUAN",
      "PER PEDIODE " + moment().format("DD MMMM YYYY").toUpperCase()
    )}
      
    <div class="flex gap-4 justify-between my-8">
      
      <div class="flex-1">
        <div class="flex gap-2">
          <p class="w-40">NOA Total</p>
          <p class="w-3">:</p>
          <p class="flex-1">${data.alldeb}</p>
        </div>
        <div class="flex gap-2">
          <p class="w-40">NOA Aktif</p>
          <p class="w-3">:</p>
          <p class="flex-1">${data.debactive}</p>
        </div>
        <div class="flex gap-2">
          <p class="w-40">Kredit Yang Diberikan</p>
          <p class="w-3">:</p>
          <p class="flex-1">${formatterRupiah(data.kyd)}</p>
        </div>
        <div class="flex gap-2">
          <p class="w-40">Oustanding Total</p>
          <p class="w-3">:</p>
          <p class="flex-1">${formatterRupiah(data.os)}</p>
        </div>
        <div class="flex gap-2">
          <p class="w-40">Total Tertagih</p>
          <p class="w-3">:</p>
          <p class="flex-1">${formatterRupiah(data.tertagih)}</p>
        </div>
        <div class="flex gap-2">
          <p class="w-40">Pokok Tertagih</p>
          <p class="w-3">:</p>
          <p class="flex-1">${formatterRupiah(data.tertagihpokok)}</p>
        </div>
        
      </div>

      <div class="flex-1">
        <div class="flex gap-2">
          <p class="w-40">Tagihan Perminggu</p>
          <p class="w-3">:</p>
          <p class="flex-1">${formatterRupiah(data.monthints)}</p>
        </div>
        <div class="flex gap-2">
          <p class="w-40">NOA Lunas</p>
          <p class="w-3">:</p>
          <p class="flex-1">${data.paid}</p>
        </div>
        <div class="flex gap-2">
          <p class="w-40">Total Tunggakan</p>
          <p class="w-3">:</p>
          <p class="flex-1">${formatterRupiah(data.tertunggak)}</p>
        </div>
        <div class="flex gap-2">
          <p class="w-40">Pokok Tunggakan</p>
          <p class="w-3">:</p>
          <p class="flex-1">${formatterRupiah(data.tertunggakpokok)}</p>
        </div>
        <div class="flex gap-2">
          <p class="w-40">Sisa Oustanding Total</p>
          <p class="w-3">:</p>
          <p class="flex-1">${formatterRupiah(data.sisaos)}</p>
        </div>
        <div class="flex gap-2">
          <p class="w-40">Sisa Oustanding Pokok</p>
          <p class="w-3">:</p>
          <p class="flex-1">${formatterRupiah(data.sisaospokok)}</p>
        </div>
      </div>
    
    </div>
      
      <p class="my-2 italic">List Problem Account / Akun Bermasalah</p>

    <table style="width:100%; border-collapse: collapse; margin-top:10px;">
      <thead>
        <tr>
          <th style="border: 1px solid #aaa; padding: 5px;">No.</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Nama Lengkap</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Plafon & Tenor</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Angsuran</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Tertagih</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Tertunggak</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Outstanding</th>
          <th style="border: 1px solid #aaa; padding: 5px;">Petugas</th>
        </tr>
      </thead>
      <tbody class="text-xs">
        ${data.problem
          .map((a, index) => {
            const angs = calculateWeeklyPayment(a.plafon, a.margin, a.tenor);
            const tertagih = a.JadwalAngsuran.filter(
              (j) => j.tanggal_bayar !== null
            );
            const tunggakan = a.JadwalAngsuran.filter(
              (j) =>
                j.tanggal_bayar === null &&
                moment(j.jadwal_bayar).isSameOrBefore(moment())
            );
            return `
            <tr>
              <td style="border: 1px solid #aaa; padding: 1px 3px;text-align: center;">${
                index + 1
              }</td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">${
                a.DataDebitur.name
              }</td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">
                <p>${formatterRupiah(a.plafon)}</p>
              <p>${a.tenor} Minggu</p>
              </td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">
                <p>Total : ${formatterRupiah(angs)}</p>
                <p>Pokok : ${formatterRupiah(a.plafon / a.tenor)}</p>
              </td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">
                ${tertagih.length}x (${formatterRupiah(angs * tertagih.length)})
              </td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">
                <p>${tunggakan.length} x (${formatterRupiah(
              angs * tunggakan.length
            )})</p>
                ${tunggakan
                  .map(
                    (t) =>
                      `<p class="italic text-xs opacity-80">Ke ${
                        t.angsuran_ke
                      } - ${moment(t.jadwal_bayar).format("DD/MM/YYYY")}</p>`
                  )
                  .join("")}
              </td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">
                <p>Total : ${(() => {
                  const total = angs * a.tenor;
                  const pot = angs * tertagih.length;
                  return formatterRupiah(total - pot);
                })()}</p>
                <p>Pokok : ${(() => {
                  const total = a.plafon;
                  const pot = (a.plafon / a.tenor) * tertagih.length;
                  return formatterRupiah(total - pot);
                })()}</p>
              </td>
              <td style="border: 1px solid #aaa; padding: 1px 3px;">${
                a.Petugas ? a.Petugas.name : "-"
              }</td>
            </tr>
          `;
          })
          .join("")}
      </tbody>
    </table>
  `;
};
