import { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Space,
  Table,
  Tag,
  Button,
  TableProps,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Tooltip,
  Progress,
  Select,
  DatePicker,
} from "antd";
import {
  MapPin,
  GitBranch,
  Plus,
  Edit,
  Trash2,
  Save,
  XCircle,
  CheckCircle,
  Clock,
  PiggyBank,
  TrendingUp,
  Wallet,
  BookOpen,
  Gauge,
  FileText, // Ikon baru
} from "lucide-react";
import { nanoid } from "nanoid";
// Memperbaiki ERROR: Mengganti 'moment' dengan 'dayjs', yang lebih ringan dan merupakan standar modern Ant Design.
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

// ==========================================================
// MOCK DEPENDENCIES (Menggantikan import eksternal)
// ==========================================================

// Definisi Interface untuk Data Pengajuan
interface Submission {
  id: string;
  submissionId: string; // ID unik pengajuan (misal: APP-001)
  clientName: string; // Nama Klien
  branchCode: string; // Kode Cabang
  plafondRequested: number; // Plafon yang diajukan
  submissionDate: string; // Tanggal Pengajuan (ISO String)
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
}

interface FilterItem {
  key: string;
  value: string;
}

interface IPageProps<T> {
  loading: boolean;
  page: number;
  pageSize: number;
  data: T[];
  total: number;
  filters: FilterItem[];
}

// Menggantikan '../Util' usePermission
const usePermission = () => ({
  canWrite: true, // Bisa Tambah
  canUpdate: true, // Bisa Edit
  canDelete: true, // Bisa Hapus
});

// Mock Master Data Pengajuan
const MOCK_SUBMISSION_DATA: Submission[] = [
  {
    id: nanoid(10),
    submissionId: "APP-1001",
    clientName: "Budi Santoso",
    branchCode: "JKT001",
    plafondRequested: 500000000,
    submissionDate: dayjs().subtract(10, "days").toISOString(),
    status: "APPROVED",
  },
  {
    id: nanoid(10),
    submissionId: "APP-1002",
    clientName: "Siti Aisyah",
    branchCode: "SBY005",
    plafondRequested: 150000000,
    submissionDate: dayjs().subtract(5, "days").toISOString(),
    status: "PENDING",
  },
  {
    id: nanoid(10),
    submissionId: "APP-1003",
    clientName: "Joko Susilo",
    branchCode: "BDG010",
    plafondRequested: 25000000,
    submissionDate: dayjs().subtract(3, "days").toISOString(),
    status: "REJECTED",
  },
  {
    id: nanoid(10),
    submissionId: "APP-1004",
    clientName: "Mega Puspita",
    branchCode: "SMG002",
    plafondRequested: 750000000,
    submissionDate: dayjs().subtract(1, "days").toISOString(),
    status: "PENDING",
  },
];

// Mock Data Rekap Finansial (Contoh data untuk simulasi)
const MOCK_RECAP_DATA = {
  totalPlafond: 15000000000, // Total Plafon (Limit)
  totalAdminFee: 750000000, // Total Biaya Admin
  totalStampDutyFee: 15000000, // Total Biaya Materai
  totalRealization: 12000000000, // Total Realisasi/Pencairan
  totalOutstanding: 3000000000, // Sisa Plafon
};

// Fungsi format mata uang IDR
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// ==========================================================
// KOMPONEN REKAP FINANSIAL (Tidak berubah)
// ==========================================================

const FinancialRecapCard = () => {
  const realizationPercentage =
    (MOCK_RECAP_DATA.totalRealization / MOCK_RECAP_DATA.totalPlafond) * 100;

  const recapItems = [
    {
      label: "Total Plafon (Limit)",
      value: formatCurrency(MOCK_RECAP_DATA.totalPlafond),
      icon: PiggyBank,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      label: "Total Realisasi",
      value: formatCurrency(MOCK_RECAP_DATA.totalRealization),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Total Biaya Admin",
      value: formatCurrency(MOCK_RECAP_DATA.totalAdminFee),
      icon: BookOpen,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      label: "Total Biaya Materai",
      value: formatCurrency(MOCK_RECAP_DATA.totalStampDutyFee),
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Sisa Plafon (Outstanding)",
      value: formatCurrency(MOCK_RECAP_DATA.totalOutstanding),
      icon: Wallet,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  return (
    <Card
      title={
        <Title level={4} className="!mb-0 flex items-center space-x-2">
          <Gauge size={20} className="text-gray-700" />
          <span>Rekapitulasi Finansial Global</span>
        </Title>
      }
      className="shadow-xl border border-gray-100 rounded-xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {recapItems.map((item, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg flex items-center space-x-4 ${item.bgColor}`}
          >
            <div className={`p-3 rounded-full ${item.bgColor}`}>
              <item.icon size={24} className={item.color} />
            </div>
            <div className="flex flex-col">
              <Text type="secondary" className="text-xs uppercase font-medium">
                {item.label}
              </Text>
              <Title level={4} className="!mt-0 !mb-0 text-gray-800">
                {item.value}
              </Title>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <Text strong className="block mb-2 text-sm text-gray-700">
          Progres Realisasi Plafon: ({realizationPercentage.toFixed(2)}%)
        </Text>
        <Tooltip
          title={`${realizationPercentage.toFixed(2)}% Telah Direalisasikan`}
        >
          <Progress
            percent={parseFloat(realizationPercentage.toFixed(2))}
            size="small"
            strokeColor="#4f46e5" // Warna ungu (indigo)
          />
        </Tooltip>
      </div>
    </Card>
  );
};

// ==========================================================
// KOMPONEN UTAMA (Diubah untuk Data Pengajuan)
// ==========================================================

export default function SubmissionManagement() {
  const [form] = Form.useForm();
  const { canWrite, canUpdate, canDelete } = usePermission();

  // State untuk menyimpan semua data Pengajuan (simulasi database)
  const [masterData, setMasterData] =
    useState<Submission[]>(MOCK_SUBMISSION_DATA);

  // State untuk Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [pageProps, setPageProps] = useState<IPageProps<Submission>>({
    // Menggunakan Submission
    loading: false,
    page: 1,
    pageSize: 10,
    data: [],
    total: masterData.length,
    filters: [],
  });

  // --- FUNGSI DATA SIMULASI (Menggantikan fetch API) ---
  const getData = async () => {
    setPageProps((prev) => ({ ...prev, loading: true }));

    await new Promise((resolve) => setTimeout(resolve, 300));

    const startIndex = (pageProps.page - 1) * pageProps.pageSize;
    const paginatedData = masterData.slice(
      startIndex,
      startIndex + pageProps.pageSize
    );

    setPageProps((prev) => ({
      ...prev,
      loading: false,
      data: paginatedData,
      total: masterData.length,
    }));
  };

  useEffect(() => {
    getData();
  }, [
    pageProps.filters,
    pageProps.page,
    pageProps.pageSize,
    masterData.length,
  ]);

  // --- HANDLER MODAL DAN CRUD ---

  const openCreateModal = () => {
    if (!canWrite)
      return message.error(
        "Anda tidak memiliki izin untuk menambah pengajuan."
      );
    setIsEditing(false);
    setModalTitle("Tambah Data Pengajuan Baru");
    form.resetFields();
    // Set nilai default untuk tanggal pengajuan menggunakan dayjs
    form.setFieldsValue({ submissionDate: dayjs() });
    setIsModalOpen(true);
  };

  const openEditModal = (record: Submission) => {
    if (!canUpdate)
      return message.error(
        "Anda tidak memiliki izin untuk mengedit pengajuan."
      );
    setIsEditing(true);
    setModalTitle(`Edit Pengajuan: ${record.submissionId}`);
    // Set fields value, pastikan tanggal dikonversi ke object dayjs
    form.setFieldsValue({
      ...record,
      submissionDate: dayjs(record.submissionDate),
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSave = async (values: any) => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Konversi dayjs object ke ISO String
    const formattedValues: Submission = {
      ...values,
      submissionDate: values.submissionDate.toISOString(),
      plafondRequested: Number(values.plafondRequested), // Pastikan Plafon adalah angka
    };

    if (isEditing) {
      // Logika Update
      setMasterData((prev) =>
        prev.map((submission) =>
          submission.id === formattedValues.id ? formattedValues : submission
        )
      );
      message.success(
        `Pengajuan ${formattedValues.submissionId} berhasil diperbarui!`
      );
    } else {
      // Logika Create
      const newSubmission: Submission = {
        ...formattedValues,
        id: nanoid(10),
        submissionId: `APP-${Math.floor(Math.random() * 9000) + 1000}`, // ID acak baru
        status: "DRAFT", // Default status
      };
      setMasterData((prev) => [newSubmission, ...prev]);
      message.success(
        `Pengajuan ${newSubmission.submissionId} berhasil ditambahkan!`
      );
    }

    setPageProps((prev) => ({ ...prev, loading: false }));
    handleCancel();
  };

  const handleDelete = async (record: Submission) => {
    if (!canDelete)
      return message.error(
        "Anda tidak memiliki izin untuk menghapus pengajuan."
      );

    setPageProps((prev) => ({ ...prev, loading: true }));
    await new Promise((resolve) => setTimeout(resolve, 300));

    setMasterData((prev) =>
      prev.filter((submission) => submission.id !== record.id)
    );
    message.success(`Pengajuan ${record.submissionId} berhasil dihapus.`);

    setPageProps((prev) => ({ ...prev, loading: false }));
  };

  // --- KOLOM TABEL UNTUK PENGAJUAN ---
  const submissionColumns: TableProps<Submission>["columns"] = [
    {
      title: "NO",
      dataIndex: "no",
      key: "no",
      width: 60,
      align: "center",
      render(value, record, index) {
        return <>{(pageProps.page - 1) * pageProps.pageSize + index + 1}</>;
      },
    },
    {
      title: (
        <Space>
          <FileText size={16} /> ID Pengajuan
        </Space>
      ),
      dataIndex: "submissionId",
      key: "submissionId",
      width: 140,
      render: (text: string) => (
        <Text copyable strong className="text-indigo-700">
          {text}
        </Text>
      ),
    },
    {
      title: "Nama Klien",
      dataIndex: "clientName",
      key: "clientName",
      sorter: (a, b) => a.clientName.localeCompare(b.clientName),
    },
    {
      title: "Plafon Diajukan",
      dataIndex: "plafondRequested",
      key: "plafondRequested",
      width: 150,
      align: "right",
      render: (amount: number) => <Text strong>{formatCurrency(amount)}</Text>,
      sorter: (a, b) => a.plafondRequested - b.plafondRequested,
    },
    {
      title: "Cabang",
      dataIndex: "branchCode",
      key: "branchCode",
      width: 100,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: "Tgl. Pengajuan",
      dataIndex: "submissionDate",
      key: "submissionDate",
      width: 140,
      // Menggunakan dayjs untuk rendering
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
      // Menggunakan dayjs untuk sorting
      sorter: (a, b) =>
        dayjs(a.submissionDate).valueOf() - dayjs(b.submissionDate).valueOf(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: Submission["status"]) => {
        let color, label, Icon;
        switch (status) {
          case "APPROVED":
            color = "success";
            label = "Disetujui";
            Icon = CheckCircle;
            break;
          case "PENDING":
            color = "warning";
            label = "Menunggu";
            Icon = Clock;
            break;
          case "REJECTED":
            color = "error";
            label = "Ditolak";
            Icon = XCircle;
            break;
          case "DRAFT":
          default:
            color = "default";
            label = "Draft";
            Icon = FileText;
            break;
        }
        return (
          <Tag icon={<Icon size={14} />} color={color}>
            {label.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      width: 130,
      align: "center",
      render: (_, record: Submission) => (
        <Space size="small">
          {canUpdate && (
            <Button
              icon={<Edit size={14} />}
              type="primary"
              size="small"
              onClick={() => openEditModal(record)}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="Hapus Pengajuan"
              description={`Anda yakin ingin menghapus pengajuan ${record.submissionId} milik ${record.clientName}?`}
              onConfirm={() => handleDelete(record)}
              okText="Ya, Hapus"
              cancelText="Batal"
              placement="topRight"
            >
              <Button
                icon={<Trash2 size={14} />}
                danger
                type="default"
                size="small"
              >
                Hapus
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // --- RENDER UTAMA ---
  return (
    <div className="space-y-6 p-4 md:p-8 bg-gray-50 min-h-screen">
      <Title level={2} className="text-gray-900 flex items-center">
        <GitBranch className="mr-3 text-indigo-600" /> Manajemen Data Pengajuan
      </Title>

      {/* KOMPONEN REKAPITULASI FINANSIAL */}
      <FinancialRecapCard />

      {/* --- DATA PENGAJUAN --- */}
      <Card
        className="shadow-lg"
        title={
          <Space>
            <FileText size={20} /> Data Pengajuan
          </Space>
        }
        extra={
          canWrite && (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={openCreateModal}
              size="middle"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Tambah Pengajuan
            </Button>
          )
        }
      >
        <Table
          dataSource={pageProps.data}
          columns={submissionColumns} // Menggunakan kolom Pengajuan
          rowKey="id"
          loading={pageProps.loading}
          pagination={{
            current: pageProps.page,
            pageSize: pageProps.pageSize,
            pageSizeOptions: [10, 20, 50],
            total: pageProps.total,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} dari ${total} item`,
            onChange(page, pageSize) {
              setPageProps((prev) => ({ ...prev, page, pageSize }));
            },
          }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: "Tidak ada data pengajuan yang ditemukan." }}
          size="middle"
        />
      </Card>

      {/* --- MODAL TAMBAH/EDIT PENGAJUAN --- */}
      <Modal
        title={
          <Title level={4} className="flex items-center space-x-2">
            <FileText size={20} className="text-indigo-600" />
            <span>{modalTitle}</span>
          </Title>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            id: "",
            submissionId: "",
            clientName: "",
            branchCode: "JKT001",
            plafondRequested: 100000000,
            submissionDate: dayjs(),
          }}
        >
          {/* Input ID (Hidden) */}
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="submissionId" hidden>
            <Input />
          </Form.Item>

          {/* Input Tanggal Pengajuan */}
          <Form.Item
            name="submissionDate"
            label="Tanggal Pengajuan"
            rules={[{ required: true, message: "Pilih Tanggal Pengajuan!" }]}
          >
            <DatePicker format="DD/MM/YYYY" className="w-full" />
          </Form.Item>

          {/* Input Nama Klien */}
          <Form.Item
            name="clientName"
            label="Nama Klien"
            rules={[{ required: true, message: "Masukkan Nama Klien!" }]}
          >
            <Input placeholder="Nama lengkap klien" maxLength={50} />
          </Form.Item>

          {/* Input Plafon Diajukan */}
          <Form.Item
            name="plafondRequested"
            label="Plafon Diajukan (Rp)"
            rules={[
              { required: true, message: "Masukkan Plafon Diajukan!" },
              {
                type: "number",
                min: 1000000,
                max: 10000000000,
                message: "Minimal Rp 1 Juta, Maksimal Rp 10 Milyar.",
              },
            ]}
          >
            <Input type="number" placeholder="Contoh: 150000000" />
          </Form.Item>

          {/* Input Kode Cabang */}
          <Form.Item
            name="branchCode"
            label="Cabang"
            rules={[{ required: true, message: "Pilih Kode Cabang!" }]}
          >
            <Select placeholder="Pilih Cabang">
              <Option value="JKT001">JKT001 - Jakarta Selatan</Option>
              <Option value="SBY005">SBY005 - Surabaya Rungkut</Option>
              <Option value="BDG010">BDG010 - Bandung Kopo</Option>
              <Option value="SMG002">SMG002 - Semarang Simpang Lima</Option>
            </Select>
          </Form.Item>

          {/* Tombol Aksi */}
          <Form.Item className="mt-6">
            <Space className="w-full justify-end">
              <Button onClick={handleCancel} icon={<XCircle size={16} />}>
                Batal
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<Save size={16} />}
                loading={pageProps.loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isEditing ? "Simpan Perubahan" : "Buat Pengajuan"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
