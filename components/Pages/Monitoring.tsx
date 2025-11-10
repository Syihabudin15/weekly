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
} from "antd";
import dayjs from "dayjs";
import { Edit, Info, Search, FolderOpen, Printer } from "lucide-react";
import {
  calculateWeeklyPayment,
  formatterRupiah,
  STATUS_MAP,
  usePermission,
} from "../Util";
import { IDapem, IPageProps } from "../Interface";
import Link from "next/link";
import { printContract } from "./PrintAkad";

const { Title } = Typography;

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
        title: "Tgl. Pengajuan",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (date) => (
          <Tooltip title={dayjs(date).format("DD MMMM YYYY HH:mm")}>
            {dayjs(date).format("DD/MM/YYYY")}
          </Tooltip>
        ),
        sorter: (a, b) => a.created_at.getTime() - b.created_at.getTime(),
        width: 120,
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

  return (
    <div className="bg-gray-50">
      <Title level={2} className="text-xl font-bold mb-4 text-gray-800">
        Monitoring Pembiayaan
      </Title>

      <Spin spinning={pageProps.loading} tip="Memuat data status...">
        <Card
          className="shadow-md rounded-lg"
          style={{ padding: 0, margin: 0 }}
        >
          <div className="p-2">
            <Input
              placeholder="Cari Nama Jenis..."
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
            size="middle"
            loading={pageProps.loading}
            rowKey={"id"}
          />
        </Card>
      </Spin>
    </div>
  );
};

export default ApplicationStatusMonitoring;
