"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Space,
  Tag,
  Spin,
} from "antd";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Loader,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
} from "lucide-react";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// =========================================================================
// UTILITY FUNCTIONS & FORMATTERS
// =========================================================================

// Helper function untuk format Rupiah
const formatterRupiah = (value) => {
  if (value === null || value === undefined) return "Rp 0";
  return `Rp ${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

// Helper function untuk format angka besar (Jutaan/Milyaran)
const formatLargeNumber = (num) => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)} M`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} Jt`;
  }
  return num.toString();
};

// =========================================================================
// MOCK API FUNCTION
// =========================================================================

// Fungsi untuk mensimulasikan pemanggilan API (API Mock)
const fetchMonitoringData = async () => {
  // Simulasi delay jaringan/API selama 1.5 detik
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Data Mockup Dashboard - Ini adalah "response" dari API
  const mockKPIs = {
    totalPlafon: 8000000000,
    totalDebitur: 1050,
    totalOutstanding: 6500000000,
    totalBilled: 500000000,
    nplRate: 3.25,
    // Nominal NPL dihitung dari Total Outstanding * NPL Rate
    nominalNPL: 6500000000 * 0.0325,
  };

  const mockProductDistribution = [
    { name: "Multiguna", value: 4000000000, color: "#3b82f6" },
    { name: "Modal Kerja", value: 2500000000, color: "#f59e0b" },
    { name: "Investasi", value: 1500000000, color: "#10b981" },
  ];

  const mockAgingData = [
    {
      group: "Lancar (0)",
      debtors: 950,
      outstanding: 6000000000,
      color: "#10b981",
    },
    {
      group: "Kurang Lancar (1-30)",
      debtors: 50,
      outstanding: 300000000,
      color: "#f59e0b",
    },
    {
      group: "Diragukan (31-90)",
      debtors: 35,
      outstanding: 150000000,
      color: "#f97316",
    },
    {
      group: "Macet (> 90)",
      debtors: 15,
      outstanding: 50000000,
      color: "#ef4444",
    },
  ];

  const mockProblemAccounts = [
    {
      key: "1",
      account: "TRX/003/24",
      customer: "Dewi Anggraini",
      plafon: 450000000,
      overdueDays: 125,
      collector: "Ani",
      installmentNumber: 8,
      installmentNominal: 50000000,
    },
    {
      key: "2",
      account: "TRX/012/24",
      customer: "Fajar Kurniawan",
      plafon: 15000000,
      overdueDays: 45,
      collector: "Bima",
      installmentNumber: 3,
      installmentNominal: 1500000,
    },
    {
      key: "3",
      account: "TRX/008/24",
      customer: "Siti Rahma",
      plafon: 75000000,
      overdueDays: 32,
      collector: "Ani",
      installmentNumber: 15,
      installmentNominal: 2500000,
    },
    {
      key: "4",
      account: "TRX/021/24",
      customer: "Joko Susilo",
      plafon: 120000000,
      overdueDays: 95,
      collector: "Cahyo",
      installmentNumber: 6,
      installmentNominal: 10000000,
    },
    {
      key: "5",
      account: "TRX/001/24",
      customer: "Budi Santoso",
      plafon: 50000000,
      overdueDays: 7,
      collector: "Bima",
      installmentNumber: 2,
      installmentNominal: 8000000,
    },
  ];

  return {
    kpis: mockKPIs,
    productDistribution: mockProductDistribution,
    agingData: mockAgingData,
    problemAccounts: mockProblemAccounts,
  };
};

// =========================================================================
// COMPONENTS
// =========================================================================

// 1. Komponen Kartu KPI
const KpiCard = ({ title, value, icon, unit, color }) => (
  <Card
    // variant={"outlined"}
    className="shadow-md h-full transition duration-300 hover:shadow-lg hover:border-r-4"
    style={{ borderColor: color || "#2563eb" }}
  >
    <Space direction="horizontal" className="justify-between w-full">
      <Statistic
        title={
          <Text type="secondary" className="text-sm flex items-center">
            {icon} <span className="ml-2">{title}</span>
          </Text>
        }
        value={value}
        suffix={unit}
        valueStyle={{ color: color || "#2563eb", fontSize: "24px" }}
        // Menggunakan Math.round untuk menghindari tampilan desimal pada Rupiah kecuali NPL Rate
        formatter={(v) => (unit === "%" ? v : formatterRupiah(v))}
      />
    </Space>
  </Card>
);

// 2. Kolom Tabel Akun Bermasalah
const problemAccountColumns = [
  {
    title: "Akun",
    dataIndex: "account",
    key: "account",
    render: (text, record) => (
      <Space direction="vertical" size={0}>
        <Text strong>{text}</Text>
        <Text type="secondary" style={{ fontSize: "11px" }}>
          {record.customer}
        </Text>
      </Space>
    ),
  },
  {
    title: "Plafon",
    dataIndex: "plafon",
    key: "plafon",
    align: "right",
    render: formatterRupiah,
  },
  {
    title: "Angsuran Ke",
    dataIndex: "installmentNumber",
    key: "installmentNumber",
    align: "center",
    render: (num) => <Tag color="volcano">{num}</Tag>,
  },
  {
    title: "Nominal Angsuran",
    dataIndex: "installmentNominal",
    key: "installmentNominal",
    align: "right",
    render: formatterRupiah,
  },
  {
    title: "Terlambat (Hari)",
    dataIndex: "overdueDays",
    key: "overdueDays",
    align: "center",
    render: (days) => {
      let color = "green";
      if (days > 90) color = "red";
      else if (days > 30) color = "orange";
      return <Tag color={color}>{days} Hari</Tag>;
    },
  },
  {
    title: "Kolektor",
    dataIndex: "collector",
    key: "collector",
    align: "center",
    render: (text) => <Tag color="blue">{text}</Tag>,
  },
];

// 3. Main Dashboard Component
export default function FinancingMonitoringDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Efek untuk memuat data dari API Mock saat komponen dimuat
  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedData = await fetchMonitoringData();
        setData(fetchedData);
      } catch (error) {
        console.error("Gagal memuat data monitoring:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Tampilkan loading state
  if (loading) {
    return (
      <div className="p-8 text-center min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <Spin size="large" />
        <Text className="mt-4 text-gray-600">Memuat data dari API...</Text>
      </div>
    );
  }

  // Handle case where data might be null after loading (error or empty response)
  if (!data || !data.kpis) {
    return (
      <div className="p-8 text-center min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <AlertTriangle size={32} className="text-red-500 mb-3" />
        <Title level={4}>Gagal Memuat Data</Title>
        <Text type="secondary">
          Mohon cek kembali koneksi atau sumber data API.
        </Text>
      </div>
    );
  }

  // Destructure data setelah loading selesai
  const { kpis, productDistribution, agingData, problemAccounts } = data;

  // Custom label untuk Pie Chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
      <Text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        style={{ fontSize: 12, fontWeight: "bold" }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </Text>
    );
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      <Title level={2} className="text-gray-800 flex items-center">
        <Loader size={30} className="inline mr-2 text-red-500" /> Dashboard
        Monitoring Pembiayaan
      </Title>
      <Text type="secondary" className="mb-4 block">
        Ikhtisar metrik pembiayaan utama (per {dayjs().format("DD MMMM YYYY")}).
      </Text>

      {/* Row 1: KPI Cards - 3 Columns (Plafon, Outstanding, Tertagih) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <KpiCard
            title="Total Pencairan (Plafon)"
            value={kpis.totalPlafon}
            icon={<DollarSign size={20} />}
            color="#059669" // Emerald
          />
        </Col>
        <Col xs={24} md={8}>
          <KpiCard
            title="Total Outstanding"
            value={kpis.totalOutstanding}
            icon={<TrendingUp size={20} />}
            color="#f59e0b" // Amber
          />
        </Col>
        <Col xs={24} md={8}>
          <KpiCard
            title="Total Nominal Tertagih"
            value={kpis.totalBilled}
            icon={<CreditCard size={20} />}
            color="#2563eb" // Blue
          />
        </Col>
      </Row>

      {/* Row 2: Remaining KPIs - 3 Columns (NPL Rate, NPL Nominal, Debitur) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <KpiCard
            title="Rasio NPL (Non-Performing)"
            value={kpis.nplRate}
            icon={<AlertTriangle size={20} />}
            unit="%"
            color={kpis.nplRate > 3 ? "#ef4444" : "#059669"} // Red if > 3%
          />
        </Col>
        <Col xs={24} md={8}>
          <KpiCard
            title="Nominal NPL (Outstanding)"
            value={kpis.nominalNPL}
            icon={<AlertTriangle size={20} />}
            color="#b91c1c" // Darker Red
          />
        </Col>
        <Col xs={24} md={8}>
          <KpiCard
            title="Total Debitur Aktif"
            value={kpis.totalDebitur}
            icon={<Users size={20} />}
            unit="Orang"
            color="#6366f1" // Indigo
          />
        </Col>
      </Row>

      {/* Row 3: Charts (Distribusi & Kolektibilitas) */}
      <Row gutter={[16, 16]}>
        {/* Chart 1: Distribusi Pembiayaan berdasarkan Produk */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Title level={4} className="flex items-center">
                <CheckCircle size={20} className="mr-2 text-green-500" />{" "}
                Distribusi Plafon per Produk
              </Title>
            }
            className="shadow-md h-full"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {productDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatterRupiah(value)} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                />
              </PieChart>
            </ResponsiveContainer>
            <Text type="secondary" className="text-sm mt-2 block text-center">
              Total Pembiayaan: {formatterRupiah(kpis.totalPlafon)}
            </Text>
          </Card>
        </Col>

        {/* Chart 2: Portofolio berdasarkan Kolektibilitas (Aging) */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Title level={4} className="flex items-center">
                <Clock size={20} className="mr-2 text-yellow-600" /> Analisis
                Kolektibilitas (Aging)
              </Title>
            }
            className="shadow-md h-full"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#8884d8"
                  tickFormatter={formatLargeNumber}
                />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  formatter={(value, name, props) => {
                    if (name === "outstanding")
                      return [formatterRupiah(value), "Outstanding"];
                    return [value, "Jumlah Debitur"];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="outstanding"
                  name="Outstanding (Rp)"
                  fill="#3b82f6"
                />
                <Bar
                  yAxisId="right"
                  dataKey="debtors"
                  name="Jumlah Debitur (Orang)"
                  fill="#f59e0b"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Row 4: Detail Tabel Akun Bermasalah */}
      <Row>
        <Col span={24}>
          <Card
            title={
              <Title level={4} className="flex items-center">
                <AlertTriangle size={20} className="mr-2 text-red-500" /> Akun
                Pembiayaan Terlambat Tertinggi (Top 5)
              </Title>
            }
            className="shadow-md"
          >
            <Table
              columns={problemAccountColumns}
              dataSource={problemAccounts}
              pagination={false}
              size="middle"
              scroll={{ x: 600 }}
              locale={{ emptyText: "Tidak ada akun bermasalah ditemukan." }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
