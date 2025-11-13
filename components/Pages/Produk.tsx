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
  Switch,
  Tooltip,
} from "antd";
import {
  Package,
  Plus,
  Edit,
  Search,
  Trash2,
  DollarSign,
  Clock,
  Percent,
} from "lucide-react";
import type { TableProps } from "antd";
import { Produk } from "@prisma/client";
import { IPageProps } from "../Interface";
import { formatterPercent, formatterRupiah, usePermission } from "../Util";

const { Text, Title } = Typography;

// Helper Formatter
// UPDATED: Robust check for undefined/null value

interface ProdukFormProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  editingProduk: Produk | null;
  getData: () => void;
}

const ProdukManagementForm: React.FC<ProdukFormProps> = ({
  isModalVisible,
  setIsModalVisible,
  editingProduk,
  getData,
}) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const title = editingProduk
    ? `Ubah Produk: ${editingProduk.name}`
    : "Tambah Produk Pembiayaan Baru";

  React.useEffect(() => {
    if (editingProduk) {
      form.setFieldsValue(editingProduk);
    } else {
      form.resetFields();
    }
  }, [editingProduk, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    // API endpoint disesuaikan untuk Produk
    const url = editingProduk
      ? `/api/produk?id=${editingProduk.id}`
      : "/api/produk";
    const method = editingProduk ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values }),
      });

      if (response.ok) {
        await getData();
        message.success(
          `Produk ${editingProduk ? "diperbarui" : "ditambahkan"} berhasil!`
        );
        setIsModalVisible(false);
      } else {
        const errorData = await response.json();
        message.error(
          `Gagal menyimpan produk! ${errorData.msg || "Terjadi kesalahan."}`
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
      width={800}
      footer={[
        <Button key="back" onClick={() => setIsModalVisible(false)}>
          Batal
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() => form.submit()}
          loading={loading}
        >
          Simpan
        </Button>,
      ]}
      style={{ top: 20 }}
      loading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={
          editingProduk || {
            status: true,
            max_tenor: 4,
            max_plafon: 2000000,
            margin: 18.0,
          }
        }
      >
        <Form.Item name="name" label="Nama Produk" rules={[{ required: true }]}>
          <Input placeholder="Contoh: KUM 52W" />
        </Form.Item>
        <Form.Item name="description" label="Deskripsi">
          <Input.TextArea
            rows={2}
            placeholder="Penjelasan singkat mengenai produk ini."
          />
        </Form.Item>

        <Title level={5} className="mt-4">
          Batas & Margin Produk
        </Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="max_plafon"
              label={
                <Space>
                  <DollarSign size={16} /> Max Plafon (Rp)
                </Space>
              }
              rules={[{ required: true }]}
            >
              <InputNumber<number>
                min={500000}
                className="w-full"
                formatter={formatterRupiah}
                parser={(displayValue) => {
                  const cleanValue = displayValue
                    ? displayValue.replace(/[^0-9]/g, "")
                    : "0";
                  return parseFloat(cleanValue) || 0;
                }}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="max_tenor"
              label={
                <Space>
                  <Clock size={16} /> Max Tenor (Minggu)
                </Space>
              }
              rules={[{ required: true }]}
            >
              <InputNumber<number>
                min={4}
                max={24}
                className="w-full"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <Form.Item
              name="margin"
              label={
                <Space>
                  <Percent size={16} /> Margin (%/Thn)
                </Space>
              }
              rules={[{ required: true }]}
            >
              <InputNumber<number>
                min={0.01}
                max={100}
                step={0.1}
                className="w-full"
                formatter={formatterPercent}
                parser={(displayValue) => {
                  const cleanValue = displayValue
                    ? displayValue.replace(/[^0-9]/g, "")
                    : "0";
                  return parseFloat(cleanValue) || 0;
                }}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dsr"
              label={
                <Space>
                  <Percent size={16} /> DSR (%)
                </Space>
              }
              rules={[{ required: true }]}
            >
              <InputNumber<number>
                min={0.01}
                max={100}
                step={0.1}
                className="w-full"
                formatter={formatterPercent}
                parser={(displayValue) => {
                  const cleanValue = displayValue
                    ? displayValue.replace(/[^0-9]/g, "")
                    : "0";
                  return parseFloat(cleanValue) || 0;
                }}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Title level={5} className="mt-4">
          Rincian Biaya (Saat Pencairan)
        </Title>
        <Row gutter={[24, 24]}>
          <Col xs={12} lg={6}>
            <Form.Item
              name="by_admin"
              label="Admin (%)"
              rules={[{ required: true }]}
            >
              <InputNumber<number>
                min={0}
                max={10}
                step={0.1}
                className="w-full"
                style={{ width: "100%" }}
                formatter={formatterPercent}
                parser={(displayValue) => {
                  const cleanValue = displayValue
                    ? displayValue.replace(/[^0-9]/g, "")
                    : "0";
                  return parseFloat(cleanValue) || 0;
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name="by_tatalaksana"
              label="Tatalaksana (%)"
              rules={[{ required: true }]}
            >
              <InputNumber<number>
                min={0}
                max={10}
                step={0.1}
                className="w-full"
                formatter={formatterPercent}
                parser={(displayValue) => {
                  const cleanValue = displayValue
                    ? displayValue.replace(/[^0-9]/g, "")
                    : "0";
                  return parseFloat(cleanValue) || 0;
                }}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name="by_tabungan"
              label="Keanggotaan (Rp)"
              rules={[{ required: true }]}
            >
              <InputNumber<number>
                min={0}
                className="w-full"
                formatter={formatterRupiah}
                parser={(displayValue) => {
                  const cleanValue = displayValue
                    ? displayValue.replace(/[^0-9]/g, "")
                    : "0";
                  return parseFloat(cleanValue) || 0;
                }}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name="by_materai"
              label="Materai (Rp)"
              rules={[{ required: true }]}
            >
              <InputNumber<number>
                min={0}
                className="w-full"
                formatter={formatterRupiah}
                parser={(displayValue) => {
                  const cleanValue = displayValue
                    ? displayValue.replace(/[^0-9]/g, "")
                    : "0";
                  return parseFloat(cleanValue) || 0;
                }}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="status"
          label="Status Produk"
          valuePropName="checked"
          tooltip="Nonaktifkan jika produk ini dihentikan."
          hidden
        >
          <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- Halaman Manajemen Produk (Table) ---

export default function ProdukManagementPage() {
  const [pageProps, setPageProps] = useState<IPageProps<Produk>>({
    loading: false,
    page: 1,
    pageSize: 50,
    data: [],
    filters: [],
    total: 0,
  });
  const { canWrite, canUpdate, canDelete } = usePermission();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduk, setEditingProduk] = useState<Produk | null>(null);

  const handleEdit = (record: Produk) => {
    setEditingProduk(record);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingProduk(null);
    setIsModalVisible(true);
  };

  const getData = async () => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    const request = await fetch(
      `/api/produk?page=${pageProps.page}&pageSize=${pageProps.pageSize}${
        pageProps.filters.length !== 0
          ? pageProps.filters.map((p) => `&${p.key}=${p.value}`).join("")
          : ""
      }`
    );
    const { data, total } = await request.json();
    setPageProps((prev) => ({ ...prev, data, total, loading: false }));
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/produk?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await getData();
        message.success("Produk berhasil dihapus!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Gagal menghapus produk");
      }
    } catch (error: any) {
      console.error("Error deleting produk:", error);
      message.error(`Gagal menghapus produk! ${error.message || ""}`);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.page, pageProps.pageSize, pageProps.filters]);

  const columns: TableProps<Produk>["columns"] = [
    {
      title: "Nama Produk",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Plafon: {formatterRupiah(record.max_plafon)}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Tenor: {record.max_tenor} Minggu
          </Text>
        </Space>
      ),
    },
    {
      title: "Deskripsi",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => <Tooltip title={text}>{text || "-"}</Tooltip>,
    },
    {
      title: "Margin (Thn)",
      dataIndex: "margin",
      key: "margin",
      align: "center",
      render: (value: number) => <Tag color="green">{value.toFixed(2)} %</Tag>,
    },
    {
      title: "DSR (%)",
      dataIndex: "dsr",
      key: "dsr",
      align: "center",
      render: (value: number) => <Tag color="green">{value.toFixed(2)} %</Tag>,
    },
    {
      title: "Biaya Biaya",
      dataIndex: "by",
      key: "by",
      render(value, record) {
        return (
          <Space direction="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Admin: {record.by_admin} %
            </Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Tatalaksana: {record.by_tatalaksana} %
            </Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Materai: {formatterRupiah(record.by_materai)}
            </Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Tabungan: {formatterRupiah(record.by_tabungan)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          {canUpdate("/produk") && (
            <Button
              icon={<Edit size={16} />}
              onClick={() => handleEdit(record)}
              type="link"
              title="Ubah Produk"
            ></Button>
          )}
          {canDelete("/produk") && (
            <Popconfirm
              title={`Hapus produk ${record.name}?`}
              description="Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
              onConfirm={() => handleDelete(record.id)}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button
                icon={<Trash2 size={16} />}
                danger
                type="text"
                title="Hapus Produk"
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
          Produk Pembiayaan{" "}
          <Package size={28} className="inline-block text-green-500" />
        </h1>
      </div>

      <Card className="shadow-lg">
        <Space direction="vertical" size="small" className="w-full">
          {/* Toolbar Pencarian & Tombol Tambah */}
          <div className="flex justify-between items-center">
            <Input
              placeholder="Cari Nama Produk..."
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
            {canWrite("/produk") && (
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={handleAdd}
                size="small"
              >
                Tambah Produk
              </Button>
            )}
          </div>

          {/* Tabel Data Produk */}
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
            scroll={{ x: 800, y: 320 }}
            className="w-full"
            locale={{ emptyText: "Tidak ada data produk ditemukan." }}
            size="small"
            loading={pageProps.loading}
          />
        </Space>
      </Card>

      {/* Modal Tambah/Edit */}
      <ProdukManagementForm
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        editingProduk={editingProduk}
        getData={getData}
      />
    </div>
  );
}
