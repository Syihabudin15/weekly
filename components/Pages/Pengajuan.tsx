import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Card,
  Row,
  Col,
  notification,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Popconfirm,
  Divider,
  Statistic,
  TableProps,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Search } from "lucide-react";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Helper: Format Rupiah
const formatterRupiah = (value) => {
  if (value === null || value === undefined || value === 0) return "Rp 0";
  // Pastikan nilai adalah angka sebelum diformat
  const numValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.]/g, ""))
      : value;
  if (isNaN(numValue)) return "Rp 0";

  return (
    "Rp " +
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
      numValue
    )
  );
};

// Helper: Status Pengajuan Map
const STATUS_MAP = {
  DRAFT: { text: "DRAFT", color: "blue" },
  PENDING: { text: "MENUNGGU REVIEW", color: "gold" },
  SETUJU: { text: "DISETUJUI", color: "green" },
  TOLAK: { text: "DITOLAK", color: "red" },
  BATAL: { text: "DIBATALKAN", color: "purple" },
  LUNAS: { text: "LUNAS", color: "magenta" },
};

// Fungsi untuk menghitung Angsuran Mingguan dan Maksimal Plafon (Sederhana, Flat Rate)
const calculateAffordability = (gaji, plafon, tenor, margin) => {
  const DSR_LIMIT = 0.3; // Maksimal 30% dari pendapatan

  // Cek kelengkapan input
  if (!gaji || !tenor || !margin || tenor <= 0 || gaji <= 0) {
    return {
      maxPlafon: 0,
      maxWeeklyInstallment: 0,
      weeklyInstallment: 0,
      isAffordable: false,
    };
  }

  // Pendekatan: Gaji Mingguan = Gaji Bulanan / 4
  const WEEKLY_INCOME = gaji / 4;
  const MAX_WEEKLY_INSTALLMENT = WEEKLY_INCOME * DSR_LIMIT;

  // Faktor Bunga Tahunan (Margin/100) dikalikan dengan Tenor (Minggu/52)
  const INTEREST_FACTOR = (margin / 100) * (tenor / 52);

  // Perhitungan Maksimal Plafon
  // Max Plafon = (Max Angsuran Mingguan * Tenor_Minggu) / (1 + Faktor Bunga)
  const MAX_PLAFON_RAW =
    (MAX_WEEKLY_INSTALLMENT * tenor) / (1 + INTEREST_FACTOR);
  const MAX_PLAFON = Math.floor(MAX_PLAFON_RAW / 10000) * 10000; // Bulatkan ke bawah ke puluhan ribu terdekat

  // Perhitungan Angsuran Mingguan untuk Plafon yang diajukan
  const WEEKLY_INSTALLMENT_RAW =
    plafon > 0 ? (plafon * (1 + INTEREST_FACTOR)) / tenor : 0;
  const WEEKLY_INSTALLMENT = Math.ceil(WEEKLY_INSTALLMENT_RAW / 100) * 100; // Bulatkan ke atas ke ratusan terdekat

  // Cek Affordability
  const isAffordable = WEEKLY_INSTALLMENT_RAW <= MAX_WEEKLY_INSTALLMENT;

  return {
    maxPlafon: MAX_PLAFON,
    maxWeeklyInstallment: Math.floor(MAX_WEEKLY_INSTALLMENT / 100) * 100,
    weeklyInstallment: WEEKLY_INSTALLMENT,
    isAffordable: isAffordable,
  };
};

// Mock Data Awal diperkaya dengan field baru termasuk familyMembers
const MOCK_APPLICATIONS = [
  {
    id: "A005",
    debtorName: "Budi Santoso",
    plafon: 25000000,
    tenor: 104,
    status_sub: "DRAFT",
    createdAt: dayjs().subtract(1, "hour").toDate(),
    produkName: "Mingguan Cepat",
    nik: "3201xxxxxxxxxxxx",
    gaji: 5000000,
    jenis_kelamin: "L",
    status_kawin: "BK",
    margin: 12.0,
    by_admin: 500000,
    description: "Dana untuk membeli motor baru.",
    weeklyInstallment: 250000,
    familyMembers: [
      { name: "Rani", relationship: "Istri", birthYear: 1995 },
      { name: "Adi", relationship: "Anak Kandung", birthYear: 2020 },
    ],
  },
  {
    id: "A004",
    debtorName: "Citra Dewi",
    plafon: 75000000,
    tenor: 52,
    status_sub: "PENDING",
    createdAt: dayjs().subtract(1, "day").toDate(),
    produkName: "Mingguan Pro",
    nik: "3202xxxxxxxxxxxx",
    gaji: 15000000,
    jenis_kelamin: "P",
    status_kawin: "K",
    margin: 10.5,
    by_admin: 1500000,
    description: "Modal usaha ekspansi cabang.",
    weeklyInstallment: 1590000,
    familyMembers: [{ name: "Joko", relationship: "Suami", birthYear: 1980 }],
  },
  {
    id: "A003",
    debtorName: "Dian Permata",
    plafon: 10000000,
    tenor: 208,
    status_sub: "SETUJU",
    createdAt: dayjs().subtract(3, "days").toDate(),
    produkName: "Mingguan Cepat",
    nik: "3203xxxxxxxxxxxx",
    gaji: 4000000,
    jenis_kelamin: "P",
    status_kawin: "K",
    margin: 14.0,
    by_admin: 300000,
    description: "Biaya pendidikan anak.",
    weeklyInstallment: 60000,
    familyMembers: [],
  },
  {
    id: "A002",
    debtorName: "Eko Widodo",
    plafon: 40000000,
    tenor: 78,
    status_sub: "TOLAK",
    createdAt: dayjs().subtract(5, "days").toDate(),
    produkName: "Mingguan Pro",
    nik: "3204xxxxxxxxxxxx",
    gaji: 7000000,
    jenis_kelamin: "L",
    status_kawin: "K",
    margin: 11.0,
    by_admin: 800000,
    description: "Pembelian stok barang dagangan.",
    weeklyInstallment: 600000,
    familyMembers: [
      { name: "Sinta", relationship: "Istri", birthYear: 1990 },
      { name: "Bimo", relationship: "Anak Kandung", birthYear: 2015 },
      { name: "Sari", relationship: "Anak Kandung", birthYear: 2018 },
    ],
  },
];
const RupiahInput = (props) => (
  <InputNumber
    formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
    parser={(value) => value && value.replace(/\Rp\s?|(,*)/g, "")}
    min={0}
    step={100000}
    className="w-full"
    {...props}
  />
);

// Fungsi pembantu untuk format Persen pada InputNumber
const PercentInput = (props) => (
  <InputNumber
    formatter={(value) => `${value}%`}
    parser={(value) => value && value.replace("%", "")}
    min={1}
    max={30}
    step={0.1}
    className="w-full"
    {...props}
  />
);
// --- Mock Form Component for New/Edit ---
const ApplicationFormModal = ({
  visible,
  onCancel,
  onSave,
  initialData,
  isSaving,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!initialData;

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(
        initialData || {
          status_sub: "DRAFT",
          tenor: 52,
          plafon: 20000000,
          margin: 12.0,
          by_admin: 500000,
          gaji: 5000000,
          familyMembers: [], // Pastikan ada array kosong untuk form list
        }
      );
    }
  }, [visible, initialData, form]);

  // Antd Form.useWatch untuk reaktif mengikuti perubahan field
  const [plafon, tenor, margin, gaji] = Form.useWatch(
    ["plafon", "tenor", "margin", "gaji"],
    form
  ) || [0, 0, 0, 0];

  // Hitung limits dan installment secara reaktif
  const limits = calculateAffordability(
    Number(gaji),
    Number(plafon),
    Number(tenor),
    Number(margin)
  );
  const { maxPlafon, maxWeeklyInstallment, weeklyInstallment, isAffordable } =
    limits;

  // Fungsi pembantu untuk format Rupiah pada InputNumber

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const calculatedLimits = calculateAffordability(
          Number(values.gaji),
          Number(values.plafon),
          Number(values.tenor),
          Number(values.margin)
        );

        if (
          !calculatedLimits.isAffordable &&
          values.gaji &&
          values.plafon &&
          values.tenor
        ) {
          notification.error({
            message: "Gagal Menyimpan",
            description: `Plafon Rp ${new Intl.NumberFormat("id-ID").format(
              values.plafon
            )} melebihi batas maksimal (Rp ${new Intl.NumberFormat(
              "id-ID"
            ).format(
              calculatedLimits.maxPlafon
            )}). Harap sesuaikan Plafon atau Tenor.`,
            duration: 8,
          });
          return;
        }

        // Pastikan nilai angka dikonversi ke Number
        const processedValues = {
          ...values,
          plafon: Number(values.plafon),
          gaji: Number(values.gaji),
          by_admin: Number(values.by_admin),
          margin: Number(values.margin),
          tenor: Number(values.tenor),
          weeklyInstallment: calculatedLimits.weeklyInstallment, // Simpan hasil perhitungan angsuran
          // Pastikan familyMembers tetap array, meskipun kosong
          familyMembers: values.familyMembers || [],
        };
        onSave(processedValues, isEdit);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  // Custom Validation rule for Plafon based on Max Plafon
  const validatePlafon = (_, value) => {
    if (!value || !gaji || !tenor || !margin) {
      return Promise.resolve(); // Lolos jika field terkait belum terisi
    }

    const currentLimits = calculateAffordability(
      Number(gaji),
      Number(value),
      Number(tenor),
      Number(margin)
    );

    if (value > currentLimits.maxPlafon && currentLimits.maxPlafon > 0) {
      return Promise.reject(
        new Error(
          `Max Plafon yang diizinkan: ${formatterRupiah(
            currentLimits.maxPlafon
          )} (DSR 30%)`
        )
      );
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title={
        isEdit ? `Edit Pengajuan #${initialData.id}` : "Input Pengajuan Baru"
      }
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={isEdit ? "Simpan Perubahan" : "Buat Pengajuan"}
      confirmLoading={isSaving}
      cancelText="Batal"
      width={850} // Lebarkan sedikit untuk menampung data keluarga
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ tenor: 52, status_sub: "DRAFT", familyMembers: [] }}
      >
        {/* --- SEKSI DATA DEBITUR UTAMA --- */}
        <Title level={5} className="mt-4 mb-2 text-blue-600">
          Data Debitur Utama
        </Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="debtorName"
              label="Nama Debitur"
              rules={[
                { required: true, message: "Wajib mengisi nama debitur" },
              ]}
            >
              <Input placeholder="Nama lengkap sesuai KTP" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="nik"
              label="NIK"
              rules={[
                {
                  required: true,
                  pattern: /^\d{16}$/,
                  message: "NIK harus 16 digit angka",
                },
              ]}
            >
              <Input
                placeholder="Nomor Induk Kependudukan (16 digit)"
                maxLength={16}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="gaji"
              label="Gaji Pokok Bulanan"
              rules={[{ required: true, message: "Wajib mengisi gaji pokok" }]}
            >
              <RupiahInput placeholder="Contoh: 8.000.000" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="jenis_kelamin"
              label="Jenis Kelamin"
              rules={[
                { required: true, message: "Wajib memilih jenis kelamin" },
              ]}
            >
              <Select placeholder="Pilih Jenis Kelamin">
                <Option value="L">Laki-laki</Option>
                <Option value="P">Perempuan</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status_kawin"
              label="Status Kawin"
              rules={[
                { required: true, message: "Wajib memilih status kawin" },
              ]}
            >
              <Select placeholder="Pilih Status">
                <Option value="K">Kawin</Option>
                <Option value="BK">Belum Kawin</Option>
                <Option value="JD">Janda/Duda</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* --- SEKSI DATA KELUARGA (TANGGUNGAN) --- */}
        <Title level={5} className="mt-4 mb-2 text-blue-600">
          Data Keluarga (Tanggungan)
        </Title>
        <Form.List name="familyMembers">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, fieldKey, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={[name, "name"]}
                    fieldKey={[fieldKey || "", "name"]}
                    rules={[{ required: true, message: "Nama Wajib" }]}
                    style={{ width: 180 }}
                  >
                    <Input placeholder="Nama Anggota Keluarga" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "relationship"]}
                    fieldKey={[fieldKey || "", "relationship"]}
                    rules={[{ required: true, message: "Hubungan Wajib" }]}
                    style={{ width: 150 }}
                  >
                    <Select placeholder="Hubungan">
                      <Option value="Istri">Istri/Suami</Option>
                      <Option value="Anak Kandung">Anak Kandung</Option>
                      <Option value="Orang Tua">Orang Tua</Option>
                      <Option value="Lainnya">Lainnya</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "birthYear"]}
                    fieldKey={[fieldKey || "", "birthYear"]}
                    rules={[{ required: true, message: "Tahun Lahir Wajib" }]}
                    style={{ width: 120 }}
                  >
                    <InputNumber
                      min={1900}
                      max={dayjs().year()}
                      placeholder="Tahun Lahir"
                    />
                  </Form.Item>
                  <MinusCircleOutlined
                    onClick={() => remove(name)}
                    className="text-red-500"
                  />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Tambah Anggota Keluarga
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider />

        {/* --- SEKSI DETAIL PEMBIAYAAN --- */}
        <Title level={5} className="mt-4 mb-2 text-blue-600">
          Detail Pengajuan Kredit Mingguan
        </Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="produkName"
              label="Produk Pembiayaan"
              rules={[{ required: true, message: "Wajib memilih produk" }]}
            >
              <Select placeholder="Pilih Produk">
                <Option value="Mingguan Cepat">
                  Mingguan Cepat (6-24 Minggu)
                </Option>
                <Option value="Mingguan Pro">
                  Mingguan Pro (24-208 Minggu)
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="plafon"
              label="Plafon Pengajuan (Rp)"
              rules={[
                { required: true, message: "Wajib mengisi plafon" },
                { validator: validatePlafon },
              ]}
              validateStatus={
                !isAffordable && plafon > 0 && gaji ? "error" : ""
              }
              help={
                !isAffordable && plafon > 0 && gaji
                  ? `Angsuran Mingguan ${formatterRupiah(
                      weeklyInstallment
                    )} melebihi batas maksimal ${formatterRupiah(
                      maxWeeklyInstallment
                    )}.`
                  : ""
              }
            >
              <RupiahInput placeholder="Contoh: 50.000.000" min={100000} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="tenor"
              label="Tenor (Minggu)"
              rules={[{ required: true, message: "Wajib mengisi tenor" }]}
            >
              <InputNumber
                min={4}
                max={208}
                step={4}
                className="w-full"
                placeholder="52"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="margin"
              label="Margin Tahunan (%)"
              rules={[{ required: true, message: "Wajib mengisi margin" }]}
            >
              <PercentInput placeholder="12.0%" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="by_admin"
              label="Biaya Admin"
              rules={[{ required: true, message: "Wajib mengisi biaya admin" }]}
            >
              <RupiahInput placeholder="Contoh: 500.000" />
            </Form.Item>
          </Col>
        </Row>

        <Card className="mt-4 bg-blue-50 border-blue-200" bordered={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Max Plafon (Batas DSR 30%)"
                value={maxPlafon}
                formatter={formatterRupiah}
                valueStyle={{
                  color:
                    maxPlafon > 0 && plafon > maxPlafon ? "#cf1322" : "#3f8600",
                  fontSize: "1.2rem",
                }}
              />
              <Text type="secondary" className="text-xs">
                Berdasarkan Gaji {formatterRupiah(gaji)} & Tenor {tenor} Minggu.
              </Text>
            </Col>
            <Col span={12}>
              <Statistic
                title="Angsuran Mingguan Anda"
                value={weeklyInstallment}
                formatter={formatterRupiah}
                valueStyle={{
                  color:
                    !isAffordable && weeklyInstallment > 0 ? "#cf1322" : "#08c",
                  fontSize: "1.2rem",
                }}
              />
              <Text type="secondary" className="text-xs">
                Max Angsuran: {formatterRupiah(maxWeeklyInstallment)}
              </Text>
            </Col>
          </Row>
        </Card>

        <Form.Item
          name="description"
          label="Deskripsi Pengajuan"
          className="mt-4"
        >
          <TextArea
            rows={2}
            placeholder="Tujuan pengajuan pembiayaan: modal kerja, kebutuhan konsumtif, dll."
          />
        </Form.Item>

        {isEdit && (
          <Form.Item
            name="status_sub"
            label="Status Awal"
            rules={[{ required: true }]}
            hidden={isEdit}
          >
            <Select placeholder="Pilih status" disabled={isEdit}>
              <Option value="DRAFT">DRAFT</Option>
              <Option value="PENDING">MENUNGGU REVIEW</Option>
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

// --- Main Application List Component ---
const ApplicationListManagement = () => {
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingApplication, setEditingApplication] = useState<any>(null);

  // --- CRUD Handlers ---

  // Handler untuk Input Baru & Edit
  const handleSave = async (values, isEdit) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulasi API delay

    if (isEdit) {
      // Logika Edit
      setApplications((prev) =>
        prev.map((app) =>
          editingApplication && app.id === editingApplication.id
            ? { ...app, ...values }
            : app
        )
      );
      notification.success({
        message: "Berhasil",
        description: `Pengajuan #${
          editingApplication && editingApplication.id
        } berhasil diperbarui.`,
      });
    } else {
      // Logika Input Baru
      const newId = "A" + String(applications.length + 1).padStart(3, "0");
      const newApp = {
        ...values,
        id: newId,
        createdAt: new Date(),
        description: values.description || "Tidak ada deskripsi",
        familyMembers: values.familyMembers || [],
      };
      setApplications((prev) => [newApp, ...prev]);
      notification.success({
        message: "Berhasil",
        description: `Pengajuan baru #${newId} berhasil dibuat.`,
      });
    }

    setIsSaving(false);
    setIsModalVisible(false);
    setEditingApplication(null);
  };

  // Handler untuk Delete
  const handleDelete = async (id) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulasi API delay
    setApplications((prev) => prev.filter((app) => app.id !== id));
    notification.success({
      message: "Berhasil",
      description: `Pengajuan #${id} berhasil dihapus.`,
    });
    setLoading(false);
  };

  // Handler untuk Kirim/Submit (DRAFT -> PENDING)
  const handleSubmitToPending = async (id) => {
    // Cek apakah data DRAFT sudah memenuhi syarat affordability sebelum dikirim
    const appToSubmit = applications.find((app) => app.id === id);
    if (appToSubmit) {
      const calculatedLimits = calculateAffordability(
        appToSubmit.gaji,
        appToSubmit.plafon,
        appToSubmit.tenor,
        appToSubmit.margin
      );

      if (!calculatedLimits.isAffordable) {
        notification.error({
          message: "Gagal Kirim Pengajuan",
          description: `Pengajuan #${id} tidak dapat dikirim karena Plafon melebihi batas DSR (Max: ${formatterRupiah(
            calculatedLimits.maxPlafon
          )}). Harap Edit terlebih dahulu.`,
          duration: 8,
        });
        return;
      }
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulasi API delay

    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status_sub: "PENDING" } : app
      )
    );
    notification.success({
      message: "Berhasil Dikirim",
      description: `Pengajuan #${id} berhasil diubah statusnya menjadi MENUNGGU REVIEW.`,
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
    });
    setLoading(false);
  };

  // --- UI/Modal Handlers ---

  const handleNewClick = () => {
    setEditingApplication(null);
    setIsModalVisible(true);
  };

  const handleEditClick = (record) => {
    setEditingApplication(record);
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setEditingApplication(null);
  };

  // --- Table Columns Definition ---
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id.localeCompare(b.id),
      fixed: "left",
      width: 90,
    },
    {
      title: "Debitur",
      dataIndex: "debtorName",
      key: "debtorName",
      sorter: (a, b) => a.debtorName.localeCompare(b.debtorName),
      width: 150,
    },
    {
      title: "Plafon",
      dataIndex: "plafon",
      key: "plafon",
      render: (plafon) => (
        <span className="font-medium text-blue-600">
          {formatterRupiah(plafon)}
        </span>
      ),
      sorter: (a, b) => a.plafon - b.plafon,
      width: 150,
    },
    {
      title: "Tenor",
      dataIndex: "tenor",
      key: "tenor",
      render: (tenor) => `${tenor} Minggu`, // Diubah ke Minggu
      sorter: (a, b) => a.tenor - b.tenor,
      width: 100,
    },
    {
      title: "Angsuran/Minggu",
      dataIndex: "weeklyInstallment",
      key: "weeklyInstallment",
      render: (install) => (
        <Tag color="volcano" className="font-medium">
          {formatterRupiah(install)}
        </Tag>
      ),
      sorter: (a, b) => a.weeklyInstallment - b.weeklyInstallment,
      width: 150,
    },
    {
      title: "Keluarga",
      dataIndex: "familyMembers",
      key: "familyMembers",
      render: (members) => (
        <Tag color={members.length > 0 ? "geekblue" : "default"}>
          {members.length} Orang
        </Tag>
      ),
      sorter: (a, b) => a.familyMembers.length - b.familyMembers.length,
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "status_sub",
      key: "status_sub",
      render: (status) => (
        <Tag color={STATUS_MAP[status]?.color || "default"}>
          {STATUS_MAP[status]?.text || status}
        </Tag>
      ),
      filters: Object.keys(STATUS_MAP).map((key) => ({
        text: STATUS_MAP[key].text,
        value: key,
      })),
      onFilter: (value, record) => record.status_sub === value,
      width: 150,
    },
    {
      title: "Aksi",
      key: "action",
      render: (text, record) => (
        <Space size="small">
          {/* Edit hanya tersedia jika statusnya DRAFT */}
          {record.status_sub === "DRAFT" && (
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditClick(record)}
            ></Button>
          )}

          {/* Kirim (Submit) hanya tersedia jika statusnya DRAFT */}
          {record.status_sub === "DRAFT" && (
            <Popconfirm
              title={`Kirim Pengajuan #${record.id}?`}
              description="Pastikan plafon terjangkau. Status akan diubah menjadi MENUNGGU REVIEW."
              onConfirm={() => handleSubmitToPending(record.id)}
              okText="Kirim"
              cancelText="Batal"
            >
              <Button
                type="primary"
                icon={<SendOutlined />}
                size="small"
                className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
              ></Button>
            </Popconfirm>
          )}

          {/* Hapus hanya tersedia jika statusnya DRAFT atau TOLAK (jika diizinkan) */}
          {record.status_sub !== "LUNAS" && record.status_sub !== "SETUJU" && (
            <Popconfirm
              title={`Hapus Pengajuan #${record.id}?`}
              description="Data ini akan dihapus permanen."
              onConfirm={() => handleDelete(record.id)}
              okText="Hapus"
              cancelText="Batal"
            >
              <Button danger icon={<DeleteOutlined />} size="small"></Button>
            </Popconfirm>
          )}
        </Space>
      ),
      fixed: "right",
      width: 150,
    },
  ];

  return (
    <div className="bg-gray-50">
      <Card className="shadow-xl rounded-lg border-t-4 border-blue-500">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className="text-xl font-bold m-0 text-gray-800">
              Manajemen Pengajuan Kredit
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setApplications(MOCK_APPLICATIONS);
                  setLoading(false);
                  notification.info({
                    message: "Data Dimuat Ulang",
                    description: "Daftar pengajuan telah diperbarui.",
                  });
                }, 500);
              }}
              className="bg-blue-500 hover:bg-blue-600 mr-3"
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNewClick}
              className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
            >
              Input Pengajuan Baru
            </Button>
          </Col>
        </Row>
        <div className="p-2">
          <Input
            placeholder="Cari nama..."
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

        <Spin spinning={loading} tip="Memuat atau memproses data...">
          <Table
            columns={columns as TableProps["columns"]}
            dataSource={applications.map((app) => ({ ...app, key: app.id }))}
            pagination={{ pageSize: 10 }}
            bordered
            // responsive={true}
            size="middle"
            scroll={{ x: 1200, y: 320 }} // Sesuaikan scroll horizontal
          />
        </Spin>
      </Card>

      {/* Modal untuk Input/Edit */}
      <ApplicationFormModal
        visible={isModalVisible}
        onCancel={handleCancelModal}
        onSave={handleSave}
        initialData={editingApplication}
        isSaving={isSaving}
      />
    </div>
  );
};

export default ApplicationListManagement;
