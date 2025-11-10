// import di atas file
import dayjs from "dayjs";
import "dayjs/locale/id"; // jika perlu
import { calculateWeeklyPayment, formatterRupiah } from "../Util";
import { IDapem } from "../Interface";
import moment from "moment";
dayjs.locale("id");

// gunakan formatterRupiah yang sudah ada di Util
// import { formatterRupiah } from "../Util";

// Terjemah angka -> kata (sederhana, up to triliun cukup)
const numberToWordsID = (n: number): string => {
  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  const toWords = (x: number): string => {
    x = Math.floor(x);
    if (x < 12) return satuan[x];
    if (x < 20) return toWords(x - 10) + " Belas";
    if (x < 100)
      return (
        toWords(Math.floor(x / 10)) +
        " Puluh" +
        (x % 10 ? " " + toWords(x % 10) : "")
      );
    if (x < 200) return "Seratus" + (x - 100 ? " " + toWords(x - 100) : "");
    if (x < 1000)
      return (
        toWords(Math.floor(x / 100)) +
        " Ratus" +
        (x % 100 ? " " + toWords(x % 100) : "")
      );
    if (x < 2000) return "Seribu" + (x - 1000 ? " " + toWords(x - 1000) : "");
    if (x < 1000000)
      return (
        toWords(Math.floor(x / 1000)) +
        " Ribu" +
        (x % 1000 ? " " + toWords(x % 1000) : "")
      );
    if (x < 1000000000)
      return (
        toWords(Math.floor(x / 1000000)) +
        " Juta" +
        (x % 1000000 ? " " + toWords(x % 1000000) : "")
      );
    if (x < 1000000000000)
      return (
        toWords(Math.floor(x / 1000000000)) +
        " Miliar" +
        (x % 1000000000 ? " " + toWords(x % 1000000000) : "")
      );
    return x.toString();
  };
  if (n === 0) return "Nol";
  return toWords(n);
};

const toRoman = (month: number): string => {
  const romans = [
    "",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  return romans[month];
};

export const generateContractHtml = (record: IDapem) => {
  const hari = dayjs(record.process_date || new Date()).format("dddd");
  const tanggal = dayjs(record.process_date || new Date()).format(
    "DD MMMM YYYY"
  );
  const processDate = dayjs(record?.process_date || new Date());
  const monthRoman = toRoman(processDate.month() + 1); // dayjs.month() 0-based
  const year = processDate.year();

  const noPerjanjian = `${record.id}/WEEKLY-FAS/${monthRoman}/${year}`;

  const nama = record?.DataDebitur?.name || "[Nama Lengkap]";
  const alamat = record?.DataDebitur?.alamat || "[Alamat Lengkap Pemohon]";
  const nik = record?.DataDebitur?.nik || "[Nomor NIK Pemohon]";
  const tujuan = record?.description || "[Tujuan Pinjaman]";
  const jangkaWaktu = record?.tenor || "[Jumlah]";
  const plafon = Number(record?.plafon || 0);
  const admin = Number(record?.plafon * (record.by_admin / 100));
  const tatalaksana = Number(record?.plafon * (record.by_tatalaksana / 100));
  const angsuran = calculateWeeklyPayment(plafon, record.margin, record.tenor);

  const rows =
    record?.JadwalAngsuran?.map((j) => {
      const jatuhTempo = dayjs(j.jadwal_bayar).locale("id");
      const hari = jatuhTempo.format("dddd"); // <-- Tambah kolom hari
      const tanggal = jatuhTempo.format("DD/MM/YYYY");
      const bayar = j.tanggal_bayar
        ? dayjs(j.tanggal_bayar).format("DD/MM/YYYY")
        : "-";
      const total = (j.pokok ?? 0) + (j.margin ?? 0);

      return `
      <tr>
        <td class="border px-2 py-1 text-center">${j.angsuran_ke}</td>
        <td class="border px-2 py-1 text-center capitalize">${hari}</td>
        <td class="border px-2 py-1 text-center">${tanggal}</td>
        <td class="border px-2 py-1 text-right">${formatterRupiah(total)}</td>
        <td class="border px-2 py-1 text-center">${bayar}</td>
        <td class="border px-2 py-1 text-center">________________</td>
      </tr>
    `;
    }).join("") || "";

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }

        html, body {
          height: 100%;
          font-family: Cambria, Georgia, 'Times New Roman', Times, serif;
          font-size: 14px;
        }

        /* Header tetap muncul di setiap halaman */
        @media print {
          .page-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            text-align: center;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            background: white;
          }

          /* Tambahkan margin atas di body supaya tidak tertutup header */
          body {
            margin-top: 100px;
          }

          /* Pemisah halaman */
          .page-break {
            page-break-before: always;
            break-before: page;
            display: block;
            height: 0;
            border: none;
          }
        }
      </style>
    </head>
    <body class="bg-white text-gray-800 leading-relaxed p-8">
    <!-- Header -->
    <div class="page-header flex items-center justify-between mb-6 border-b pb-4">
      <img src="/kopnas.png" alt="Logo" class="h-16 mr-4" />
      <div class="text-center">
      <h2 class="text-center text-lg font-semibold mb-2 underline">PERJANJIAN KREDIT / PINJAMAN</h2>
    <p class="text-center ">NO: ${noPerjanjian}</p>
      </div>
      <img src="/app_logo.png" alt="Logo" class="h-16 mr-4" />
    </div>

      <div class="max-w-[800px] mx-auto">
        <!-- Pembuka -->
        <p class="mb-4">
          Pada hari ini, <strong>${hari}, ${tanggal}</strong>, telah dibuat dan ditandatangani perjanjian kredit
          (selanjutnya disebut "Perjanjian") oleh dan antara:
        </p>

        <h3 class="font-semibold mb-2">I. PIHAK PERTAMA</h3>
        <p class="mb-4 pl-4 text-justify">
          Koperasi Jasa Fadillah Aqila Sejahtera, beralamat di Perum Pondok Permai Lestari Blok G-4 No.9 – Bandung,
          dalam hal ini diwakili oleh <strong>Eva Fajar Nurhasanah</strong> selaku Ketua Koperasi dan menunjuk
          <strong>Ari Alamsyah</strong> untuk kepentingan perjanjian kredit. Selanjutnya disebut <strong>PIHAK PERTAMA</strong>.
        </p>

        <h3 class="font-semibold mb-2">II. PIHAK KEDUA</h3>
        <p class="mb-4 pl-4 text-justify">
          ${nama}, beralamat di ${alamat} ${record.DataDebitur.kelurahan} ${
    record.DataDebitur.kecamatan
  }, ${record.DataDebitur.kota} ${record.DataDebitur.provinsi} ${
    record.DataDebitur.kode_pos
  }, dengan nomor identitas/NIK ${nik} dan bernomor telepon ${
    record.DataDebitur.no_telepon
  }. Selanjutnya disebut <strong>PIHAK KEDUA</strong>.
        </p>

        <p class="mb-4">
          PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut "PARA PIHAK". PARA PIHAK telah sepakat untuk membuat Perjanjian Kredit dengan ketentuan sebagai berikut:
        </p>


        <h3 class="font-semibold mt-4 mb-2 text-center"><p>PASAL 1</p><p>JUMLAH DAN TUJUAN PINJAMAN</p></h3>
        <ol class="list-decimal list-outside mb-4 space-y-1">
          <li>PIHAK PERTAMA dengan inin setuju untuk memberikan fasilitas pinjaman kepada PIHAK KEDUA sebesar <strong>${formatterRupiah(
            plafon
          )}</strong> ,- <strong>(${numberToWordsID(
    plafon
  )} Rupiah)</strong>.</li>
          <li>
          <p>PIHAK KEDUA dengan ini menyetujui bahwa telah menerima uang pinjaman dari PIHAK PERTAMA dengan rincian sebagai berikut:</p>
          <ol class="ml-4 list-[lower-alpha] list-outside">
            <li><div class="flex gap-5">
              <div class="w-56">a. Plafon Pengajuan </div>
              <div class="w-5">:</div>
              <div>${formatterRupiah(plafon)}</div>
            </div></li>
            <li><div class="flex gap-5">
              <div class="w-56">a. Biaya Admin </div>
              <div class="w-5">:</div>
              <div>${formatterRupiah(admin)}</div>
            </div></li>
            <li><div class="flex gap-5">
              <div class="w-56">a. Biaya Tatalaksana </div>
              <div class="w-5">:</div>
              <div>${formatterRupiah(tatalaksana)}</div>
              </div></li>
              <li><div class="flex gap-5">
                <div class="w-56">a. Biaya Materai </div>
                <div class="w-5">:</div>
                <div>${formatterRupiah(record.by_materai)}</div>
              </div></li>
            <li><div class="flex gap-5">
              <div class="w-56">a. Tabungan </div>
              <div class="w-5">:</div>
              <div>${formatterRupiah(record.by_tabungan)}</div>
            </div></li>
            <li><div class="flex gap-5">
              <div class="w-56">a. Terima Bersih </div>
              <div class="w-5">:</div>
              <div>${formatterRupiah(
                plafon -
                  (admin + tatalaksana + record.by_tabungan + record.by_materai)
              )}</div>
            </div></li>
          </ol>
          </li>
          ${
            record.description &&
            `<li>PIHAK KEDUA menyatakan bahwa uang pinjaman tersebut akan digunakan untuk keperluan <em>${tujuan}</em>.</li>`
          }
        </ol>


        <h3 class="font-semibold mt-4 mb-2 text-center"><p>PASAL 2</p><p>JANGKA WAKTU PINJAMAN</p></h3>
        <ol class="list-decimal list-outside mb-4 space-y-1">
          <li>Jangka waktu pinjaman ini adalah/selama <strong>${jangkaWaktu} Minggu</strong>. terhitung sejak tanggal Perjanjian ini ditandatangani</li>
          <li>PIHAK KEDUA wajib membayar angsuran pokok dan bunga pinjaman (${
            record.margin
          }%) kepada PIHAK PERTAMA setiap minggu</li>
          <li>Besaran angsuran mingguan yang wajib dibayarkan oleh PIHAK KEDUA adalah <strong>${formatterRupiah(
            angsuran
          )} ,- (${numberToWordsID(angsuran)})</strong>.</li>
        </ol>

        <h3 class="font-semibold mt-4 mb-2 text-center"><p>PASAL 3</p><p>SAKSI KETERLAMBATAN (DENDA)</p></h3>
        <ol class="list-decimal list-outside mb-4 space-y-1">
          <li>Jika 1.	Apabila PIHAK KEDUA terlambat melakukan pembayaran angsuran mingguan dari tanggal jatuh tempo yang telah ditetapkan, maka PIHAK KEDUA dikenakan denda/sanksi keterlambatan.</li>
          <li>Besaran denda keterlambatan adalah <em>1%</em> per hari dari jumlah angsuran tertunggak.</li>
        </ol>

        <h3 class="font-semibold mt-4 mb-2 text-center"><p>PASAL 4</p><p>JAMINAN KREDIT</p></h3>
        <ol class="list-decimal list-outside mb-4 space-y-1">
          ${
            record.Jaminan &&
            `<li>
                PIHAK KEUDA setuju untuk menjaminkan 
                ${record.Jaminan.map((j) => j.name).join(", ")}
               Kepada PIHAK PERTAMA</li>`
          }
          <li>PIHAK PERTAMA berhak menyimpan Jaminan tersebut hingga semua tunggakan PIHAK KEDUA dinyatakan Lunas.</li>
          <li>PIHAK PERTAMA berhak penuh atas Jaminan tersebut dan dapat melakukan penjualan atau langkah hukum lain jika PIHAK KEDUA dinyatakan Wanprestasi (Gagal Bayar) setelah melewati masa tunggu/peringatan yang disepakati.</li>
        </ol>

        <h3 class="font-semibold mt-4 mb-2 text-center"><p>PASAL 5</p><p>PENYELESAIAN MASALAH</p></h3>
        <ol class="list-decimal list-outside mb-4 space-y-1">
          <li>Apabila terjadi perselisihan atau sengketa dalam pelaksanaan Perjanjian ini, PARA PIHAK sepakat untuk menyelesaikannya secara musyawarah untuk mencapai mufakat.</li>
          <li>Apabila musyawarah tidak mencapai mufakat, PARA PIHAK sepakat untuk menyelesaikan perselisihan tersebut melalui jalur hukum dan memilih domisili hukum yang tetap di Kantor Kepaniteraan Pengadilan Negeri Subang.</li>
        </ol>

        <div class="grid grid-cols-2 gap-6 mt-12">
          <div class="text-center">
            <p class="mb-16 font-semibold">PIHAK PERTAMA</p>
             <p class="mb-12 text-xs opacity-0">Materai</p>
            <p class="font-semibold w-[50%] border-b">ARI ALAMSYAH</p>
          </div>
          <div class="text-center">
            <p class="mb-16 font-semibold">PIHAK KEDUA</p>
            <p class="mb-12 text-xs opacity-50">Materai</p>
            <p class="font-semibold w-[50%] border-b">${nama}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-6 mt-12">
          <div class="text-center">
          </div>
          <div class="text-center">
            <p class="mb-16 font-semibold">PENJAMIN</p>
            <p class="mb-12 text-xs opacity-0">materai</p>
            <p class="font-semibold w-[50%] border-b"></p>
          </div>
        </div>

        <div class="page-break">
          <div class="max-w-[800px] mx-auto mt-24">
          <div class="mb-4">
            <div class="flex gap-2">
              <p class="w-40"><strong>Nama Peminjam</strong></p> <p class="w-5">:</p> <p>${nama}</p>
            </div>
            <div class="flex gap-2">
              <p class="w-40"><strong>Alamat</strong></p> <p class="w-5">:</p> <p>${
                record.DataDebitur.alamat
              } ${record.DataDebitur.kelurahan} ${
    record.DataDebitur.kecamatan
  }, ${record.DataDebitur.kota} ${record.DataDebitur.provinsi}</p>
            </div>
            <div class="flex gap-2">
              <p class="w-40"><strong>Tanggal Pinjam</strong></p> <p class="w-5">:</p> <p>${moment(
                record.process_date
              ).format("DD/MM/YYYY")}</p>
            </div>
            <div class="flex gap-2">
              <p class="w-40"><strong>Besar Pinjaman</strong></p> <p class="w-5">:</p> <p>${formatterRupiah(
                plafon
              )}</p>
            </div>
            <div class="flex gap-2">
              <p class="w-40"><strong>Angsuran</strong></p> <p class="w-5">:</p> <p>${formatterRupiah(
                angsuran
              )}</p>
            </div>
            <div class="flex gap-2">
              <p class="w-40"><strong>Jangka Waktu</strong></p> <p class="w-5">:</p> <p>${
                record.tenor
              } Minggu</p>
            </div>
          </div>
          <table class="w-full text-sm mt-8">
            <thead>
              <tr>
                <th class="border px-2 py-1 w-10">No</th>
                <th class="border px-2 py-1 w-10">Hari</th>
                <th class="border px-2 py-1 w-24">Jatuh Tempo</th>
                <th class="border px-2 py-1 w-24">Nominal</th>
                <th class="border px-2 py-1 w-24">Tgl Bayar</th>
                <th class="border px-2 py-1 w-32">Paraf Petugas</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="grid grid-cols-2 mt-12 text-center gap-8">
            <div>
              <p>PETUGAS</p>
              <p class="mb-20">&nbsp;</p>
              <p class="border-b"><strong>${record.Petugas.name}</strong></p>
            </div>
            <div>
              <p>PIHAK KEDUA</p>
              <p class="mb-20">&nbsp;</p>
              <p class="border-b"><strong>${nama}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;

  return html;
};

export const printContract = (record: any) => {
  const htmlContent = generateContractHtml(record);

  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) {
    alert("Popup diblokir. Mohon izinkan popup dari situs ini.");
    return;
  }

  w.document.open();
  w.document.write(htmlContent);
  w.document.close();
  w.onload = function () {
    setTimeout(() => {
      w.print();
    }, 200);
  };
};

const modalBerkas = (filename: string, url: string) => {
  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${filename}</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          background: #f9fafb;
        }
        iframe {
          width: 100%;
          height: 100vh;
          border: none;
          background: #fff;
        }
      </style>
    </head>
    <body>
      <div class="flex items-center justify-between bg-gray-100 px-4 py-2 border-b">
        <h1 class="text-lg font-semibold text-gray-700 truncate">${filename}</h1>
        <button onclick="window.close()" class="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600">Tutup</button>
      </div>
      <iframe src="${url}#toolbar=1&navpanes=0&scrollbar=1" title="${filename}"></iframe>
    </body>
  </html>
  `;
  return html;
};

export const ViewBerkas = (filename: string, url: string) => {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) {
    alert("Popup diblokir. Mohon izinkan popup dari situs ini.");
    return;
  }

  const html = modalBerkas(filename, url);
  w.document.open();
  w.document.write(html);
  w.document.close();
};
