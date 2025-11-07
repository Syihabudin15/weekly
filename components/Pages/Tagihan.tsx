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
  message,
  Row,
  Col,
  Typography,
  DatePicker,
  Tooltip,
  Select,
  Upload,
} from "antd";
import {
  Receipt,
  Edit,
  Search,
  Calendar,
  Info,
  User,
  Clock,
  CheckCircle,
  UploadCloud,
  Eye,
} from "lucide-react";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { formatterRupiah, usePermission } from "../Util";
import { IPageProps, ITagihan } from "../Interface";
import { EKunjungan } from "@prisma/client";

const { Text } = Typography;
const { Option } = Select;
interface AngsuranFormProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  editingAngsuran: ITagihan | null;
  getData: () => void;
}

const AngsuranUpdateForm: React.FC<AngsuranFormProps> = ({
  isModalVisible,
  setIsModalVisible,
  editingAngsuran,
  getData,
}) => {
  const [data, setData] = useState<ITagihan | null>(editingAngsuran);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  const angsuranInfo = editingAngsuran
    ? `Angsuran (${editingAngsuran.id})`
    : "Detail Angsuran";

  const title = `Angsuran: ${angsuranInfo}`;

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

    const formData = new FormData();
    formData.append("id", editingAngsuran.id);
    formData.append("keterangan", values.keterangan || "");
    formData.append("status_kunjungan", values.status_kunjungan || "BELUM");
    formData.append(
      "tanggal_bayar",
      values.tanggal_bayar
        ? values.tanggal_bayar.toISOString().split("T")[0]
        : ""
    );

    // tambahkan file jika ada
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("file", fileList[0].originFileObj);
    }

    const url = `/api/tagihan?id=${editingAngsuran.id}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        body: formData,
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
      console.log(error);
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
      width={700}
      style={{ top: 20 }}
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
              <Text type="secondary">Debitur:</Text>
            </Col>
            <Col span={12} className="text-right">
              <Text strong>{editingAngsuran.Dapem.DataDebitur.name}</Text>
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
              <Text type="secondary">Angsuran Ke:</Text>
            </Col>
            <Col span={12} className="text-right">
              <Text>{editingAngsuran.angsuran_ke}</Text>
            </Col>

            <Col span={12}>
              <Text type="secondary">Jumlah Tagihan:</Text>
            </Col>
            <Col span={12} className="text-right">
              <Tag color="volcano" className="font-medium">
                {formatterRupiah(
                  editingAngsuran.pokok + editingAngsuran.margin
                )}
              </Tag>
            </Col>
          </Row>
        </Card>
      )}
      <div className="mt-4"></div>
      <Form
        form={form}
        layout="horizontal"
        onFinish={onFinish}
        initialValues={{ status_kunjungan: data?.status_kunjungan || "BELUM" }}
        labelCol={{ span: 6 }}
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
              <Info size={16} /> Keterangan
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
        <Form.Item label="Upload berkas">
          {data?.file ? (
            <Card
              size="small"
              className="bg-gray-50 border-dashed border-gray-300 text-center"
            >
              <div className="flex justify-center gap-6 items-center">
                <Button
                  icon={<Eye />}
                  type="primary"
                  htmlType="button"
                  onClick={() => data.file && window.open(data.file, "_blank")}
                >
                  Lihat File
                </Button>

                <Button
                  danger
                  size="small"
                  htmlType="button"
                  onClick={() => {
                    Modal.confirm({
                      title: "Hapus File?",
                      content:
                        "File lama akan dihapus dari Azure. Anda dapat upload file baru setelah ini.",
                      okText: "Hapus",
                      cancelText: "Batal",
                      async onOk() {
                        if (!data?.file) return;
                        try {
                          message.loading({
                            content: "Menghapus file...",
                            key: "del",
                          });

                          // 1️⃣ Hapus dari Azure
                          const res = await fetch(
                            `/api/azure-file?url=${encodeURIComponent(
                              data.file
                            )}`,
                            { method: "DELETE" }
                          );
                          const result = await res.json();

                          if (!res.ok) {
                            message.error({
                              content:
                                result.msg ||
                                "Gagal menghapus file dari Azure.",
                              key: "del",
                            });
                            return;
                          }

                          // 2️⃣ Hapus dari database
                          await fetch(
                            `/api/tagihan-file?id=${editingAngsuran?.id}`,
                            {
                              method: "DELETE",
                            }
                          );

                          // 3️⃣ Update UI
                          setFileList([]);
                          setData({ ...data, file: null });

                          message.success({
                            content:
                              "File berhasil dihapus dari Azure dan database.",
                            key: "del",
                          });
                        } catch (err) {
                          console.error(err);
                          message.error({
                            content: "Terjadi kesalahan saat menghapus file.",
                            key: "del",
                          });
                        }
                      },
                    });
                  }}
                >
                  Hapus File
                </Button>
              </div>
            </Card>
          ) : (
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              accept=".jpg,.jpeg,.png,.pdf"
              maxCount={1}
              listType="text"
            >
              {fileList.length === 0 && (
                <Button icon={<UploadCloud />}>Upload File Baru</Button>
              )}
            </Upload>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default function AngsuranManagementPage() {
  const [pageProps, setPageProps] = useState<IPageProps<ITagihan>>({
    loading: false,
    page: 1,
    pageSize: 50,
    data: [],
    filters: [],
    total: 0,
  });

  const { canUpdate } = usePermission();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAngsuran, setEditingAngsuran] = useState<ITagihan | null>(null);

  const getData = async () => {
    setPageProps((prev) => ({ ...prev, loading: true }));

    try {
      const search =
        pageProps.filters.find((f) => f.key === "search")?.value || "";
      const week =
        pageProps.filters.find((f) => f.key === "week")?.value || "current";

      const response = await fetch(
        `/api/tagihan?search=${encodeURIComponent(search)}&week=${week}`
      );
      const data = await response.json();

      setPageProps((prev) => ({
        ...prev,
        data,
        total: data.length,
        loading: false,
      }));
    } catch (error) {
      console.error(error);
      message.error("Gagal mengambil data angsuran dari server.");
      setPageProps((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleEdit = (record: ITagihan) => {
    setEditingAngsuran(record);
    setIsModalVisible(true);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.page, pageProps.pageSize, pageProps.filters]);

  const getStatusColor = (status: ITagihan["statusPembayaran"]) => {
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

  const getKunjunganColor = (status: EKunjungan) => {
    switch (status) {
      case "SUDAH":
        return "blue";
      case "BELUM":
      default:
        return "default";
    }
  };

  const columns: TableProps<ITagihan>["columns"] = [
    {
      title: "Info Debitur",
      dataIndex: ["Dapem", "DataDebitur", "name"],
      key: "customerName",
      width: 180,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Tooltip title={`ID Dapem: ${record.dapemId}`}>
            <Text strong className="text-base">
              <User size={14} className="inline mr-1" /> {text}
            </Text>
          </Tooltip>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            Angsuran ke-{record.angsuran_ke}
          </Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            {record.id}
          </Text>
        </Space>
      ),
    },
    {
      title: <Tooltip title="Pokok + Margin">Total Angsuran</Tooltip>,
      dataIndex: "totalAngsuran",
      key: "totalAngsuran",
      align: "right",
      render: (value, record) => (
        <Tag color="volcano" className="font-medium">
          {formatterRupiah(record.margin + record.pokok)}
        </Tag>
      ),
    },
    {
      title: "Jatuh Tempo",
      dataIndex: "jadwal_bayar",
      key: "jadwal_bayar",
      align: "center",
      sorter: (a, b) =>
        new Date(a.jadwal_bayar).getTime() - new Date(b.jadwal_bayar).getTime(),
      render: (date: string | Date) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Tanggal Bayar",
      dataIndex: "tanggal_bayar",
      key: "tanggal_bayar",
      align: "center",
      sorter: (a, b) => {
        const aDate = a.tanggal_bayar ? new Date(a.tanggal_bayar).getTime() : 0;
        const bDate = b.tanggal_bayar ? new Date(b.tanggal_bayar).getTime() : 0;
        return aDate - bDate;
      },
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
      render: (status: ITagihan["statusPembayaran"]) => (
        <Tag
          color={getStatusColor(status)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 600,
          }}
        >
          <Clock size={12} style={{ marginRight: 2 }} />
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
      render: (status: EKunjungan) => (
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
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Data Tagihan Mingguan{" "}
          <Receipt size={28} className="inline-block text-red-500" />
        </h1>
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
            <Select
              defaultValue="current"
              style={{ width: 160 }}
              size="small"
              onChange={(val) => {
                const filt = pageProps.filters.filter((f) => f.key !== "week");
                filt.push({ key: "week", value: val });
                setPageProps((prev) => ({ ...prev, filters: filt }));
              }}
            >
              <Option value="prev">Minggu Lalu</Option>
              <Option value="current">Minggu Ini</Option>
              <Option value="next">Minggu Depan</Option>
            </Select>
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
            summary={(data) => {
              const total = data.reduce(
                (sum, record) => sum + record.pokok + record.margin,
                0
              );

              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={columns.length - 1}>
                    <Text strong>Total Tagihan Minggu Ini:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={columns.length - 1} align="right">
                    <Tag color="red" className="font-semibold">
                      {formatterRupiah(total)}
                    </Tag>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
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
