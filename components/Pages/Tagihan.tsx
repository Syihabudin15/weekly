"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Col,
  Typography,
  Popconfirm,
  DatePicker,
  Tooltip,
  Select,
} from "antd";
import {
  Receipt,
  Edit,
  Search,
  Trash2,
  DollarSign,
  Calendar,
  Info,
  User,
  Clock,
  CheckCircle,
} from "lucide-react";
import type { TableProps } from "antd";
import dayjs from "dayjs";

// =========================================================================
// INTERFACE & UTILITY (Disesuaikan dengan EKunjungan baru)
// =========================================================================

// EKunjungan dari model Prisma Anda
type EStatusKunjungan = "BELUM" | "SUDAH";

interface Angsuran {
  id: string; // JadwalAngsuran ID
  dapemId: string;
  no_trx: string;
  customerName: string; // Nama Debitur (dari relasi DataDebitur)
  pokok: number;
  margin: number;
  totalAngsuran: number; // Pokok + Margin
  jadwal_bayar: string; // Tanggal Jatuh Tempo
  tanggal_bayar: string | null; // Tanggal Bayar (null jika belum bayar)
  angsuran_ke: number;
  keterangan: string | null;
  file: string | null; // File bukti bayar/kunjungan (baru ditambahkan)
  status_kunjungan: EStatusKunjungan;
  statusPembayaran: "LUNAS" | "BELUM LUNAS" | "TERLAMBAT"; // Status yang diturunkan
}

interface IPageProps<T> {
  loading: boolean;
  page: number;
  pageSize: number;
  data: T[];
  filters: { key: string; value: string }[];
  total: number;
}
// Placeholder for usePermission, adjust import path as needed
const usePermission = () => ({
  canWrite: (path: string) => true,
  canUpdate: (path: string) => true,
  canDelete: (path: string) => true,
});

const { Text, Title } = Typography;
const { Option } = Select;

// Helper Formatter
const formatterRupiah = (value: number | string | undefined) =>
  value ? `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
const parserRupiah = (displayValue: string | undefined): number | undefined => {
  const cleaned = displayValue ? displayValue.replace(/Rp\s?|(\.)/g, "") : "";
  return cleaned ? Number(cleaned) : undefined;
};

// Fungsi untuk menentukan status pembayaran
const determineStatus = (
  jadwalBayar: string,
  tanggalBayar: string | null
): Angsuran["statusPembayaran"] => {
  if (tanggalBayar) return "LUNAS";

  const dueDate = dayjs(jadwalBayar).startOf("day");
  const today = dayjs().startOf("day");

  if (dueDate.isBefore(today, "day")) {
    return "TERLAMBAT";
  }
  return "BELUM LUNAS";
};

// =========================================================================
// FORM MODAL (Update Pembayaran Angsuran)
// =========================================================================

interface AngsuranFormProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  editingAngsuran: Angsuran | null;
  getData: () => void;
}

const AngsuranUpdateForm: React.FC<AngsuranFormProps> = ({
  isModalVisible,
  setIsModalVisible,
  editingAngsuran,
  getData,
}) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const angsuranInfo = editingAngsuran
    ? `Angsuran ke-${editingAngsuran.angsuran_ke} (${editingAngsuran.no_trx})`
    : "Detail Angsuran";

  const title = `Update Angsuran: ${angsuranInfo}`;

  React.useEffect(() => {
    if (editingAngsuran) {
      // Konversi string tanggal menjadi objek dayjs
      form.setFieldsValue({
        ...editingAngsuran,
        tanggal_bayar: editingAngsuran.tanggal_bayar
          ? dayjs(editingAngsuran.tanggal_bayar)
          : null,
      });
    } else {
      form.resetFields();
    }
  }, [editingAngsuran, form]);

  const onFinish = async (values: any) => {
    if (!editingAngsuran) return;
    setLoading(true);

    const payload = {
      ...values,
      id: editingAngsuran.id,
      // Konversi dayjs object ke string YYYY-MM-DD atau null
      tanggal_bayar: values.tanggal_bayar
        ? values.tanggal_bayar.toISOString().split("T")[0]
        : null,
      // status_kunjungan sudah berupa string 'BELUM'/'SUDAH'
    };

    // Endpoint PUT/PATCH untuk mengupdate JadwalAngsuran
    const url = `/api/jadwal-angsuran?id=${editingAngsuran.id}`;

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await getData();
        message.success(`Data angsuran berhasil diupdate!`);
        setIsModalVisible(false);
      } else {
        const errorData = await response.json();
        message.error(
          `Gagal mengupdate data! ${errorData.msg || "Terjadi kesalahan."}`
        );
      }
    } catch (error) {
      message.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isModalVisible}
      title={title}
      onCancel={() => setIsModalVisible(false)}
      width={450}
      footer={[
        <Button key="back" onClick={() => setIsModalVisible(false)}>
          Tutup
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() => form.submit()}
          loading={loading}
          icon={<CheckCircle size={16} />}
        >
          Simpan Update
        </Button>,
      ]}
    >
      {editingAngsuran && (
        <Card size="small" className="mb-4 bg-gray-50 border-gray-200">
          <Row gutter={16} className="text-sm">
            <Col span={12}>
              <Text type="secondary">Pelanggan:</Text>
            </Col>
            <Col span={12} className="text-right">
              <Text strong>{editingAngsuran.customerName}</Text>
            </Col>

            <Col span={12}>
              <Text type="secondary">Jatuh Tempo:</Text>
            </Col>
            <Col span={12} className="text-right">
              <Text>
                {dayjs(editingAngsuran.jadwal_bayar).format("DD MMM YYYY")}
              </Text>
            </Col>

            <Col span={12}>
              <Text type="secondary">Jumlah Tagihan:</Text>
            </Col>
            <Col span={12} className="text-right">
              <Text strong className="text-lg text-red-600">
                {formatterRupiah(editingAngsuran.totalAngsuran)}
              </Text>
            </Col>
          </Row>
        </Card>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ status_kunjungan: "BELUM" }}
      >
        <Form.Item
          name="tanggal_bayar"
          label={
            <Space>
              <Calendar size={16} /> Tanggal Bayar
            </Space>
          }
          rules={[{ required: false }]}
        >
          <DatePicker
            className="w-full"
            format="DD MMMM YYYY"
            placeholder="Kosongkan jika belum lunas"
          />
        </Form.Item>

        <Form.Item
          name="keterangan"
          label={
            <Space>
              <Info size={16} /> Keterangan Pembayaran
            </Space>
          }
        >
          <Input.TextArea
            rows={2}
            placeholder="Catatan pembayaran (misal: via transfer bank A)..."
          />
        </Form.Item>

        <Form.Item
          name="status_kunjungan"
          label="Status Kunjungan"
          rules={[{ required: true, message: "Pilih status kunjungan" }]}
        >
          <Select placeholder="Pilih status kunjungan">
            <Option value="BELUM">BELUM</Option>
            <Option value="SUDAH">SUDAH</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// =========================================================================
// MAIN PAGE (Manajemen Tagihan/Angsuran)
// =========================================================================

export default function AngsuranManagementPage() {
  // Data dummy yang sudah direvisi sesuai model Angsuran/JadwalAngsuran
  const mockData: Angsuran[] = [
    {
      id: "JA001",
      dapemId: "DAPEM001",
      no_trx: "TRX/001/01",
      customerName: "Budi Santoso",
      pokok: 400000,
      margin: 100000,
      totalAngsuran: 500000,
      angsuran_ke: 1,
      jadwal_bayar: "2025-05-20",
      tanggal_bayar: "2025-05-18",
      keterangan: "Lunas Awal",
      file: null,
      status_kunjungan: "SUDAH",
      statusPembayaran: "LUNAS",
    },
    {
      id: "JA002",
      dapemId: "DAPEM001",
      no_trx: "TRX/001/02",
      customerName: "Budi Santoso",
      pokok: 400000,
      margin: 100000,
      totalAngsuran: 500000,
      angsuran_ke: 2,
      jadwal_bayar: "2025-06-20",
      tanggal_bayar: null,
      keterangan: null,
      file: null,
      status_kunjungan: "BELUM",
      statusPembayaran: "BELUM LUNAS",
    },
    {
      id: "JA003",
      dapemId: "DAPEM002",
      no_trx: "TRX/002/01",
      customerName: "Citra Dewi",
      pokok: 700000,
      margin: 50000,
      totalAngsuran: 750000,
      angsuran_ke: 1,
      jadwal_bayar: "2025-04-25",
      tanggal_bayar: null,
      keterangan: null,
      file: null,
      status_kunjungan: "SUDAH",
      statusPembayaran: "TERLAMBAT",
    },
  ];

  // Logic untuk mendapatkan status aktual saat inisialisasi atau fetch
  const initialData = mockData.map((item) => ({
    ...item,
    totalAngsuran: item.pokok + item.margin,
    statusPembayaran: determineStatus(item.jadwal_bayar, item.tanggal_bayar),
  }));

  const [pageProps, setPageProps] = useState<IPageProps<Angsuran>>({
    loading: false,
    page: 1,
    pageSize: 50,
    data: initialData,
    filters: [],
    total: initialData.length,
  });

  const { canUpdate, canDelete } = usePermission();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAngsuran, setEditingAngsuran] = useState<Angsuran | null>(null);

  const handleEdit = (record: Angsuran) => {
    setEditingAngsuran(record);
    setIsModalVisible(true);
  };

  // Data fetching disimulasikan
  const getData = async () => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    // GANTI DENGAN FETCH API NYATA KE ENDPOINT JadwalAngsuran
    await new Promise((resolve) => setTimeout(resolve, 500));
    setPageProps((prev) => ({ ...prev, loading: false }));
  };

  const handleDelete = async (id: string) => {
    // Simulasi Delete API (Ganti dengan logika API nyata untuk menghapus JadwalAngsuran)
    try {
      message.success(`Jadwal Angsuran ${id} berhasil dihapus (simulasi)!`);
      await getData();
    } catch (error: any) {
      message.error(`Gagal menghapus jadwal angsuran!`);
    }
  };

  useEffect(() => {
    getData();
  }, [pageProps.page, pageProps.pageSize, pageProps.filters]);

  const getStatusColor = (status: Angsuran["statusPembayaran"]) => {
    switch (status) {
      case "LUNAS":
        return "green";
      case "BELUM LUNAS":
        return "orange";
      case "TERLAMBAT":
        return "red";
      default:
        return "default";
    }
  };

  const getKunjunganColor = (status: EStatusKunjungan) => {
    switch (status) {
      case "SUDAH":
        return "blue";
      case "BELUM":
      default:
        return "default";
    }
  };

  const columns: TableProps<Angsuran>["columns"] = [
    {
      title: "Info Debitur",
      dataIndex: "customerName",
      key: "customerName",
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Tooltip title={`ID Dapem: ${record.dapemId}`}>
            <Text strong className="text-base">
              <User size={14} className="inline mr-1" /> {text}
            </Text>
          </Tooltip>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            Angsuran ke-{record.angsuran_ke} | {record.no_trx}
          </Text>
        </Space>
      ),
    },
    {
      title: <Tooltip title="Pokok + Margin">Total Angsuran</Tooltip>,
      dataIndex: "totalAngsuran",
      key: "totalAngsuran",
      align: "right",
      sorter: (a, b) => a.totalAngsuran - b.totalAngsuran,
      render: (value: number) => formatterRupiah(value),
    },
    {
      title: "Jatuh Tempo",
      dataIndex: "jadwal_bayar",
      key: "jadwal_bayar",
      align: "center",
      sorter: (a, b) => a.jadwal_bayar.localeCompare(b.jadwal_bayar),
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Tanggal Bayar",
      dataIndex: "tanggal_bayar",
      key: "tanggal_bayar",
      align: "center",
      sorter: (a, b) =>
        (a.tanggal_bayar || "").localeCompare(b.tanggal_bayar || ""),
      render: (date: string | null) =>
        date ? (
          dayjs(date).format("DD MMM YYYY")
        ) : (
          <Text type="danger">- Belum Bayar -</Text>
        ),
    },
    {
      title: "Status Bayar",
      dataIndex: "statusPembayaran",
      key: "statusPembayaran",
      align: "center",
      filters: [
        { text: "Lunas", value: "LUNAS" },
        { text: "Belum Lunas", value: "BELUM LUNAS" },
        { text: "Terlambat", value: "TERLAMBAT" },
      ],
      onFilter: (value, record) => record.statusPembayaran === value,
      render: (status: Angsuran["statusPembayaran"]) => (
        <Tag color={getStatusColor(status)} icon={<Clock size={14} />}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Kunjungan",
      dataIndex: "status_kunjungan",
      key: "status_kunjungan",
      align: "center",
      filters: [
        { text: "Sudah", value: "SUDAH" },
        { text: "Belum", value: "BELUM" },
      ],
      onFilter: (value, record) => record.status_kunjungan === value,
      render: (status: EStatusKunjungan) => (
        <Tag color={getKunjunganColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {canUpdate("/tagihan") && (
            <Button
              icon={<Edit size={16} />}
              onClick={() => handleEdit(record)}
              type="primary"
              ghost
              size="small"
              title="Catat Pembayaran/Kunjungan"
            />
          )}
          {canDelete("/tagihan") && (
            <Popconfirm
              title={`Hapus angsuran ${record.no_trx}?`}
              description="Angsuran ini akan terhapus dari jadwal pembayaran."
              onConfirm={() => handleDelete(record.id)}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button
                icon={<Trash2 size={16} />}
                danger
                type="text"
                size="small"
                title="Hapus Jadwal Angsuran"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Manajemen Jadwal Angsuran{" "}
          <Receipt size={28} className="inline-block text-red-500" />
        </h1>
        <p className="text-gray-600 mt-1">
          Lacak dan catat pembayaran angsuran yang tergenerate secara otomatis
          dari pencairan (Dapem).
        </p>
      </div>

      <Card className="shadow-lg">
        <Space direction="vertical" size="small" className="w-full">
          {/* Toolbar Pencarian */}
          <div className="flex justify-between items-center">
            <Input
              placeholder="Cari Nama Pelanggan atau No. TRX..."
              prefix={<Search size={14} />}
              style={{ width: 300 }}
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

          {/* Tabel Data Angsuran */}
          <Table
            columns={columns}
            dataSource={pageProps.data}
            rowKey="id"
            pagination={{
              pageSize: pageProps.pageSize,
              total: pageProps.total,
              pageSizeOptions: [50, 100, 500, 1000],
              onChange(page, pageSize) {
                setPageProps((prev) => ({ ...prev, page, pageSize }));
              },
            }}
            scroll={{ x: 1000, y: 320 }}
            className="w-full"
            locale={{ emptyText: "Tidak ada jadwal angsuran ditemukan." }}
            size="small"
            loading={pageProps.loading}
          />
        </Space>
      </Card>

      {/* Modal Update Pembayaran/Kunjungan */}
      <AngsuranUpdateForm
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        editingAngsuran={editingAngsuran}
        getData={getData}
      />
    </div>
  );
}
