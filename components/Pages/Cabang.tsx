import { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Space,
  Table,
  Button,
  TableProps,
  Form,
  message,
  Popconfirm,
  Input,
  Modal,
} from "antd";
import {
  MapPin,
  GitBranch,
  Plus,
  Edit,
  Trash2,
  XCircle,
  Save,
} from "lucide-react";
import { IPageProps } from "../Interface";
import { Unit } from "@prisma/client";
import { usePermission } from "../Util";

const { Title, Text } = Typography;

export default function BranchManagement() {
  const [pageProps, setPageProps] = useState<IPageProps<Unit>>({
    loading: false,
    page: 1,
    pageSize: 50,
    data: [],
    total: 0,
    filters: [],
  });
  const { canWrite, canUpdate, canDelete } = usePermission();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const getData = async () => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    const req = await fetch(
      `/api/cabang?page=${pageProps.page}&pageSize=${
        pageProps.pageSize
      }${pageProps.filters.map((p) => `&${p.key}=${p.value}`).join("")}`
    );
    const { data, total } = await req.json();
    setPageProps((prev) => ({ ...prev, loading: false, data, total }));
  };
  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.filters, pageProps.page, pageProps.pageSize]);

  const branchColumns: TableProps<Unit>["columns"] = [
    {
      title: "NO",
      dataIndex: "no",
      key: "no",
      width: 80,
      align: "center",
      render(value, record, index) {
        return <>{index + 1}</>;
      },
    },
    {
      title: (
        <Space>
          <MapPin size={16} /> Kode Cabang
        </Space>
      ),
      dataIndex: "code",
      key: "code",
      width: 200,
      render: (text: string) => (
        <Text copyable strong className="text-indigo-700">
          {text}
        </Text>
      ),
    },
    {
      title: "Nama Cabang",
      dataIndex: "name",
      key: "name",
      // Gunakan `className` untuk memastikan teks tidak terpotong
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_, record: Unit) => (
        <Space size="small">
          {canUpdate("/cabang") && (
            <Button
              icon={<Edit size={14} />}
              type="primary"
              size="small"
              onClick={() => openEditModal(record)}
            ></Button>
          )}
          {canDelete("/cabang") && (
            <Popconfirm
              title="Hapus Cabang"
              description={`Anda yakin ingin menghapus cabang ${record.name}?`}
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
              ></Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];
  const openCreateModal = () => {
    if (!canWrite)
      return message.error("Anda tidak memiliki izin untuk menambah cabang.");
    setIsEditing(false);
    setModalTitle("Tambah Cabang Baru");
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (record: Unit) => {
    if (!canUpdate)
      return message.error("Anda tidak memiliki izin untuk mengedit cabang.");
    setIsEditing(true);
    setModalTitle(`Edit Cabang: ${record.name}`);
    form.setFieldsValue(record); // Isi form dengan data yang diedit
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSave = async (values: Unit) => {
    // Terapkan loading state pada modal/tombol
    setPageProps((prev) => ({ ...prev, loading: true }));
    await new Promise((resolve) => setTimeout(resolve, 300)); // Simulasikan latensi

    const req = await fetch(
      isEditing ? "/api/cabang?id=" + values.id : "/api/cabang",
      {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(values),
      }
    );
    if (!req.ok) {
      const { msg } = await req.json();
      message.error(msg || "Internal Server Error");
      setPageProps((prev) => ({ ...prev, loading: false }));
      return;
    }
    if (isEditing) {
      message.success(`Cabang ${values.name} berhasil diperbarui!`);
    } else {
      message.success(`Cabang ${values.name} berhasil ditambahkan!`);
    }

    setPageProps((prev) => ({ ...prev, loading: false }));
    await getData();
    handleCancel(); // Tutup modal
  };

  const handleDelete = async (record: Unit) => {
    if (!canDelete)
      return message.error("Anda tidak memiliki izin untuk menghapus cabang.");
    setPageProps((prev) => ({ ...prev, loading: true }));
    const req = await fetch("/api/cabang?id=" + record.id, {
      method: "DELETE",
    });
    if (!req.ok) {
      const { msg } = await req.json();
      message.error(msg || "Internal Server Error");
      setPageProps((prev) => ({ ...prev, loading: false }));
      return;
    }
    setPageProps((prev) => ({ ...prev, loading: true }));
    await getData();

    message.success(`Cabang ${record.name} berhasil dihapus.`);
  };
  return (
    <div className=" bg-gray-50">
      <Title level={3} className="text-gray-900 flex items-center">
        <GitBranch className="mr-3 text-indigo-600" /> Manajemen Data Cabang
      </Title>

      {/* --- DAFTAR CABANG --- */}
      <Card
        className="shadow-lg"
        extra={
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => openCreateModal()}
            size="small"
          >
            Tambah Cabang
          </Button>
        }
      >
        <Table
          dataSource={pageProps.data}
          columns={branchColumns}
          rowKey="id"
          loading={pageProps.loading}
          pagination={{
            pageSize: pageProps.pageSize,
            pageSizeOptions: [50, 100, 500, 1000],
            total: pageProps.total,
            onChange(page, pageSize) {
              setPageProps((prev) => ({ ...prev, page, pageSize }));
            },
          }}
          scroll={{ x: 800, y: 300 }}
          locale={{ emptyText: "Tidak ada data cabang yang ditemukan." }}
          size="middle"
        />
      </Card>

      {/* --- MODAL TAMBAH/EDIT CABANG --- */}
      <Modal
        title={
          <Title level={4} className="flex items-center space-x-2">
            <MapPin size={20} className="text-indigo-600" />
            <span>{modalTitle}</span>
          </Title>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null} // Nonaktifkan footer default
        destroyOnClose // Pastikan form di-reset saat ditutup
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ id: "", code: "", name: "" }}
        >
          {/* Input ID untuk Edit (Hidden) */}
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          {/* Input Kode Cabang */}
          <Form.Item
            name="code"
            label="Kode Cabang"
            rules={[{ required: true, message: "Masukkan Kode Cabang!" }]}
          >
            <Input placeholder="Contoh: JKT001" className="w-full" />
          </Form.Item>

          {/* Input Nama Cabang */}
          <Form.Item
            name="name"
            label="Nama Cabang"
            rules={[{ required: true, message: "Masukkan Nama Cabang!" }]}
          >
            <Input placeholder="Contoh: Jakarta Pusat" className="w-full" />
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
                {isEditing ? "Simpan Perubahan" : "Tambah Cabang"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
