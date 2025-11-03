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
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  CarryOutOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Search } from "lucide-react";

const { Title, Text } = Typography;

// Helper function untuk memformat Rupiah
const formatterRupiah = (value) => {
  if (!value) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
};

// --- DATA TYPES (Meniru struktur API response) ---

/**
 * Mendefinisikan warna dan ikon untuk setiap status pengajuan.
 * Ini membantu tampilan UI agar konsisten.
 */
const STATUS_MAP = {
  DRAFT: { text: "DRAFT", color: "blue", icon: <MinusCircleOutlined /> },
  PENDING: {
    text: "PENDING",
    color: "gold",
    icon: <ClockCircleOutlined />,
  },
  SETUJU: { text: "DISETUJUI", color: "green", icon: <CheckCircleOutlined /> },
  TOLAK: { text: "DITOLAK", color: "red", icon: <CloseCircleOutlined /> },
  BATAL: {
    text: "DIBATALKAN",
    color: "purple",
    icon: <ExclamationCircleOutlined />,
  },
  LUNAS: { text: "LUNAS", color: "magenta", icon: <CarryOutOutlined /> },
};

// --- KOMPONEN UTAMA ---

const ApplicationStatusMonitoring = () => {
  const [data, setData] = useState({ summary: [], recent: [] });
  const [loading, setLoading] = useState(true);

  // --- API SIMULATION ---
  const fetchApplicationStatusData = async () => {
    setLoading(true);
    try {
      // Panggil API route yang telah dibuat
      const response = await fetch("/api/monitoring/status");
      if (!response.ok) {
        throw new Error("Gagal mengambil data status pengajuan.");
      }
      const result = await response.json();

      // Simulasikan delay jaringan
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Konversi string tanggal dari mock API ke objek Date (jika diperlukan)
      const processedRecent = result.recent.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        key: item.id,
      }));

      setData({
        summary: result.summary,
        recent: processedRecent,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      // Tampilkan pesan error di UI jika perlu
      setData({ summary: [], recent: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationStatusData();
  }, []);

  // --- DEFINISI KOLOM TABEL ---
  const columns = useMemo(
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
        dataIndex: "customer",
        key: "customer",
        sorter: (a, b) => a.customer.localeCompare(b.customer),
        width: 200,
      },
      {
        title: "Plafon",
        dataIndex: "plafon",
        key: "plafon",
        render: (text) => formatterRupiah(text),
        sorter: (a, b) => a.plafon - b.plafon,
        width: 150,
      },
      {
        title: "Tenor (Bln)",
        dataIndex: "tenor",
        key: "tenor",
        sorter: (a, b) => a.tenor - b.tenor,
        width: 100,
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
        width: 160,
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
        sorter: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        width: 150,
      },
      {
        title: "Aksi",
        key: "action",
        fixed: "right",
        width: 100,
        render: () => (
          <Space size="middle">
            <Text className="text-blue-500 cursor-pointer hover:underline">
              Detail
            </Text>
          </Space>
        ),
      },
    ],
    []
  );

  // Hitung total pengajuan dari summary
  // const totalApplications = data.summary.reduce(
  //   (sum, item) => sum + item.count,
  //   0
  // );

  return (
    <div className="bg-gray-50">
      <Title level={2} className="text-xl font-bold mb-4 text-gray-800">
        Monitoring Pembiayaan
      </Title>

      <Spin spinning={loading} tip="Memuat data status...">
        {/* --- SUMMARY CARDS --- */}

        {/* --- DETAIL TABLE --- */}
        <Card
          className="shadow-md rounded-lg"
          bodyStyle={{ padding: 0 }} // Hapus padding default Card body karena tabel sudah punya padding
        >
          <div className="p-2">
            <Input
              placeholder="Cari Nama Jenis..."
              prefix={<Search size={14} />}
              style={{ width: 170 }}
              // onChange={(e) => {
              //   const filt = pageProps.filters.filter(
              //     (f) => f.key !== "search"
              //   );
              //   if (e.target.value) {
              //     filt.push({ key: "search", value: e.target.value });
              //   }
              //   setPageProps((prev) => ({ ...prev, filters: filt }));
              // }}
              size="small"
            />
          </div>
          <Table
            columns={columns as TableProps["columns"]}
            dataSource={data.recent}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800, y: 320 }}
            className="w-full"
            bordered
            size="middle"
          />
        </Card>
      </Spin>
    </div>
  );
};

export default ApplicationStatusMonitoring;
