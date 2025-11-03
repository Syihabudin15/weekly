// app/roles/page.tsx
"use client";

import { useState, useEffect } from "react";
import { usePermission } from "@/components/Util";
import { Edit, Trash2, Shield, Search, PlusCircle } from "lucide-react";

// Import komponen Ant Design yang diperlukan
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Checkbox,
  Tag,
  Spin,
  Alert,
  Space,
  Popconfirm,
  message,
  Card,
} from "antd";
import type { TableProps } from "antd";
import { menuItems } from "../ILayout";
import { IPermission } from "../Interface";
import { Role } from "@prisma/client";

// Interface untuk Form data (untuk antd Form)
interface RoleFormValues {
  name: string;
  description: string;
  status: boolean;
  // Permissions akan ditangani di state terpisah untuk kemudahan
}

export default function RolesPage() {
  const [form] = Form.useForm<RoleFormValues>();
  const { canWrite, canUpdate, canDelete } = usePermission();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State terpisah untuk permissions di form
  const [formPermissions, setFormPermissions] = useState<IPermission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");

  // Available permissions template
  const availablePermissions = menuItems
    .filter((m) => m.requiredPermission)
    .flatMap((m) =>
      m.children
        ? m.children.map((mc) => ({ path: mc.path, name: mc.name }))
        : { path: m.path, name: m.name }
    );

  const accessTypes = ["read", "write", "update", "delete"];

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await fetchRoles();
    }, 200);
    return () => clearTimeout(timeout);
  }, [page, pageSize, search]);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/roles?page=${page}&pageSize=${pageSize}${
          search ? "&search=" + search : ""
        }`
      );
      const { data, total } = await response.json();
      setRoles(data);
      setTotal(total);
    } catch (error) {
      console.error("Error fetching roles:", error);
      message.error("Gagal mengambil data role.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers Modal dan Form ---

  const handleOpenModal = (role?: Role) => {
    setSelectedRole(role || null);
    if (role) {
      const permissions: IPermission[] = JSON.parse(role.permissions || "[]");
      form.setFieldsValue({
        name: role.name,
        description: role.description || "",
        status: role.status,
      });
      setFormPermissions(permissions);
    } else {
      form.resetFields();
      form.setFieldsValue({ status: true }); // Default status to active
      setFormPermissions([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
    form.resetFields();
    setFormPermissions([]);
  };

  const handlePermissionChange = (
    path: string,
    checked: boolean,
    accessType: string
  ) => {
    const existingPermissionIndex = formPermissions.findIndex(
      (p) => p.path === path
    );

    let updatedPermissions: IPermission[];

    if (checked) {
      // Add access type
      if (existingPermissionIndex >= 0) {
        updatedPermissions = formPermissions.map((p, index) =>
          index === existingPermissionIndex
            ? { ...p, access: Array.from(new Set([...p.access, accessType])) }
            : p
        );
      } else {
        // Add new permission object
        const permission = availablePermissions.find((p) => p.path === path);
        updatedPermissions = [
          ...formPermissions,
          { path, name: permission?.name || path, access: [accessType] },
        ];
      }
    } else {
      // Remove access type
      if (existingPermissionIndex >= 0) {
        const currentPermission = formPermissions[existingPermissionIndex];
        const newAccess = currentPermission.access.filter(
          (a) => a !== accessType
        );

        if (newAccess.length === 0) {
          // Remove permission if no access is left
          updatedPermissions = formPermissions.filter((p) => p.path !== path);
        } else {
          // Update permission with new access array
          updatedPermissions = formPermissions.map((p, index) =>
            index === existingPermissionIndex ? { ...p, access: newAccess } : p
          );
        }
      } else {
        updatedPermissions = formPermissions; // Should not happen if unchecked
      }
    }

    setFormPermissions(updatedPermissions);
  };

  const getPermissionAccess = (path: string): string[] => {
    const permission = formPermissions.find((p) => p.path === path);
    return permission?.access || [];
  };

  const onFinish = async (values: RoleFormValues) => {
    if (formPermissions.length === 0) {
      message.warning("Setidaknya satu permission harus dipilih.");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = selectedRole
        ? `/api/roles?id=${selectedRole.id}`
        : "/api/roles";
      const method = selectedRole ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          permissions: JSON.stringify(formPermissions), // Convert permissions array to JSON string
        }),
      });

      if (response.ok) {
        await fetchRoles();
        handleCloseModal();
        message.success(
          selectedRole
            ? "Role berhasil diupdate!"
            : "Role berhasil ditambahkan!"
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Gagal menyimpan role");
      }
    } catch (error: any) {
      console.error("Error saving role:", error);
      message.error(`Gagal menyimpan role! ${error.message || ""}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/roles?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchRoles();
        message.success("Role berhasil dihapus!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menghapus role");
      }
    } catch (error: any) {
      console.error("Error deleting role:", error);
      message.error(`Gagal menghapus role! ${error.message || ""}`);
    }
  };

  // --- Konfigurasi Tabel Antd ---

  const columns: TableProps<Role>["columns"] = [
    {
      title: "NAMA ROLE",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <Space>
          <Shield size={16} className="text-blue-500" />
          <span className="font-medium text-gray-900">{text}</span>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "KETERANGAN",
      dataIndex: "description",
      key: "description",
      render: (text) => text || "-",
    },
    {
      title: "AKSI",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          {canUpdate("/roles") && (
            <Button
              icon={<Edit size={16} />}
              onClick={() => handleOpenModal(record)}
              type="text"
              title="Edit Role"
              className="text-blue-600 hover:text-blue-700"
            />
          )}
          {canDelete("/roles") && (
            <Popconfirm
              title={`Hapus Role ${record.name}?`}
              description="Anda yakin ingin menghapus role ini? Tindakan ini tidak dapat dibatalkan."
              onConfirm={() => handleDelete(record.id)}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button
                icon={<Trash2 size={16} />}
                danger
                type="text"
                title="Hapus Role"
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Role Management 🛡️
          </h1>
        </div>
      </div>
      {/* Search and Table */}
      <Card>
        <div className="flex gap-2 justify-between items-center mb-2">
          {/* Search */}
          <div className="">
            <Input
              size="small"
              prefix={<Search size={12} className="mr-2" />}
              placeholder="Cari nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>
          {canWrite("/roles") && (
            <Button
              type="primary"
              icon={<PlusCircle size={15} />}
              onClick={() => handleOpenModal()}
              size="small"
            >
              Tambah Role
            </Button>
          )}
        </div>
        {/* Table */}
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          pagination={{
            pageSize: pageSize,
            pageSizeOptions: [50, 100, 500, 1000],
            total,
            onChange(page, pageSize) {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
          locale={{ emptyText: "Tidak ada data role" }}
          scroll={{ x: 800, y: 320 }}
          loading={isLoading}
          size="small"
          bordered
        />
      </Card>

      {/* Modal Form */}
      <Modal
        title={selectedRole ? "Edit Role" : "Tambah Role Baru"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={[
          <Button key="back" onClick={handleCloseModal} disabled={isSubmitting}>
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSubmitting}
            onClick={() => form.submit()}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>,
        ]}
        width={800}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="horizontal"
          onFinish={onFinish}
          initialValues={{ status: true }}
          labelCol={{ span: 3 }}
        >
          {/* Role Name */}
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: "Nama role wajib diisi!" }]}
          >
            <Input placeholder="Contoh: Manager, Staff, Admin" />
          </Form.Item>

          {/* Description */}
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Deskripsi role..." />
          </Form.Item>

          {/* Permissions Section */}
          <Form.Item label="Permissions" required>
            <div className="border border-gray-200 rounded-lg p-2 max-h-80 overflow-y-auto bg-gray-50">
              <Table
                dataSource={availablePermissions}
                rowKey="path"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "NAMA MENU",
                    dataIndex: "name",
                    key: "name",
                    width: "30%",
                    render: (text) => (
                      <span className="font-medium">{text}</span>
                    ),
                  },
                  {
                    title: "IZIN AKSES",
                    key: "accessTypes",
                    width: "70%",
                    render: (_, record) => (
                      <Space wrap>
                        {accessTypes.map((access) => {
                          const isChecked = getPermissionAccess(
                            record.path
                          ).includes(access);
                          return (
                            <Checkbox
                              key={access}
                              checked={isChecked}
                              onChange={(e) =>
                                handlePermissionChange(
                                  record.path,
                                  e.target.checked,
                                  access
                                )
                              }
                            >
                              <Tag
                                color={isChecked ? "blue" : "default"}
                                className="capitalize"
                              >
                                {access}
                              </Tag>
                            </Checkbox>
                          );
                        })}
                      </Space>
                    ),
                  },
                ]}
              />
            </div>
          </Form.Item>

          {/* Status */}
          <Form.Item name="status" valuePropName="checked" hidden>
            <Checkbox>Active</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Permissions Modal */}
      <Modal
        title={`${selectedRole?.name || "Role"} Permissions`}
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalOpen(false)}>
            Tutup
          </Button>,
        ]}
        width={600}
      >
        <div className="max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-lg">
          {selectedRole ? (
            (JSON.parse(selectedRole.permissions || "[]") as IPermission[])
              .length > 0 ? (
              (
                JSON.parse(selectedRole.permissions || "[]") as IPermission[]
              ).map((perm) => (
                <div
                  key={perm.path}
                  className="mb-4 pb-4 border-b last:border-0"
                >
                  <div className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Shield size={16} /> {perm.name}
                  </div>
                  <Space wrap>
                    {perm.access.map((access) => (
                      <Tag key={access} color="blue" className="capitalize">
                        {access}
                      </Tag>
                    ))}
                  </Space>
                </div>
              ))
            ) : (
              <Alert
                message="Tidak Ada Permissions"
                description="Role ini tidak memiliki permission yang ditetapkan."
                type="info"
                showIcon
              />
            )
          ) : (
            <Spin />
          )}
        </div>
      </Modal>
    </div>
  );
}
