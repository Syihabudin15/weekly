// import di atas file
import dayjs from "dayjs";
import "dayjs/locale/id"; // jika perlu
import { calculateWeeklyPayment, formatterRupiah } from "../Util";
import { IDapem } from "../Interface";
dayjs.locale("id");

// gunakan formatterRupiah yang sudah ada di Util
// import { formatterRupiah } from "../Util";

// Terjemah angka -> kata (sederhana, up to triliun cukup)
const numberToWordsID = (n: number): string => {
  const satuan = [
    "",
    "satu",
    "dua",
    "tiga",
    "empat",
    "lima",
    "enam",
    "tujuh",
    "delapan",
    "sembilan",
    "sepuluh",
    "sebelas",
  ];
  const toWords = (x: number): string => {
    x = Math.floor(x);
    if (x < 12) return satuan[x];
    if (x < 20) return toWords(x - 10) + " belas";
    if (x < 100)
      return (
        toWords(Math.floor(x / 10)) +
        " puluh" +
        (x % 10 ? " " + toWords(x % 10) : "")
      );
    if (x < 200) return "seratus" + (x - 100 ? " " + toWords(x - 100) : "");
    if (x < 1000)
      return (
        toWords(Math.floor(x / 100)) +
        " ratus" +
        (x % 100 ? " " + toWords(x % 100) : "")
      );
    if (x < 2000) return "seribu" + (x - 1000 ? " " + toWords(x - 1000) : "");
    if (x < 1000000)
      return (
        toWords(Math.floor(x / 1000)) +
        " ribu" +
        (x % 1000 ? " " + toWords(x % 1000) : "")
      );
    if (x < 1000000000)
      return (
        toWords(Math.floor(x / 1000000)) +
        " juta" +
        (x % 1000000 ? " " + toWords(x % 1000000) : "")
      );
    if (x < 1000000000000)
      return (
        toWords(Math.floor(x / 1000000000)) +
        " miliar" +
        (x % 1000000000 ? " " + toWords(x % 1000000000) : "")
      );
    return x.toString();
  };
  if (n === 0) return "nol";
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
  const angsuran = calculateWeeklyPayment(plafon, record.margin, record.tenor);

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page { size: A4; margin: 10mm; }
        html, body { height: 100%; font-size: 14px;font-family: Cambria, Georgia, 'Times New Roman', Times, serif; }
        .page-break { page-break-after: always; }
        
      </style>
    </head>
    <body class="bg-white text-gray-800 leading-relaxed p-8">
      <div class="max-w-[800px] mx-auto">

        <!-- Header -->
        <div class="flex items-center justify-between mb-6 border-b pb-4">
          <img src="/kopnas.png" alt="Logo" class="h-16 mr-4" />
          <div class="text-center">
          <h2 class="text-center text-lg font-semibold mb-2 underline">PERJANJIAN KREDIT / PINJAMAN</h2>
        <p class="text-center ">NO: ${noPerjanjian}</p>
          </div>
          <img src="/app_logo.png" alt="Logo" class="h-16 mr-4" />
        </div>

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
          ${nama}, beralamat di ${alamat} ${
    record.DataDebitur.provinsi
  }, dengan nomor identitas/NIK ${nik} dan bernomor telepon ${
    record.DataDebitur.no_telepon
  }. Selanjutnya disebut <strong>PIHAK KEDUA</strong>.
        </p>

        <p class="mb-4">
          PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut "PARA PIHAK". PARA PIHAK telah sepakat untuk membuat Perjanjian Kredit dengan ketentuan sebagai berikut:
        </p>

        <h3 class="font-semibold mt-4 mb-2">PASAL 1 — JUMLAH DAN TUJUAN PINJAMAN</h3>
        <ol class="list-decimal list-inside mb-4 space-y-1">
          <li>PIHAK PERTAMA memberikan fasilitas pinjaman sebesar <strong>${formatterRupiah(
            plafon
          )}</strong>.</li>
          <li>PIHAK KEDUA menerima dana bersih penuh pada tanggal penandatanganan perjanjian ini.</li>
          <li>Uang pinjaman digunakan untuk keperluan <em>${tujuan}</em>.</li>
        </ol>

        <h3 class="font-semibold mt-4 mb-2">PASAL 2 — JANGKA WAKTU PINJAMAN</h3>
        <ol class="list-decimal list-inside mb-4 space-y-1">
          <li>Jangka waktu pinjaman: <strong>${jangkaWaktu} Minggu</strong>.</li>
          <li>Besar angsuran mingguan: <strong>${formatterRupiah(
            angsuran
          )}</strong>.</li>
        </ol>

        <h3 class="font-semibold mt-4 mb-2">PASAL 3 — SANKSI KETERLAMBATAN</h3>
        <ol class="list-decimal list-inside mb-4 space-y-1">
          <li>Jika PIHAK KEDUA terlambat membayar, akan dikenakan denda sesuai kesepakatan.</li>
          <li>Besaran denda: <em>1%</em> per hari dari jumlah angsuran tertunggak.</li>
        </ol>

        <h3 class="font-semibold mt-4 mb-2">PASAL 4 — JAMINAN</h3>
        <p class="mb-4">PIHAK PERTAMA berhak atas jaminan yang diserahkan hingga kredit dinyatakan lunas.</p>

        <h3 class="font-semibold mt-4 mb-2">PASAL 5 — PENYELESAIAN MASALAH</h3>
        <p class="mb-4">
          Jika terjadi perselisihan, PARA PIHAK sepakat menyelesaikannya secara musyawarah. Jika gagal, penyelesaian dilakukan melalui Pengadilan Negeri Subang.
        </p>

        <div class="grid grid-cols-2 gap-6 mt-12">
          <div class="text-center">
            <p class="mb-16">PIHAK PERTAMA</p>
            <p class="font-semibold underline">ARI ALAMSYAH</p>
          </div>
          <div class="text-center">
            <p class="mb-16">PIHAK KEDUA</p>
            <p class="font-semibold underline">${nama}</p>
          </div>
        </div>

        <div class="mt-12 text-sm text-gray-600">
          <p class="text-center">Materai</p>
          <p class="text-center mt-8">Saksi: ____________________</p>
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

  // const html = modalBerkas("Akad", htmlContent);
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
