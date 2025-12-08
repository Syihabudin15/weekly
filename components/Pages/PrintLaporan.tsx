import { IDapem } from "../Interface";
import { FullReport, LapPermohonan } from "./LapUtil";
import { ILaporan } from "@/app/api/laporan/route";

export const HeaderPage = (title?: string, subtitle?: any) => `
  <div class="page-header flex items-center justify-between mb-6 border-b pb-4">
    <img src="/kopnas.png" alt="Logo" class="h-16 mr-4" />
    <div class="text-center">
      <h2 class="text-center text-lg font-semibold mb-2 underline">${title}</h2>
      <p class="text-center ">${subtitle}</p>
    </div>
    <img src="/app_logo.png" alt="Logo" class="h-16 mr-4" />
  </div>`;

const generateLaporan = (
  data: IDapem[],
  laporan: ILaporan,
  backdate?: string[]
) => {
  return `
    <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }

        html, body {
          height: 100%;
          font-family: Cambria, Georgia, 'Times New Roman', Times, serif;
          font-size: 14px;
        }

        /* Pemisah halaman */
        .page-break {
          page-break-before: always;
          break-before: page;
          display: block;
          height: 0;
          border: none;
        }
          @media print {
            .page {
              position: relative;
              min-height: 95vh;    /* atau height A4 jika untuk print */
              padding-top: 80px;    /* ruang untuk header */
              page-break-after: always;
            }
    
            .page .page-header {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              padding: 10px;
              text-align: center;
              background: white;
              border-bottom: 1px solid #ccc;
            }
          }
      </style>
    </head>
    <body class="bg-white text-gray-800 leading-relaxed p-8 max-w-[900px]">

      <div class="page-break">
        <div class="page" style="font-size: 12px;text-align: justify;">
          ${LapPermohonan(data, backdate)}
        </div>
      </div>

      <div class="page-break">
        <div class="page" style="font-size: 12px;text-align: justify">
          ${FullReport(laporan)}
        </div>
      </div>

    </body>
  </html>
  `;
};

export const printLaporan = (
  record: IDapem[],
  laporan: ILaporan,
  backdate?: string[]
) => {
  const htmlContent = generateLaporan(record, laporan, backdate);

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
