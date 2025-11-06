import { useState } from "react";
import {
  Card,
  Descriptions,
  Tabs,
  Tag,
  Typography,
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
import {
  calculateWeeklyPayment,
  formatterRupiah,
  getUsiaMasuk,
  STATUS_MAP,
  STATUSKAWIN_MAP,
} from "../Util";
import { IDapem } from "../Interface";
import { useSession } from "next-auth/react";

const { Title, Text } = Typography;
const { TextArea } = Input; // Tambahkan import Input.TextArea

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

const BerkasPendukungTab = ({ files }) => {
  const handleDownload = (fileName) => {
    notification.success({
      message: "Mengunduh Berkas",
      description: `Mendownload ${fileName} (simulasi).`,
    });
  };

  return (
    <List
      header={
        <Title level={4} className="my-0">
          Daftar Berkas ({files.length})
        </Title>
      }
      bordered
      dataSource={files}
      renderItem={(item: any) => (
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

const ApplicationDetailView = ({ dapem }: { dapem: IDapem }) => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const updateApplicationStatus = async (newStatus, reason) => {
    setLoading(true);
    await fetch("/api/dapem", {
      method: "PUT",
      body: JSON.stringify({
        ...dapem,
        status_sub: newStatus,
        process_desc: reason,
        approvedById: session?.user.id,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 200) {
          notification.success({
            message:
              newStatus === "SETUJU"
                ? "Pengajuan Disetujui"
                : "Pengajuan Ditolak",
            description: `Status aplikasi #${dapem.id} berhasil diubah menjadi ${STATUS_MAP[newStatus].text}.`,
          });
        } else {
          notification.error({
            message: "Gagal",
            description: res.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        notification.error({
          message: "Gagal",
          description: "Internal Server Error",
        });
      });
    setLoading(false);
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
        const reasonElement: any = document.getElementById("approvalReason");
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

  if (!dapem) {
    return (
      <div className="p-6 text-center text-red-500">
        Data aplikasi tidak ditemukan.
      </div>
    );
  }

  // Tentukan apakah tombol aksi harus ditampilkan
  const isPending = dapem.status_sub === "PENDING";

  // --- Tab Content Definitions ---

  const DetailPembiayaanContent = (
    <div className="space-y-6">
      <Title level={4} className="mt-0">
        Detail Pembiayaan {dapem.id}
      </Title>

      {/* 1. Data Utama Pembiayaan */}
      <Descriptions
        bordered
        column={1}
        size="middle"
        labelStyle={{ width: "50%" }}
        title={<span className="font-semibold text-base">Informasi Utama</span>}
      >
        <Descriptions.Item label="Plafon Pengajuan">
          <Text className="font-bold text-blue-600" style={{ color: "green" }}>
            {formatterRupiah(dapem.plafon)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Potongan Biaya">
          <Text className="font-bold text-red-500" style={{ color: "red" }}>
            {formatterRupiah(
              dapem.plafon * (dapem.by_admin / 100) +
                dapem.plafon * (dapem.by_tatalaksana / 100) +
                dapem.by_tabungan +
                dapem.by_materai
            )}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Terima Bersih">
          <Text className="font-bold text-blue-500" style={{ color: "green" }}>
            {formatterRupiah(
              dapem.plafon -
                (dapem.plafon * (dapem.by_admin / 100) +
                  dapem.plafon * (dapem.by_tatalaksana / 100) +
                  dapem.by_tabungan +
                  dapem.by_materai)
            )}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Tenor (Minggu)">
          {dapem.tenor} Minggu
        </Descriptions.Item>
        <Descriptions.Item label="Angsuran (Minggu)">
          {formatterRupiah(
            calculateWeeklyPayment(dapem.plafon, dapem.margin, dapem.tenor)
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Status Pengajuan">
          <Tag color={STATUS_MAP[dapem.status_sub]?.color || "default"}>
            {STATUS_MAP[dapem.status_sub]?.text || "TIDAK DIKENAL"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
      <div className="my-2"></div>
      {/* 2. Data Produk, Margin, dan Biaya */}
      <Descriptions
        bordered
        column={1}
        size="middle"
        labelStyle={{ width: "50%" }}
        title={
          <span className="font-semibold text-base">
            Produk, Margin & Biaya
          </span>
        }
      >
        <Descriptions.Item label="Jenis">{dapem.Jenis.name}</Descriptions.Item>
        <Descriptions.Item label="Produk">
          {dapem.Produk.name}
        </Descriptions.Item>

        <Descriptions.Item label="Margin">{dapem.margin}%</Descriptions.Item>

        <Descriptions.Item label="Biaya Admin">
          {formatterRupiah(dapem.plafon * (dapem.by_admin / 100))}
        </Descriptions.Item>
        <Descriptions.Item label="Biaya Tatalaksana">
          {formatterRupiah(dapem.plafon * (dapem.by_tatalaksana / 100))}
        </Descriptions.Item>
        <Descriptions.Item label="Biaya Tabungan">
          {formatterRupiah(dapem.by_tabungan)}
        </Descriptions.Item>
        <Descriptions.Item label="Biaya Materai">
          {formatterRupiah(dapem.by_materai)}
        </Descriptions.Item>

        {/* Asumsi Biaya Tatalaksana tidak ditampilkan karena 0.5% (dihitung) */}
      </Descriptions>
      <div className="my-2"></div>
      {/* 3. Data Approval & Keterangan */}
      <Descriptions
        bordered
        column={1}
        size="middle"
        labelStyle={{ width: "50%" }}
        title={
          <span className="font-semibold text-base">Waktu & Approval</span>
        }
      >
        <Descriptions.Item label="Tgl. Pengajuan">
          {dayjs(dapem.created_at).format("DD MMMM YYYY HH:mm")}
        </Descriptions.Item>

        <Descriptions.Item label="Keterangan Pengajuan" span={3}>
          <Text>{dapem.description || "-"}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Disetujui Oleh">
          {dapem.ApprovedBy ? dapem.ApprovedBy.name : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Tgl. Disetujui">
          {dapem.process_date
            ? dayjs(dapem.process_date).format("DD MMMM YYYY HH:mm")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Keterangan Proses" span={3}>
          <Text
            className={
              dapem.status_sub === "TOLAK"
                ? "text-red-600 font-medium"
                : "text-gray-800"
            }
          >
            {dapem.process_desc || "-"}
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
          column={1}
          labelStyle={{ width: "50%" }}
          size="middle"
          title={<span className="font-semibold text-base">Data Pribadi</span>}
        >
          <Descriptions.Item label="Nama">
            {dapem.DataDebitur.name}
          </Descriptions.Item>
          <Descriptions.Item label="NIK">
            {dapem.DataDebitur.nik}
          </Descriptions.Item>
          <Descriptions.Item label="Tgl Lahir">
            {dayjs(dapem.DataDebitur.tanggal_lahir).format("DD MMMM YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Usia saat pengajuan">
            {getUsiaMasuk(dapem.DataDebitur.tanggal_lahir, dapem.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Jenis Kelamin">
            {dapem.DataDebitur.jenis_kelamin === "L"
              ? "Laki-laki"
              : "Perempuan"}
          </Descriptions.Item>
          <Descriptions.Item label="Status Kawin">
            {STATUSKAWIN_MAP[dapem.DataDebitur.status_kawin].text}
          </Descriptions.Item>
          <Descriptions.Item label="No. Telepon">
            {dapem.DataDebitur.no_telepon}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {dapem.DataDebitur.email || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Alamat Tinggal" span={3}>
            {dapem.DataDebitur.alamat}
          </Descriptions.Item>
        </Descriptions>

        {/* Blok 2: Data Pekerjaan & Finansial */}
        <Descriptions
          bordered
          column={1}
          labelStyle={{ width: "50%" }}
          size="middle"
          title={
            <span className="font-semibold text-base">
              Pekerjaan & Finansial
            </span>
          }
        >
          <Descriptions.Item label="Pekerjaan">
            {dapem.DataDebitur.pekerjaan}
          </Descriptions.Item>
          <Descriptions.Item label="Gaji Pokok">
            <Text className="font-medium text-green-600">
              {formatterRupiah(dapem.DataDebitur.salary)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Alamat Pekerjaan" span={3}>
            {dapem.DataDebitur.alamat_pekerjaan}
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
          dataSource={dapem.DataDebitur.DataKeluarga}
          columns={[
            { title: "Nama", dataIndex: "name", key: "name" },
            { title: "Hubungan", dataIndex: "hubungan", key: "hubungan" },
            {
              title: "No. Telepon",
              dataIndex: "no_telepon",
              key: "no_telepon",
            },
          ]}
          pagination={false}
          bordered
          size="middle"
          rowKey={"id"}
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
          {/* <BerkasPendukungTab files={files} /> */}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-50">
      <Row justify="space-between" align="middle" className="mb-4">
        <Col>
          <Title level={2} className="text-2xl font-bold m-0 text-gray-800">
            Detail Pengajuan #{dapem.id}
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
              type="primary"
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleRejectClick}
              loading={loading}
              className="mr-3"
            >
              Tolak Pengajuan
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleApproveClick}
              loading={loading}
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
        <Tabs defaultActiveKey="1" items={items} size="large" className="p-2" />
      </Card>
    </div>
  );
};

export default ApplicationDetailView;
