// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Tabs,
  Card,
  message,
  Alert,
  Space,
  Upload,
} from "antd";
import {
  User,
  Lock,
  Mail,
  Phone,
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react";
import { User as TypeUser } from "@prisma/client";
import { useSession } from "next-auth/react";

// Tipe data untuk form profile
interface ProfileValues {
  name: string;
  email: string;
  phone: string;
  position: string;
}

// Tipe data untuk form security
interface SecurityValues {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// --- Komponen Tab Profil ---
const ProfileSettings = () => {
  const [loading, setLoading] = useState(false);
  const { data } = useSession();

  const onFinish = async (values: ProfileValues) => {
    setLoading(true);
    const req = await fetch("/api/profile", {
      method: "POST",
      body: JSON.stringify(values),
    });
    if (!req.ok) {
      const { msg } = await req.json();
      message.error(msg);
    } else {
      message.success("Update profil berhasil");
    }
    setLoading(false);
  };

  return (
    <Card title="Informasi Dasar Pengguna" className="shadow-lg">
      <Form
        layout="horizontal"
        labelCol={{ span: 5 }}
        onFinish={onFinish}
        initialValues={{ ...data?.user }}
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Bagian Kiri: Avatar */}
          <div className="flex flex-col items-center justify-start lg:w-1/4">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 overflow-hidden border-4 border-blue-500">
              {/* Tempat untuk gambar profil */}
              <ImageIcon size={48} className="text-gray-500" />
            </div>
            <Upload
              name="avatar"
              listType="picture"
              maxCount={1}
              showUploadList={false}
              beforeUpload={() => false} // Mencegah upload otomatis
              // Simulasikan fungsi upload
              onChange={(info) => {
                if (info.file.status !== "uploading") {
                  message.info(`File dipilih: ${info.file.name}`);
                }
              }}
            >
              <Button icon={<UploadCloud size={16} />} type="default" disabled>
                Ubah Foto Profil
              </Button>
            </Upload>
          </div>

          {/* Bagian Kanan: Detail Form */}
          <div className="lg:w-3/4 space-y-4">
            <Form.Item hidden name="id">
              <Input placeholder="Masukkan nama lengkap" />
            </Form.Item>
            <Form.Item
              name="name"
              label={
                <Space>
                  <User size={16} /> Nama Lengkap
                </Space>
              }
              rules={[{ required: true, message: "Nama lengkap wajib diisi!" }]}
            >
              <Input placeholder="Masukkan nama lengkap" />
            </Form.Item>

            <Form.Item
              name="email"
              label={
                <Space>
                  <Mail size={16} /> Email
                </Space>
              }
              rules={[
                {
                  type: "email",
                  message: "Email tidak valid!",
                },
              ]}
            >
              <Input placeholder="Masukkan alamat email" />
            </Form.Item>

            <Form.Item
              name="phone"
              label={
                <Space>
                  <Phone size={16} /> Nomor Telepon
                </Space>
              }
              rules={[
                { required: true, message: "Nomor telepon wajib diisi!" },
              ]}
            >
              <Input placeholder="Masukkan nomor telepon" />
            </Form.Item>

            <Form.Item name="position" label="Jabatan">
              <Input />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                {loading ? "Menyimpan..." : "Simpan Perubahan Profil"}
              </Button>
            </Form.Item>
          </div>
        </div>
      </Form>
    </Card>
  );
};

// --- Komponen Tab Keamanan ---
const SecuritySettings = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<SecurityValues>();
  const { data } = useSession();

  const onFinish = async (values: SecurityValues) => {
    setLoading(true);
    const req = await fetch("/api/profile", {
      method: "PUT",
      body: JSON.stringify(values),
    });
    if (!req.ok) {
      const { msg } = await req.json();
      message.error(msg);
    } else {
      message.success("Update password berhasil");
    }
    setLoading(false);
  };

  return (
    <Card title="Ganti Password" className="shadow-lg">
      <Alert
        message="Peringatan Keamanan"
        description="Gunakan password yang kuat (kombinasi huruf besar, kecil, angka, dan simbol) dan jangan gunakan kembali password dari situs lain."
        type="warning"
        showIcon
        style={{ fontSize: 11 }}
      />
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 10 }}
        onFinish={onFinish}
        initialValues={{ id: data?.user.id }}
        // className="max-w-xl"
      >
        <Form.Item
          name="id"
          label="Password Saat Ini"
          rules={[
            { required: true, message: "Password saat ini wajib diisi!" },
          ]}
          hidden
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password Saat Ini"
          rules={[
            { required: true, message: "Password saat ini wajib diisi!" },
          ]}
        >
          <Input.Password placeholder="Masukkan password lama Anda" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="Password Baru"
          rules={[
            { required: true, message: "Password baru wajib diisi!" },
            { min: 8, message: "Password minimal 8 karakter." },
          ]}
        >
          <Input.Password placeholder="Masukkan password baru" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Konfirmasi Password Baru"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Konfirmasi password wajib diisi!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Password baru tidak cocok!"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Ulangi password baru Anda" />
        </Form.Item>

        <Form.Item className="flex justify-end">
          <Button type="primary" htmlType="submit" loading={loading} danger>
            {loading ? "Mengubah..." : "Ubah Password"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

// --- Halaman Utama Pengaturan ---

const items = [
  {
    key: "profile",
    label: (
      <Space>
        <User size={16} /> Profil
      </Space>
    ),
    children: <ProfileSettings />,
  },
  {
    key: "security",
    label: (
      <Space>
        <Lock size={16} /> Keamanan
      </Space>
    ),
    children: <SecuritySettings />,
  },
];

export default function UserSettingsPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan Akun</h1>
      </div>

      {/* Tabs Kontainer */}
      <Tabs
        defaultActiveKey="profile"
        items={items}
        size="large"
        className="bg-white p-6 rounded-lg shadow-xl"
      />
    </div>
  );
}
