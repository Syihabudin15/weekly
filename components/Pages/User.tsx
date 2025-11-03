// app/manajemen/user/page.tsx
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
  Select,
  message,
  Row,
  Col,
  Tooltip,
  Typography,
  Popconfirm,
} from "antd";
import {
  User,
  Plus,
  Edit,
  Search,
  Users,
  Key,
  Mail,
  Phone,
  Briefcase,
  Trash2,
} from "lucide-react";
import type { TableProps } from "antd";
import { IPageProps } from "../Interface";
import { Role, User as UserType } from "@prisma/client";
import { usePermission } from "../Util";

const { Text } = Typography;
const { Option } = Select;

interface UserFormProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  editingUser: UserType | null;
  roles: Role[];
  getData: Function;
}

const UserManagementForm: React.FC<UserFormProps> = ({
  isModalVisible,
  setIsModalVisible,
  editingUser,
  roles,
  getData,
}) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const title = editingUser
    ? `Ubah Pengguna: ${editingUser.name}`
    : "Tambah Pengguna Baru";

  React.useEffect(() => {
    if (editingUser) {
      form.setFieldsValue({
        ...editingUser,
        // Pastikan roleId di-set untuk Select
        roleId: editingUser.roleId,
      });
    } else {
      form.resetFields();
    }
  }, [editingUser, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    const url = editingUser ? `/api/users?id=${editingUser.id}` : "/api/users";
    const method = editingUser ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values }),
    });
    if (response.ok) {
      await getData();
      message.success(
        `Pengguna ${
          editingUser ? "diperbarui" : "ditambahkan"
        } berhasil! (Simulasi)`
      );
      setIsModalVisible(false);
    } else {
      const errorData = await response.json();
      message.error(`Gagal menyimpan role! ${errorData.msg || ""}`);
    }
    setLoading(false);
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
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Simpan
        </Button>,
      ]}
      loading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={editingUser || { status: true }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label={
                <Space>
                  <User size={16} /> Nama Lengkap
                </Space>
              }
              rules={[{ required: true }]}
            >
              <Input placeholder="Masukkan nama lengkap" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="username"
              label={
                <Space>
                  <Key size={16} /> Username
                </Space>
              }
              rules={[{ required: true }]}
            >
              <Input placeholder="Username unik" disabled={!!editingUser} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label={
                <Space>
                  <Mail size={16} /> Email
                </Space>
              }
            >
              <Input placeholder="Contoh@email.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label={
                <Space>
                  <Phone size={16} /> Telepon
                </Space>
              }
            >
              <Input placeholder="08xxxxxx" />
            </Form.Item>
          </Col>
        </Row>

        {!editingUser && (
          <Form.Item
            name="password"
            label="Password"
            rules={
              editingUser
                ? []
                : [
                    {
                      required: true,
                      message: "Password wajib diisi untuk pengguna baru",
                    },
                  ]
            }
          >
            <Input.Password
              placeholder={
                editingUser ? "Kosongkan jika tidak ingin diubah" : "Password"
              }
            />
          </Form.Item>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="roleId"
              label={
                <Space>
                  <Users size={16} /> Role Pengguna
                </Space>
              }
              rules={[{ required: true }]}
            >
              <Select placeholder="Pilih Role">
                {roles.map((role) => (
                  <Option key={role.id} value={role.id}>
                    {role.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="position"
              label={
                <Space>
                  <Briefcase size={16} /> Posisi/Jabatan
                </Space>
              }
            >
              <Input placeholder="Jabatan di perusahaan" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

// --- 3. Halaman Manajemen Pengguna (Table) ---

export default function UserManagementPage() {
  const [pageProps, setPageProps] = useState<IPageProps<UserType>>({
    loading: false,
    page: 1,
    pageSize: 50,
    data: [],
    filters: [],
    total: 0,
  });
  const { canWrite, canUpdate, canDelete } = usePermission();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const handleEdit = (record: UserType) => {
    setEditingUser(record);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setIsModalVisible(true);
  };

  const getData = async () => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    const request = await fetch(
      `/api/users?page=${pageProps.page}&pageSize=${pageProps.pageSize}${
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
      const response = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        await getData();
        message.success("Pengguna berhasil dihapus!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Gagal menghapus pengguna");
      }
    } catch (error: any) {
      console.error("Error deleting role:", error);
      message.error(`Gagal menghapus pengguna! ${error.message || ""}`);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.page, pageProps.pageSize, pageProps.filters]);

  useEffect(() => {
    (async () => {
      const request = await fetch("/api/roles?page=1&pageSize=100");
      const { data } = await request.json();
      setRoles(data);
    })();
  }, []);

  const columns: TableProps<UserType>["columns"] = [
    {
      title: "Nama Pengguna",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            @{record.username}
          </Text>
        </Space>
      ),
    },
    {
      title: "Role & Posisi",
      dataIndex: ["Role", "name"],
      key: "roleName",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Tag color="blue">{text}</Tag>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.position}
          </Text>
        </Space>
      ),
    },
    {
      title: "Kontak",
      dataIndex: "email",
      key: "email",
      render: (email, record) => (
        <Space direction="vertical" size={0}>
          <Tooltip title={email || "Tidak ada Email"}>
            <div className="flex gap-1 items-center">
              <Mail size={12} /> {email || "-"}
            </div>
          </Tooltip>
          <Tooltip title={record.phone || "Tidak ada Telepon"}>
            <div className="flex gap-1 items-center">
              <Phone size={12} /> {record.phone || "-"}
            </div>
          </Tooltip>
        </Space>
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
          <Button
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
            type="link"
          ></Button>
          {canDelete("/users") && (
            <Popconfirm
              title={`Hapus pengguna ${record.name}?`}
              description="Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
              onConfirm={() => handleDelete(record.id)}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button
                icon={<Trash2 size={16} />}
                danger
                type="text"
                title="Hapus pengguna"
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
          Manajemen Pengguna 👥
        </h1>
      </div>

      <Card className="shadow-lg">
        <Space direction="vertical" size="small" className="w-full">
          {/* Toolbar Pencarian & Tombol Tambah */}
          <div className="flex justify-between items-center">
            <Input
              placeholder="Cari nama ..."
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
            {canWrite("/users") && (
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={handleAdd}
                size="small"
              >
                Tambah Pengguna
              </Button>
            )}
          </div>

          {/* Tabel Data Pengguna */}
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
            locale={{ emptyText: "Tidak ada data pengguna ditemukan." }}
            size="small"
            loading={pageProps.loading}
          />
        </Space>
      </Card>

      {/* Modal Tambah/Edit */}
      <UserManagementForm
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        editingUser={editingUser}
        roles={roles} // Ganti dengan data Role dari API Anda
        getData={getData}
        key={editingUser ? editingUser.id : "created"}
      />
    </div>
  );
}
