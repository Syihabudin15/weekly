import React, { useState, useEffect } from "react";
import {
  Card,
  Descriptions,
  Tabs,
  Tag,
  Typography,
  Spin,
  Row,
  Col,
  List,
  Button,
  Divider,
  notification,
  Table,
  Modal,
  Input,
} from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileZipOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input; // Tambahkan import Input.TextArea

// Helper: Format Rupiah
const formatterRupiah = (value) => {
  if (value === null || value === undefined) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
};

// Helper: Tentukan ikon berkas
const getFileIcon = (mimeType) => {
  if (mimeType.includes("pdf"))
    return <FilePdfOutlined className="text-red-500" />;
  if (mimeType.includes("image"))
    return <FileImageOutlined className="text-blue-500" />;
  if (mimeType.includes("zip") || mimeType.includes("rar"))
    return <FileZipOutlined className="text-yellow-500" />;
  return <PaperClipOutlined className="text-gray-500" />;
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

// --- API MOCK FUNCTION (Menggantikan fetch dari /api/monitoring/detail/[id]) ---
const fetchApplicationDetail = async (id) => {
  // Simulasikan panggilan API dan delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Data Mock berdasarkan skema model Anda
  const mockDetailData = {
    // ID ini harusnya di-pass sebagai parameter
    id: id,
    // 1. Detail Pembiayaan (Dapem)
    dapem: {
      plafon: 50000000,
      tenor: 12,
      margin: 0.12,
      by_admin: 1500000,
      by_tabungan: 500000,
      by_materai: 150000,
      by_tatalaksana: 0.005, // 0.5%
      status_sub: "PENDING", // Diubah ke PENDING agar tombol aksi terlihat
      produkName: "Multiguna", // Dari Produk.name
      jenisName: "Baru", // Dari Jenis.name
      description: "Pembiayaan untuk renovasi rumah tinggal di Jakarta.",
      approvedBy: "User Reviewer A (12345)", // Dari User.name + User.id
      approvedAt: null, // Null jika PENDING
      createdAt: dayjs().subtract(7, "days").toDate(),
    },
    // 2. Data Debitur (DataDebitur)
    debtor: {
      nama: "Andi Pratama",
      nik: "3201xxxxxxxxxxxx",
      gaji: 8000000,
      tanggal_lahir: "1990-05-15",
      alamat:
        "Jl. Melati No. 5, Kel. Suka Maju, Kec. Cempaka, Kota Bandung, Jawa Barat, 40111",
      no_telepon: "081234567890",
      email: "andi.pratama@mail.com",
      jenis_kelamin: "L",
      pekerjaan: "PNS Guru SMA N 3 Bandung",
      alamat_pekerjaan: "Jl. Sekolah No. 10, Bandung",
      status_kawin: "K", // Kawin
    },
    // 2. Data Keluarga (DataKeluarga)
    family: [
      {
        nama: "Siti Fatimah",
        hubungan: "Istri",
        gender: "P",
        no_telepon: "081211122233",
      },
      { nama: "Dodi Pratama", hubungan: "Anak", gender: "L", no_telepon: "-" },
    ],
    // 3. Berkas Pendukung (Simulated file list)
    files: [
      {
        name: "KTP Debitur",
        status: "Lengkap",
        type: "image/jpeg",
        url: "/files/ktp.jpg",
        date: dayjs().subtract(7, "days").toDate(),
      },
      {
        name: "Kartu Keluarga",
        status: "Lengkap",
        type: "application/pdf",
        url: "/files/kk.pdf",
        date: dayjs().subtract(7, "days").toDate(),
      },
      {
        name: "Slip Gaji 3 Bulan Terakhir",
        status: "Lengkap",
        type: "application/zip",
        url: "/files/slip_gaji.zip",
        date: dayjs().subtract(6, "days").toDate(),
      },
      {
        name: "Surat Keterangan Kerja",
        status: "Lengkap",
        type: "application/pdf",
        url: "/files/skk.pdf",
        date: dayjs().subtract(5, "days").toDate(),
      },
    ],
  };

  return mockDetailData;
};

// --- KOMPONEN BERKAS PENDUKUNG ---

const BerkasPendukungTab = ({ files }) => {
  const handleDownload = (fileName) => {
    notification.success({
      message: "Mengunduh Berkas",
      description: `Mendownload ${fileName} (simulasi).`,
    });
  };

  const fileColumns = [
    { title: "Nama Berkas", dataIndex: "name", key: "name" },
    {
      title: "Jenis",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Text>
          {getFileIcon(type)}
          <span className="ml-2">{type.split("/").pop().toUpperCase()}</span>
        </Text>
      ),
    },
    {
      title: "Tgl. Unggah",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Aksi",
      key: "action",
      render: (text, record) => (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          size="small"
          onClick={() => handleDownload(record.name)}
        >
          Unduh
        </Button>
      ),
    },
  ];

  return (
    <List
      header={
        <Title level={4} className="my-0">
          Daftar Berkas ({files.length})
        </Title>
      }
      bordered
      dataSource={files}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Text className="text-gray-500 text-sm" key="date">
              {dayjs(item.date).format("DD/MM/YYYY")}
            </Text>,
            <Button
              type="link"
              icon={<DownloadOutlined />}
              key="download"
              onClick={() => handleDownload(item.name)}
            >
              Unduh
            </Button>,
          ]}
        >
          <List.Item.Meta
            avatar={getFileIcon(item.type)}
            title={<Text className="font-medium">{item.name}</Text>}
            description={
              <Tag color="green" icon={<CheckCircleOutlined />}>
                {item.status}
              </Tag>
            }
          />
        </List.Item>
      )}
    />
  );
};

// --- KOMPONEN UTAMA DETAIL VIEW ---

const ApplicationDetailView = ({ applicationId = "A001" }) => {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Status loading untuk aksi approval

  // Helper untuk simulasi pembaruan status API
  // Menerima parameter reason
  const updateApplicationStatus = async (newStatus, reason = "") => {
    setIsSubmitting(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (Math.random() > 0.1) {
      // 90% simulasi tingkat keberhasilan
      setDetailData((prevData) => ({
        ...prevData,
        dapem: {
          ...prevData.dapem,
          status_sub: newStatus,
          approvedAt: newStatus === "SETUJU" ? new Date() : null,
          // Memperbarui description dengan alasan baru jika ada
          description: reason || prevData.dapem.description,
          // Di aplikasi nyata, approvedBy akan diatur di sini
        },
      }));
      notification.success({
        message:
          newStatus === "SETUJU" ? "Pengajuan Disetujui" : "Pengajuan Ditolak",
        description: `Status aplikasi #${detailData.id} berhasil diubah menjadi ${STATUS_MAP[newStatus].text}.`,
      });
    } else {
      notification.error({
        message: "Gagal",
        description: "Gagal mengubah status. Silakan coba lagi.",
      });
    }
    setIsSubmitting(false);
  };

  // Handler untuk Setujui
  const handleApproveClick = () => {
    Modal.confirm({
      title: "Konfirmasi Persetujuan",
      icon: <CheckCircleOutlined className="text-green-500" />,
      content: (
        <div>
          <p className="mb-3">
            Apakah Anda yakin ingin **MENYETUJUI** pembiayaan ini? Anda bisa
            menambahkan catatan opsional di bawah ini.
          </p>
          <TextArea
            rows={3}
            placeholder="Catatan persetujuan (Opsional)"
            id="approvalReason" // Gunakan ID untuk mengambil nilai
          />
        </div>
      ),
      okText: "Setuju",
      cancelText: "Batal",
      onOk() {
        const reasonElement = document.getElementById("approvalReason");
        const reason = reasonElement ? reasonElement.value.trim() : "";
        updateApplicationStatus(
          "SETUJU",
          reason || "Pengajuan disetujui tanpa catatan tambahan."
        );
      },
    });
  };

  // Handler untuk Tolak (Diperbarui dengan input TextArea)
  const handleRejectClick = () => {
    let reasonInput = ""; // Variabel lokal untuk menampung input

    Modal.confirm({
      title: "Tolak Pengajuan",
      icon: <CloseCircleOutlined className="text-red-500" />,
      content: (
        <div>
          <p className="mb-3 font-semibold text-red-700">
            Mohon masukkan alasan penolakan ini secara rinci (Wajib):
          </p>
          <TextArea
            rows={4}
            placeholder="Wajib diisi. Contoh: Debitur memiliki riwayat kredit macet (Kol 5) di bank lain."
            onChange={(e) => {
              reasonInput = e.target.value;
            }}
          />
        </div>
      ),
      okText: "Tolak & Simpan Alasan",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk() {
        if (!reasonInput.trim()) {
          notification.error({
            message: "Gagal Menolak",
            description: "Alasan penolakan wajib diisi.",
          });
          // Mengembalikan Promise.reject agar modal tidak langsung tertutup
          return Promise.reject(new Error("Alasan wajib diisi"));
        }
        // Pass alasan ke fungsi update status
        updateApplicationStatus("TOLAK", reasonInput.trim());
      },
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchApplicationDetail(applicationId);
        setDetailData(data);
      } catch (error) {
        console.error("Gagal memuat detail aplikasi:", error);
        notification.error({
          message: "Gagal",
          description: "Tidak dapat memuat data detail aplikasi.",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Memuat detail aplikasi..." />
      </div>
    );
  }

  if (!detailData) {
    return (
      <div className="p-6 text-center text-red-500">
        Data aplikasi tidak ditemukan.
      </div>
    );
  }

  const { dapem, debtor, family, files } = detailData;
  // Tentukan apakah tombol aksi harus ditampilkan
  const isPending = dapem.status_sub === "PENDING";

  // --- Tab Content Definitions ---

  const DetailPembiayaanContent = (
    <div className="space-y-6">
      <Title level={4} className="mt-0">
        Detail Pembiayaan (Dapem: {detailData.id})
      </Title>

      {/* 1. Data Utama Pembiayaan */}
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, md: 3 }}
        size="middle"
        title={<span className="font-semibold text-base">Informasi Utama</span>}
      >
        <Descriptions.Item label="Plafon Pengajuan">
          <Text className="font-bold text-blue-600">
            {formatterRupiah(dapem.plafon)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Tenor (Bulan)">
          {dapem.tenor} Bulan
        </Descriptions.Item>
        <Descriptions.Item label="Status Pengajuan">
          <Tag color={STATUS_MAP[dapem.status_sub]?.color || "default"}>
            {STATUS_MAP[dapem.status_sub]?.text || "TIDAK DIKENAL"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      {/* 2. Data Produk, Margin, dan Biaya */}
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, md: 3 }}
        size="middle"
        title={
          <span className="font-semibold text-base">
            Produk, Margin & Biaya
          </span>
        }
      >
        <Descriptions.Item label="Produk">{dapem.produkName}</Descriptions.Item>
        <Descriptions.Item label="Jenis">{dapem.jenisName}</Descriptions.Item>
        <Descriptions.Item label="Margin">
          {dapem.margin * 100}%
        </Descriptions.Item>

        <Descriptions.Item label="Biaya Admin">
          {formatterRupiah(dapem.by_admin)}
        </Descriptions.Item>
        <Descriptions.Item label="Biaya Tabungan">
          {formatterRupiah(dapem.by_tabungan)}
        </Descriptions.Item>
        <Descriptions.Item label="Biaya Materai">
          {formatterRupiah(dapem.by_materai)}
        </Descriptions.Item>

        {/* Asumsi Biaya Tatalaksana tidak ditampilkan karena 0.5% (dihitung) */}
      </Descriptions>

      {/* 3. Data Approval & Keterangan */}
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, md: 3 }}
        size="middle"
        title={
          <span className="font-semibold text-base">Waktu & Approval</span>
        }
      >
        <Descriptions.Item label="Tgl. Pengajuan">
          {dayjs(dapem.createdAt).format("DD MMMM YYYY HH:mm")}
        </Descriptions.Item>
        <Descriptions.Item label="Disetujui Oleh">
          {dapem.approvedBy}
        </Descriptions.Item>
        <Descriptions.Item label="Tgl. Disetujui">
          {dapem.approvedAt
            ? dayjs(dapem.approvedAt).format("DD MMMM YYYY HH:mm")
            : "-"}
        </Descriptions.Item>

        <Descriptions.Item label="Keterangan" span={3}>
          <Text
            className={
              dapem.status_sub === "TOLAK"
                ? "text-red-600 font-medium"
                : "text-gray-800"
            }
          >
            {dapem.description || "Tidak ada keterangan tambahan."}
          </Text>
        </Descriptions.Item>
      </Descriptions>
    </div>
  );

  const DataDebiturTab = (
    <Row gutter={[24, 24]}>
      {/* Data Debitur Utama - Dipecah menjadi 2 Deskripsi */}
      <Col span={24} className="space-y-6">
        <Title level={4} className="mt-0">
          Data Debitur Utama
        </Title>

        {/* Blok 1: Data Pribadi */}
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
          size="middle"
          title={<span className="font-semibold text-base">Data Pribadi</span>}
        >
          <Descriptions.Item label="Nama">{debtor.nama}</Descriptions.Item>
          <Descriptions.Item label="NIK">{debtor.nik}</Descriptions.Item>
          <Descriptions.Item label="Tgl Lahir">
            {dayjs(debtor.tanggal_lahir).format("DD MMMM YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Jenis Kelamin">
            {debtor.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
          </Descriptions.Item>
          <Descriptions.Item label="Status Kawin">
            {debtor.status_kawin}
          </Descriptions.Item>
          <Descriptions.Item label="No. Telepon">
            {debtor.no_telepon}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {debtor.email || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Alamat Tinggal" span={3}>
            {debtor.alamat}
          </Descriptions.Item>
        </Descriptions>

        {/* Blok 2: Data Pekerjaan & Finansial */}
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
          size="middle"
          title={
            <span className="font-semibold text-base">
              Pekerjaan & Finansial
            </span>
          }
        >
          <Descriptions.Item label="Pekerjaan">
            {debtor.pekerjaan}
          </Descriptions.Item>
          <Descriptions.Item label="Gaji Pokok">
            <Text className="font-medium text-green-600">
              {formatterRupiah(debtor.gaji)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Alamat Pekerjaan" span={3}>
            {debtor.alamat_pekerjaan}
          </Descriptions.Item>
        </Descriptions>
      </Col>

      {/* Data Keluarga */}
      <Col span={24}>
        <Divider orientation="left">
          <Title level={4} className="mt-0 mb-0">
            Data Keluarga
          </Title>
        </Divider>
        <Table
          dataSource={family}
          columns={[
            { title: "Nama", dataIndex: "nama", key: "nama" },
            { title: "Hubungan", dataIndex: "hubungan", key: "hubungan" },
            {
              title: "Jenis Kelamin",
              dataIndex: "gender",
              key: "gender",
              render: (g) => (g === "L" ? "Laki-laki" : "Perempuan"),
            },
            {
              title: "No. Telepon",
              dataIndex: "no_telepon",
              key: "no_telepon",
            },
          ]}
          pagination={false}
          bordered
          size="middle"
        />
      </Col>
    </Row>
  );

  // Konfigurasi Tabs
  const items = [
    {
      key: "1",
      label: (
        <span>
          <FileTextOutlined /> Detail Pembiayaan
        </span>
      ),
      children: (
        <div className="p-4 bg-white rounded-lg">{DetailPembiayaanContent}</div>
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <UserOutlined /> Data Debitur & Keluarga
        </span>
      ),
      children: <div className="p-4 bg-white rounded-lg">{DataDebiturTab}</div>,
    },
    {
      key: "3",
      label: (
        <span>
          <PaperClipOutlined /> Berkas Pendukung
        </span>
      ),
      children: (
        <div className="p-4 bg-white rounded-lg">
          <BerkasPendukungTab files={files} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Row justify="space-between" align="middle" className="mb-4">
        <Col>
          <Title level={2} className="text-2xl font-bold m-0 text-gray-800">
            Detail Pengajuan #{detailData.id}
          </Title>
          <Text className="text-lg text-gray-500">
            Status saat ini:{" "}
            <Tag color={STATUS_MAP[dapem.status_sub]?.color}>
              {STATUS_MAP[dapem.status_sub]?.text}
            </Tag>
          </Text>
        </Col>

        {/* --- Tombol Aksi untuk Persetujuan/Penolakan --- */}
        {isPending && (
          <Col>
            <Button
              type="danger"
              icon={<CloseCircleOutlined />}
              onClick={handleRejectClick}
              loading={isSubmitting}
              className="mr-3"
            >
              Tolak Pengajuan
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleApproveClick}
              loading={isSubmitting}
              className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
            >
              Setujui Pengajuan
            </Button>
          </Col>
        )}
        {/* --- Akhir Tombol Aksi --- */}
      </Row>

      <Card
        className="shadow-xl rounded-lg border-t-4 border-blue-500"
        bodyStyle={{ padding: 0 }}
      >
        <Tabs defaultActiveKey="1" items={items} size="large" className="p-4" />
      </Card>
    </div>
  );
};

export default ApplicationDetailView;
