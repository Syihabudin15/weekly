import { useState, useEffect, useMemo } from "react";
import {
  Table,
  Card,
  Tag,
  Space,
  Typography,
  Spin,
  Tooltip,
  Input,
  TableProps,
  Button,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import {
  Edit,
  Info,
  Search,
  FolderOpen,
  Printer,
  PrinterIcon,
} from "lucide-react";
import {
  calculateWeeklyPayment,
  formatterRupiah,
  STATUS_MAP,
  usePermission,
} from "../Util";
import { IDapem, IPageProps } from "../Interface";
import Link from "next/link";
import { printContract } from "./PrintAkad";
import { printLaporan } from "./PrintLaporan";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ApplicationStatusMonitoring = () => {
  const [pageProps, setPageProps] = useState<IPageProps<IDapem>>({
    loading: false,
    page: 1,
    pageSize: 50,
    data: [],
    total: 0,
    filters: [],
  });
  const { canProses, canUpdate } = usePermission();
  const [loadingLap, setLoadingLap] = useState(false);

  const getData = async () => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    const req = await fetch(
      `/api/dapem?page=${pageProps.page}&pageSize=${
        pageProps.pageSize
      }${pageProps.filters.map((p) => `&${p.key}=${p.value}`).join("")}`
    );
    const { data, total } = await req.json();
    setPageProps((prev) => ({ ...prev, loading: false, data, total }));
  };
  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.filters, pageProps.page, pageProps.pageSize]);

  const handleAkad = async (record: IDapem) => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    const req = await fetch("/api/wilayah", {
      method: "POST",
      body: JSON.stringify({ id: record.dataDebiturId }),
    });
    const { provinsi, kota, kecamatan, kelurahan } = await req.json();
    record.DataDebitur = {
      ...record.DataDebitur,
      provinsi,
      kota,
      kecamatan,
      kelurahan,
    };
    setPageProps((prev) => ({ ...prev, loading: false }));
    printContract(record);
  };

  const columns: TableProps<IDapem>["columns"] = useMemo(
    () => [
      {
        title: "ID Pengajuan",
        dataIndex: "id",
        key: "id",
        width: 120,
        fixed: "left",
      },
      {
        title: "Nama Debitur",
        dataIndex: ["DataDebitur", "name"],
        key: "debtorName",
        width: 180,
      },
      {
        title: "Plafon",
        dataIndex: "plafon",
        key: "plafon",
        render: (text) => formatterRupiah(text),
        sorter: (a, b) => a.plafon - b.plafon,
        width: 130,
      },
      {
        title: "Tenor",
        dataIndex: "tenor",
        key: "tenor",
        sorter: (a, b) => a.tenor - b.tenor,
        width: 80,
      },
      {
        title: "Angsuran",
        dataIndex: "angsuran",
        key: "angsuran",
        render: (text, record) => {
          const installl = calculateWeeklyPayment(
            record.plafon,
            record.margin,
            record.tenor
          );
          return (
            <Tag color="volcano" className="font-medium">
              {formatterRupiah(installl)}
            </Tag>
          );
        },
        width: 120,
      },
      {
        title: "Adm & Materai",
        dataIndex: "adm",
        key: "adm",
        render: (text, record) => {
          const adm = record.plafon * (record.by_admin / 100);
          return (
            <div className="flex flex-col text-xs">
              {/* <Tag color="blue" className="font-medium"> */}
              <span>{formatterRupiah(adm)}</span>
              {/* </Tag> */}
              {/* <Tag color="blue" className="font-medium"> */}
              <span>{formatterRupiah(record.by_materai)}</span>
              {/* </Tag> */}
            </div>
          );
        },
        width: 120,
      },
      {
        title: "Status",
        dataIndex: "status_sub",
        key: "status_sub",
        render: (status) => {
          const statusInfo = STATUS_MAP[status] || STATUS_MAP.DRAFT;
          return (
            <Tag
              color={statusInfo.color}
              icon={statusInfo.icon}
              className="py-1 px-3 text-sm rounded-full"
            >
              {statusInfo.text}
            </Tag>
          );
        },
        filters: Object.keys(STATUS_MAP).map((key) => ({
          text: STATUS_MAP[key].text,
          value: key,
        })),
        onFilter: (value, record) => record.status_sub === value,
        width: 120,
      },
      {
        title: "Tanggal",
        dataIndex: "created_at",
        key: "created_at",
        render: (date, record) => (
          <div className="text-xs flex flex-col">
            <Tooltip title={"Tgl Pengajuan"}>
              {dayjs(date).format("DD/MM/YYYY")}
            </Tooltip>
            <Tooltip title={"Tgl Akad & Pencairan"}>
              {dayjs(record.process_date).format("DD/MM/YYYY")}
            </Tooltip>
          </div>
        ),
        sorter: (a, b) => a.created_at.getTime() - b.created_at.getTime(),
        width: 130,
      },
      {
        title: "Aksi",
        key: "action",
        fixed: "right",
        width: 100,
        render: (value, record) => (
          <Space size="middle">
            {record.status_sub === "PENDING" && canProses("/monitoring") && (
              <Link href={"/pengajuan/" + record.id}>
                <Tooltip
                  title={`Klik untuk melihat/proses pengajuan ${record.id}`}
                >
                  <Button
                    icon={<Info size={12} />}
                    size="small"
                    type="primary"
                  ></Button>
                </Tooltip>
              </Link>
            )}
            {canUpdate("/monitoring") && (
              <Tooltip title={`Edit pengajuan ${record.id}`}>
                <Link href={"/pengajuan/upsert/" + record.id}>
                  <Button icon={<Edit size={12} />} size="small"></Button>
                </Link>
              </Tooltip>
            )}
            {record.status_sub !== "PENDING" &&
              record.status_sub !== "DRAFT" && (
                <Link href={"/pengajuan/" + record.id}>
                  <Tooltip
                    title={`Klik untuk melihat detail pengajuan ${record.id}`}
                  >
                    <Button
                      icon={<FolderOpen size={12} />}
                      size="small"
                      type="primary"
                    ></Button>
                  </Tooltip>
                </Link>
              )}
            <Tooltip title="Cetak Akad">
              <Button
                size="small"
                onClick={() => handleAkad(record)}
                icon={<Printer size={14} />}
              ></Button>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [canProses, canUpdate, handleAkad]
  );

  const handleCetakLaporan = async () => {
    setLoadingLap(true);
    const backdate = pageProps.filters.find((q) => q.key === "backdate");
    await fetch("/api/laporan")
      .then((res) => res.json())
      .then((res) => {
        printLaporan(pageProps.data, res, backdate && backdate.value);
      });
    setLoadingLap(false);
  };

  return (
    <div className="bg-gray-50">
      <Title level={2} className="text-xl font-bold mb-4 text-gray-800">
        Monitoring Pembiayaan
      </Title>

      <Spin spinning={pageProps.loading} tip="Memuat data status...">
        <Card
          className="shadow-md rounded-lg"
          styles={{ body: { padding: 5 } }}
        >
          <div className="p-2 flex justify-between">
            <RangePicker
              size="small"
              onChange={(e, dateStr) => {
                const filt = pageProps.filters.filter(
                  (f) => f.key !== "backdate"
                );
                if (dateStr) {
                  filt.push({ key: "backdate", value: dateStr });
                }
                setPageProps((prev) => ({ ...prev, filters: filt }));
              }}
            />
            <Button
              size="small"
              icon={<PrinterIcon size={14} />}
              type="primary"
              onClick={() => handleCetakLaporan()}
              loading={loadingLap}
              disabled={loadingLap}
            >
              Laporan
            </Button>
            <Input
              placeholder="Cari ID/Nama Debitur..."
              prefix={<Search size={14} />}
              style={{ width: 170 }}
              onChange={(e) => {
                const filt = pageProps.filters.filter(
                  (f) => f.key !== "search"
                );
                if (e.target.value) {
                  filt.push({ key: "search", value: e.target.value });
                }
                setPageProps((prev) => ({ ...prev, filters: filt }));
              }}
              size="small"
            />
          </div>
          <Table
            columns={columns}
            dataSource={pageProps.data}
            pagination={{
              pageSize: pageProps.pageSize,
              total: pageProps.total,
              pageSizeOptions: [50, 100, 200, 500, 1000],
              onChange(page, pageSize) {
                setPageProps((prev) => ({ ...prev, page, pageSize }));
              },
            }}
            scroll={{ x: 800, y: 320 }}
            className="w-full"
            bordered
            size="small"
            loading={pageProps.loading}
            rowKey={"id"}
            summary={(pageData) => {
              const totalPlafon = pageData.reduce(
                (sum, record) => sum + record.plafon,
                0
              );
              const totalAngsuran = pageData.reduce((sum, record) => {
                const installl = calculateWeeklyPayment(
                  record.plafon,
                  record.margin,
                  record.tenor
                );
                return sum + installl;
              }, 0);
              const totalAdm = pageData.reduce(
                (sum, record) => sum + record.plafon * (record.by_admin / 100),
                0
              );
              const totalMaterai = pageData.reduce(
                (sum, record) => sum + record.by_materai,
                0
              );

              return (
                <Table.Summary fixed>
                  <Table.Summary.Row
                    // 1. Latar Belakang abu-abu, teks lebih kecil, dan tebal
                    className="bg-gray-100 text-xs font-semibold text-blue-500"
                  >
                    {/* Kolom Pertama (ID Pengajuan) */}
                    <Table.Summary.Cell index={0}>TOTAL</Table.Summary.Cell>
                    {/* Kolom Kedua (Nama Debitur) */}
                    <Table.Summary.Cell index={1} />
                    {/* Kolom Ketiga (Plafon) */}
                    <Table.Summary.Cell index={2}>
                      {formatterRupiah(totalPlafon)}
                    </Table.Summary.Cell>
                    {/* Kolom Keempat (Tenor) */}
                    <Table.Summary.Cell index={3} />
                    {/* Kolom Kelima (Angsuran) */}
                    <Table.Summary.Cell index={4}>
                      {formatterRupiah(totalAngsuran)}
                    </Table.Summary.Cell>
                    {/* Sisa Kolom */}
                    <Table.Summary.Cell index={5} className="flex flex-col">
                      <span>{formatterRupiah(totalAdm)}</span>
                      <span>{formatterRupiah(totalMaterai)}</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} />
                    <Table.Summary.Cell index={7} />
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </Card>
      </Spin>
    </div>
  );
};

export default ApplicationStatusMonitoring;
