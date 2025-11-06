import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Input,
  Spin,
  Popconfirm,
  TableProps,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Search } from "lucide-react";
import Link from "next/link";
import { IDapem, IPageProps } from "../Interface";
import { calculateWeeklyPayment, formatterRupiah, STATUS_MAP } from "../Util";

const { Title } = Typography;
// --- Main Application List Component ---
const ApplicationListManagement = () => {
  const [pageProps, setPageProps] = useState<IPageProps<IDapem>>({
    loading: false,
    page: 1,
    pageSize: 50,
    data: [],
    total: 0,
    filters: [],
  });

  const getData = async () => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    const req = await fetch(
      `/api/dapem?page=${pageProps.page}&pageSize=${
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

  const handleDelete = async (id: string) => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    await fetch("/api/dapem?id=" + id, { method: "DELETE" })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          await getData();
          message.success("Data berhasil dihapus");
        } else {
          message.error(res.msg);
        }
      })
      .catch((err) => {
        console.log(err);
        message.error("Internal server error!");
      });
    setPageProps((prev) => ({ ...prev, loading: false }));
  };

  const handleSend = async (record: IDapem) => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    await fetch("/api/dapem", {
      method: "PUT",
      body: JSON.stringify(record),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          await getData();
          message.success("Status pengajuan berhasil di update!");
        } else {
          message.error(res.msg);
        }
      })
      .catch((err) => {
        console.log(err);
        message.error("Internal server error!");
      });
    setPageProps((prev) => ({ ...prev, loading: false }));
  };

  // --- Table Columns Definition ---
  const columns: TableProps<IDapem>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id.localeCompare(b.id),
      fixed: "left",
      width: 110,
    },
    {
      title: "Debitur",
      dataIndex: ["DataDebitur", "name"],
      key: "debtorName",
      width: 180,
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
      className: "text-right",
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
      title: "Angsuran",
      dataIndex: "angsuran",
      key: "angsuran",
      render: (text, record) => {
        const installl = calculateWeeklyPayment(
          record.plafon,
          record.margin,
          record.tenor
        );
        return (
          <Tag color="volcano" className="font-medium">
            {formatterRupiah(installl)}
          </Tag>
        );
      },
      width: 150,
    },
    {
      title: "Keluarga",
      dataIndex: ["DataDebitur", "DataKeluarga"],
      key: "familyMembers",
      render: (members) => (
        <Tag color={members.length > 0 ? "geekblue" : "default"}>
          {members.length} Orang
        </Tag>
      ),
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
      render: (_, record) => (
        <Space size="small">
          {/* Edit hanya tersedia jika statusnya DRAFT */}
          {record.status_sub === "DRAFT" && (
            <Link href={"/pengajuan/upsert/" + record.id}>
              <Button icon={<EditOutlined />} size="small"></Button>
            </Link>
          )}

          {/* Kirim (Submit) hanya tersedia jika statusnya DRAFT */}
          {record.status_sub === "DRAFT" && (
            <Popconfirm
              title={`Kirim Pengajuan #${record.id}?`}
              description="Data akan dikirimkan ke Approval dan Status akan diubah menjadi PENDING."
              onConfirm={() => handleSend(record)}
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
      fixed: window && window.innerWidth > 600 ? "right" : false,
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
              className="bg-blue-500 hover:bg-blue-600 mr-3"
              onClick={() => getData()}
            >
              Refresh
            </Button>
            <Link href={`/pengajuan/upsert`}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
              >
                Input Pengajuan Baru
              </Button>
            </Link>
          </Col>
        </Row>
        <div className="p-2">
          <Input
            placeholder="Cari nama..."
            prefix={<Search size={14} />}
            style={{ width: 170 }}
            onChange={(e) => {
              const filt = pageProps.filters.filter((f) => f.key !== "search");
              if (e.target.value) {
                filt.push({ key: "search", value: e.target.value });
              }
              setPageProps((prev) => ({ ...prev, filters: filt }));
            }}
            size="small"
          />
        </div>

        <Spin spinning={pageProps.loading} tip="Memuat atau memproses data...">
          <Table
            columns={columns as TableProps["columns"]}
            dataSource={pageProps.data}
            rowKey={"id"}
            pagination={{
              pageSize: pageProps.pageSize,
              pageSizeOptions: [50, 100, 200, 500, 1000],
              total: pageProps.total,
              onChange(page, pageSize) {
                setPageProps((prev) => ({ ...prev, page, pageSize }));
              },
            }}
            bordered
            size="middle"
            scroll={{ x: 1200, y: 320 }} // Sesuaikan scroll horizontal
          />
        </Spin>
      </Card>
    </div>
  );
};

export default ApplicationListManagement;
