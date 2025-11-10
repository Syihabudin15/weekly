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
  Tooltip,
  Typography,
  Popconfirm,
  Switch,
} from "antd";
import {
  Layers,
  Plus,
  Edit,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { TableProps } from "antd";
import { Jenis } from "@prisma/client";
import { IPageProps } from "../Interface";
import { usePermission } from "../Util";

const { Text } = Typography;

interface JenisFormProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  editingJenis: Jenis | null;
  getData: () => void;
}

const JenisManagementForm: React.FC<JenisFormProps> = ({
  isModalVisible,
  setIsModalVisible,
  editingJenis,
  getData,
}) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const title = editingJenis
    ? `Ubah Jenis: ${editingJenis.name}`
    : "Tambah Jenis Pembiayaan Baru";

  React.useEffect(() => {
    if (editingJenis) {
      form.setFieldsValue(editingJenis);
    } else {
      form.resetFields();
    }
  }, [editingJenis, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    // API endpoint disesuaikan untuk Jenis
    const url = editingJenis
      ? `/api/jenis?id=${editingJenis.id}`
      : "/api/jenis";
    const method = editingJenis ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values }),
      });

      if (response.ok) {
        await getData();
        message.success(
          `Jenis Kredit ${
            editingJenis ? "diperbarui" : "ditambahkan"
          } berhasil!`
        );
        setIsModalVisible(false);
      } else {
        const errorData = await response.json();
        message.error(
          `Gagal menyimpan jenis kredit! ${
            errorData.msg || "Terjadi kesalahan."
          }`
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
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={editingJenis || { status: true, pelunasan: false }}
      >
        <Form.Item
          name="name"
          label="Jenis Kredit"
          rules={[{ required: true }]}
        >
          <Input placeholder="Contoh: Topup, Baru" />
        </Form.Item>
        <Form.Item name="description" label="Deskripsi">
          <Input.TextArea rows={2} placeholder="Penjelasan singkat" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="pelunasan"
              label="Pelunasan Diperbolehkan"
              valuePropName="checked"
              tooltip="Tandai jika jenis kredit ini ada pelunasan."
            >
              <Switch
                checkedChildren={<CheckCircle size={14} />}
                unCheckedChildren={<XCircle size={14} />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status Jenis"
              valuePropName="checked"
              tooltip="Nonaktifkan jika jenis ini tidak lagi ditawarkan."
              hidden
            >
              <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

// --- Halaman Manajemen Jenis (Table) ---

export default function JenisManagementPage() {
  const [pageProps, setPageProps] = useState<IPageProps<Jenis>>({
    loading: false,
    page: 1,
    pageSize: 50,
    data: [],
    filters: [],
    total: 0,
  });
  const { canWrite, canUpdate, canDelete } = usePermission();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingJenis, setEditingJenis] = useState<Jenis | null>(null);

  const handleEdit = (record: Jenis) => {
    setEditingJenis(record);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingJenis(null);
    setIsModalVisible(true);
  };

  const getData = async () => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    const request = await fetch(
      `/api/jenis?page=${pageProps.page}&pageSize=${pageProps.pageSize}${
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
      const response = await fetch(`/api/jenis?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        await getData();
        message.success("Jenis berhasil dihapus!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Gagal menghapus jenis");
      }
    } catch (error: any) {
      console.error("Error deleting jenis:", error);
      message.error(`Gagal menghapus jenis! ${error.message || ""}`);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.page, pageProps.pageSize, pageProps.filters]);

  const columns: TableProps<Jenis>["columns"] = [
    {
      title: "Nama Jenis",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Deskripsi",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => <Tooltip title={text}>{text || "-"}</Tooltip>,
    },
    {
      title: "Pelunasan",
      dataIndex: "pelunasan",
      key: "pelunasan",
      align: "center",
      render: (pelunasan: boolean) => (
        <Tag color={pelunasan ? "green" : "red"}>
          {pelunasan ? "Ya" : "Tidak"}
        </Tag>
      ),
    },
    {
      title: "Dibuat",
      dataIndex: "created_at",
      key: "created_at",
      render: (dateString: string) =>
        new Date(dateString).toLocaleDateString("id-ID"),
    },
    {
      title: "Aksi",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          {canUpdate("/jenis") && (
            <Button
              icon={<Edit size={16} />}
              onClick={() => handleEdit(record)}
              type="link"
              title="Ubah Jenis"
            ></Button>
          )}
          {canDelete("/jenis") && (
            <Popconfirm
              title={`Hapus jenis ${record.name}?`}
              description="Anda yakin ingin menghapus jenis ini? Tindakan ini tidak dapat dibatalkan."
              onConfirm={() => handleDelete(record.id)}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button
                icon={<Trash2 size={16} />}
                danger
                type="text"
                title="Hapus Jenis"
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
          Jenis Pembiayaan{" "}
          <Layers size={28} className="inline-block text-blue-500" />
        </h1>
      </div>

      <Card className="shadow-lg">
        <Space direction="vertical" size="small" className="w-full">
          {/* Toolbar Pencarian & Tombol Tambah */}
          <div className="flex justify-between items-center">
            <Input
              placeholder="Cari Nama Jenis..."
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
            {canWrite("/jenis") && (
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={handleAdd}
                size="small"
              >
                Tambah Jenis
              </Button>
            )}
          </div>

          {/* Tabel Data Jenis */}
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
            locale={{ emptyText: "Tidak ada data jenis ditemukan." }}
            size="small"
            loading={pageProps.loading}
          />
        </Space>
      </Card>

      {/* Modal Tambah/Edit */}
      <JenisManagementForm
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        editingJenis={editingJenis}
        getData={getData}
      />
    </div>
  );
}
