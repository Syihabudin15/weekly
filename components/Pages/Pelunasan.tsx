import { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Space,
  Table,
  Tag,
  Tooltip,
  Alert,
  Progress,
} from "antd";
import {
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  TrendingUp,
  BarChart,
} from "lucide-react";
import { formatterRupiah } from "../Util";

const { Title, Text } = Typography;

// --- TYPE INTERFACES ---

type LoanStatus = "ONGOING" | "PAID_OFF" | "DEFAULT";

interface LoanData {
  loanId: string; // ID unik untuk pinjaman/pengajuan yang disetujui
  userId: string;
  plafond: number;
  tenorWeeks: number; // Total pembayaran yang diharapkan (Tenor dalam Minggu)
  weeklyInstallment: number;
  paidInstallments: number;
  nextPaymentDate: Date;
  status: LoanStatus;
}

export default function RepaymentManagement() {
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [loading, setLoading] = useState(true);

  const getData = async () => {
    setLoading(true);
    const req = await fetch(`/api/pelunasan`);
    const data = await req.json();
    console.log(data);
    setLoans(data);
    setLoading(false);
  };
  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, []);

  const repaymentColumns = [
    {
      title: (
        <Space>
          <DollarSign size={16} /> ID Pinjaman
        </Space>
      ),
      dataIndex: "loanId",
      key: "loanId",
      width: 150,
      render: (text: string) => (
        <Text copyable strong className="text-blue-700">
          {text}
        </Text>
      ),
    },
    {
      title: (
        <Space>
          <Users size={16} /> Nama Debitur
        </Space>
      ),
      dataIndex: "userId",
      key: "userId",
      width: 250,
      render: (text: string) => <Text copyable>{text}</Text>,
    },
    {
      title: "Plafond",
      dataIndex: "plafond",
      key: "plafond",
      width: 130,
      render: (text: number) => (
        <Text type="success" strong>
          {formatterRupiah(text)}
        </Text>
      ),
    },
    {
      title: "Angsuran",
      dataIndex: "weeklyInstallment",
      key: "weeklyInstallment",
      width: 130,
      render: (text: number) => formatterRupiah(text),
    },
    {
      title: (
        <Space>
          <BarChart size={16} /> Progres
        </Space>
      ),
      key: "progress",
      width: 100,
      render: (record: LoanData) => {
        const percent = (record.paidInstallments / record.tenorWeeks) * 100;
        const status =
          record.status === "PAID_OFF"
            ? "success"
            : record.status === "DEFAULT"
            ? "exception"
            : "active";

        return (
          <Tooltip
            title={`Telah Bayar: ${record.paidInstallments} dari ${record.tenorWeeks} minggu`}
          >
            <Progress
              percent={parseFloat(percent.toFixed(1))}
              size="small"
              status={status}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Sisa Pembayaran",
      key: "remainingPayments",
      width: 150,
      render: (record: LoanData) => {
        const remaining = record.tenorWeeks - record.paidInstallments;
        return (
          <Tag
            color={
              remaining === 0 ? "green" : remaining < 5 ? "volcano" : "blue"
            }
          >
            {remaining} Minggu
          </Tag>
        );
      },
    },
    {
      title: (
        <Space>
          <TrendingUp size={16} /> Status
        </Space>
      ),
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: LoanStatus) => {
        let color, text, Icon;
        if (status === "PAID_OFF") {
          color = "green";
          text = "LUNAS";
          Icon = CheckCircle;
        } else if (status === "DEFAULT") {
          color = "red";
          text = "GAGAL BAYAR";
          Icon = XCircle;
        } else {
          color = "blue";
          text = "BERJALAN";
          Icon = Clock;
        }
        return (
          <Tag
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 600,
            }}
            color={color}
            icon={<Icon size={14} />}
          >
            {text}
          </Tag>
        );
      },
    },
    {
      title: (
        <Space>
          <Calendar size={16} /> Jatuh Tempo Berikutnya
        </Space>
      ),
      dataIndex: "nextPaymentDate",
      key: "nextPaymentDate",
      width: 200,
      render: (date: string | Date | null) => {
        if (!date) return <Tag color="default">Belum ada</Tag>;

        const d = new Date(date);
        const now = new Date();

        if (isNaN(d.getTime())) {
          return <Tag color="default">Tanggal tidak valid</Tag>;
        }

        // Jika tanggal sudah lewat dan bukan hari ini
        if (
          d.getTime() < now.getTime() &&
          d.toDateString() !== now.toDateString()
        ) {
          return (
            <Tag color="error">
              Tertunggak ({d.toLocaleDateString("id-ID")})
            </Tag>
          );
        }

        // Jika masih aktif
        return d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (value, record) => (
        <Space size="middle">
          Aksi
          {/* {record.status_sub === "PENDING" && canProses("/monitoring") && (
                  <Link href={"/pengajuan/" + record.id}>
                    <Tooltip
                      title={`Klik untuk melihat/proses pengajuan ${record.id}`}
                    >
                      <Button
                        icon={<Info size={12} />}
                        size="small"
                        type="primary"
                      ></Button>
                    </Tooltip>
                  </Link>
                )}
                {canUpdate("/monitoring") && (
                  <Tooltip title={`Edit pengajuan ${record.id}`}>
                    <Link href={"/pengajuan/upsert/" + record.id}>
                      <Button icon={<Edit size={12} />} size="small"></Button>
                    </Link>
                  </Tooltip>
                )}
                {record.status_sub !== "PENDING" &&
                  record.status_sub !== "DRAFT" && (
                    <Link href={"/pengajuan/" + record.id}>
                      <Tooltip
                        title={`Klik untuk melihat detail pengajuan ${record.id}`}
                      >
                        <Button
                          icon={<FolderOpen size={12} />}
                          size="small"
                          type="primary"
                        ></Button>
                      </Tooltip>
                    </Link>
                  )} */}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-2 bg-gray-50">
      <Title level={2} className="text-gray-900 flex items-center">
        <DollarSign className="mr-3 text-green-600" /> Manajemen Pelunasan
        Debitur
      </Title>

      {/* --- DAFTAR PINJAMAN --- */}
      <Card className="shadow-lg">
        <Table
          dataSource={loans}
          columns={repaymentColumns}
          rowKey="loanId"
          size="middle"
          loading={loading}
          pagination={{ pageSize: 50 }}
          scroll={{ x: 1000, y: 320 }}
          locale={{ emptyText: "Tidak ada data pinjaman yang ditemukan." }}
        />
      </Card>
    </div>
  );
}
