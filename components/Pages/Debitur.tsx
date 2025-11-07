import { useEffect, useState } from "react";
import { Card, Typography, Space, Table, Tag, TableProps } from "antd";
import { Users, TrendingUp, X, Check, Clock } from "lucide-react";
import dayjs from "dayjs";
import { calculateWeeklyPayment, formatterRupiah } from "../Util";
import { IDapem, IDebitur, IPageProps } from "../Interface";

const { Title, Text } = Typography;

export default function DebtorManagement() {
  const [data, setData] = useState<IPageProps<IDebitur>>({
    loading: false,
    data: [],
    total: 0,
    page: 1,
    pageSize: 50,
    filters: [],
  });

  const getData = async () => {
    setData((prev) => ({ ...prev, loading: true }));
    const req = await fetch("/api/debitur");
    const { data } = await req.json();
    setData((prev) => ({ ...prev, loading: false, data }));
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [data.page, data.pageSize, data.filters]);

  const submissionColumns: TableProps<IDapem>["columns"] = [
    {
      title: (
        <Space>
          <Clock size={14} /> Tanggal Pengajuan
        </Space>
      ),
      dataIndex: "created_at",
      key: "created_at",
      render: (timestamp: any) => {
        return <>{dayjs(timestamp).format("DD MMM YYYY")}</>;
      },
    },
    {
      title: "Plafond",
      dataIndex: "plafon",
      key: "plafond",
      render: (text: number) => <Text strong>{formatterRupiah(text)}</Text>,
    },
    {
      title: "Angsuran Mingguan",
      dataIndex: "weeklyInstallment",
      key: "weeklyInstallment",
      render: (text: number, record) => {
        return (
          <>
            {formatterRupiah(
              calculateWeeklyPayment(record.plafon, record.margin, record.tenor)
            )}
          </>
        );
      },
    },
  ];

  // Fungsi Render Baris yang Diperluas
  const expandedRowRender = (record: IDebitur) => (
    <Table
      columns={submissionColumns}
      dataSource={record.Dapem}
      pagination={false}
      rowKey="id"
      size="small"
      scroll={{ x: 600, y: 320 }}
    />
  );

  // --- Kolom Tabel Utama Debitur ---
  const debtorColumns: TableProps<IDebitur>["columns"] = [
    {
      title: "NO",
      dataIndex: "no",
      key: "no",
      width: 80,
      render: (text: string, record, index) => <>{index + 1}</>,
    },
    {
      title: "Nama Lengkap",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "Total Pengajuan",
      dataIndex: ["Dapem"],
      key: "totalSubmissions",
      width: 150,
      render: (text: IDapem[]) => <Tag color="blue">{text.length} Kali</Tag>,
    },
  ];

  return (
    <div className="space-y-2  bg-gray-50 ">
      <Title level={2} className="text-gray-900 flex items-center">
        <Users className="mr-3" /> Manajemen Data Debitur
      </Title>
      {/* --- DAFTAR DEBITUR --- */}
      <Card className="shadow-lg">
        <Table
          dataSource={data.data}
          columns={debtorColumns}
          rowKey="id"
          size="small"
          loading={data.loading}
          pagination={{
            pageSize: data.pageSize,
            pageSizeOptions: [50, 100, 500, 1000],
            total: data.total,
            onChange(page, pageSize) {
              setData((prev) => ({ ...prev, page, pageSize }));
            },
          }}
          // Konfigurasi Expandable Row
          expandable={{
            expandedRowRender: expandedRowRender,
            rowExpandable: (record) => record.Dapem.length > 0,
          }}
          scroll={{ x: 700, y: 320 }}
          locale={{ emptyText: "Tidak ada data debitur yang ditemukan." }}
        />
      </Card>
    </div>
  );
}
