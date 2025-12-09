"use client";

import { IActtion, IPageProps, ITransaction } from "@/components/Interface";
import { formatterRupiah, usePermission } from "@/components/Util";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  TableProps,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  DollarSign,
  Edit,
  PlusCircle,
  Printer,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { KpiCard } from "@/components/Pages/Dashboard";
import { COA } from "@prisma/client";
import moment from "moment";
import { printTxLaporan } from "@/components/Pages/PrintLapTx";
const { Title } = Typography;
const { RangePicker } = DatePicker;

interface ILap<T> extends IPageProps<T> {
  pemasukan: T[];
  pengeluaran: T[];
  allpemasukan: T[];
  allpengeluaran: T[];
}

export default function Page() {
  const [pageProps, setPageProps] = useState<ILap<ITransaction>>({
    loading: false,
    page: 1,
    pageSize: 50,
    data: [],
    total: 0,
    filters: [],
    pemasukan: [],
    pengeluaran: [],
    allpemasukan: [],
    allpengeluaran: [],
  });
  const [action, setAction] = useState<IActtion<ITransaction>>({
    upsert: false,
    delete: false,
    loading: false,
    data: undefined,
  });
  const [coas, setcoas] = useState<COA[]>([]);
  const { canWrite, canUpdate, canDelete } = usePermission();

  const getData = async () => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    const req = await fetch(
      `/api/trx?page=${pageProps.page}&pageSize=${
        pageProps.pageSize
      }${pageProps.filters.map((p) => `&${p.key}=${p.value}`).join("")}`
    );
    const { data, total } = await req.json();
    const result = data[0];
    setPageProps((prev) => ({
      ...prev,
      pemasukan: result.pemasukan,
      pengeluaran: result.pengeluaran,
      allpemasukan: result.allpemasukan,
      allpengeluaran: result.allpengeluaran,
    }));
    setPageProps((prev) => ({ ...prev, loading: false, data, total }));
  };
  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.filters, pageProps.page, pageProps.pageSize]);

  useEffect(() => {
    (async () => {
      await fetch("/api/coa?pageSize=100")
        .then((res) => res.json())
        .then((res) => setcoas(res.data));
    })();
  }, []);

  const columns: TableProps<ITransaction>["columns"] = useMemo(
    () => [
      {
        title: "ID TRX",
        dataIndex: "id",
        key: "id",
        width: 120,
      },
      {
        title: "Nominal",
        dataIndex: "nominal",
        key: "nominal",
        width: 150,
        render: (text) => formatterRupiah(text),
      },
      {
        title: "Keterangan",
        dataIndex: "desc",
        key: "desc",
        width: 180,
        className: "text-xs",
      },
      {
        title: "Akun",
        dataIndex: "akun",
        key: "akun",
        width: 180,
        className: "text-xs",
        render: (_, record) => `(${record.COA.id}) ${record.COA.name}`,
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        render: (text, record) => (
          <Tag color={record.COA.type === "MASUK" ? "blue" : "red"}>
            {record.COA.type}
          </Tag>
        ),
        width: 130,
      },
      {
        title: "Created",
        dataIndex: "created_at",
        key: "created_at",
        render: (date, record) => (
          <div className="text-xs flex flex-col">
            <Tooltip title={"Tgl Dibuat"}>
              {dayjs(date).format("DD/MM/YYYY")}
            </Tooltip>
          </div>
        ),
        sorter: (a, b) => a.created_at.getTime() - b.created_at.getTime(),
        width: 130,
      },
      {
        title: "Aksi",
        key: "action",
        width: 100,
        render: (value, record) => (
          <Space size="small">
            {canUpdate("/laporan/coa") && (
              <Tooltip title="Update">
                <Button
                  size="small"
                  icon={<Edit size={14} />}
                  onClick={() =>
                    setAction((prev) => ({
                      ...prev,
                      upsert: true,
                      data: record,
                    }))
                  }
                ></Button>
              </Tooltip>
            )}
            {canDelete("/laporan/coa") && (
              <Tooltip title="Update">
                <Button
                  size="small"
                  danger
                  icon={<Trash2 size={14} />}
                  onClick={() =>
                    setAction((prev) => ({
                      ...prev,
                      delete: true,
                      data: record,
                    }))
                  }
                ></Button>
              </Tooltip>
            )}
          </Space>
        ),
      },
    ],
    [canUpdate, canDelete]
  );

  const handleDelete = async () => {
    if (!action.data) return alert("Tidak ada data untuk dihapus!");
    setAction((prev) => ({ ...prev, loading: true }));
    await fetch("/api/trx?id=" + action.data.id, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(async (res) => {
        setAction((prev) => ({ ...prev, data: undefined, upsert: false }));
        await getData();
      });
    setAction((prev) => ({ ...prev, loading: false }));
  };

  return (
    <div className="bg-gray-50">
      <Title
        level={3}
        className="text-xl font-bold mb-4 text-gray-800 flex gap-2 items-center"
      >
        <DollarSign size={18} /> Transaksi Keuangan
      </Title>

      <Spin spinning={pageProps.loading} tip="Memuat data status...">
        <Row gutter={[4, 4]} style={{ padding: "3px 8px" }}>
          <Col
            xs={24}
            md={6}
            style={{
              border: "1px solid #aaa",
              borderRadius: 5,
              backgroundColor: "white",
              margin: 5,
              padding: 5,
            }}
          >
            <KPI
              title={"Saldo Akhir"}
              value={(() => {
                const masuk = pageProps.allpemasukan.reduce(
                  (sum, record) => sum + record.nominal,
                  0
                );
                const keluar = pageProps.allpengeluaran.reduce(
                  (sum, record) => sum + record.nominal,
                  0
                );
                return formatterRupiah(masuk - keluar);
              })()}
              color="text-green-700"
            />
          </Col>
          <Col
            xs={24}
            md={6}
            style={{
              border: "1px solid #aaa",
              borderRadius: 5,
              backgroundColor: "white",
              margin: 5,
              padding: 5,
            }}
          >
            <KPI
              title={"Transaksi Masuk"}
              value={(() => {
                const masuk = pageProps.allpemasukan.reduce(
                  (sum, record) => sum + record.nominal,
                  0
                );
                return (
                  <div>
                    <p className="text-xs opacity-80">
                      {pageProps.allpemasukan.length} Tx
                    </p>
                    <p>{formatterRupiah(masuk)}</p>
                  </div>
                );
              })()}
              color="text-blue-700"
            />
          </Col>
          <Col
            xs={24}
            md={6}
            style={{
              border: "1px solid #aaa",
              borderRadius: 5,
              backgroundColor: "white",
              margin: 5,
              padding: 5,
            }}
          >
            <KPI
              title={"Transaksi Keluar"}
              value={(() => {
                const masuk = pageProps.allpengeluaran.reduce(
                  (sum, record) => sum + record.nominal,
                  0
                );
                return (
                  <div>
                    <p className="text-xs opacity-80">
                      {pageProps.allpemasukan.length} Tx
                    </p>
                    <p>{formatterRupiah(masuk)}</p>
                  </div>
                );
              })()}
              color="text-red-700"
            />
          </Col>
        </Row>
        <div className="flex gap-2 my-1">
          <RangePicker
            size="small"
            onChange={(e, dateStr) => {
              const filt = pageProps.filters.filter(
                (f) => f.key !== "backdate"
              );
              if (dateStr) {
                filt.push({ key: "backdate", value: dateStr });
              }
              setPageProps((prev) => ({ ...prev, filters: filt }));
            }}
          />
          {canWrite("/laporan/coa") && (
            <Button
              size="small"
              icon={<PlusCircle size={14} />}
              type="primary"
              onClick={() =>
                setAction((prev) => ({
                  ...prev,
                  upsert: true,
                  data: undefined,
                }))
              }
            >
              Add
            </Button>
          )}
          <Button
            size="small"
            icon={<Printer size={14} />}
            type="primary"
            onClick={() =>
              printTxLaporan(
                pageProps.pemasukan,
                pageProps.pengeluaran,
                pageProps.allpemasukan,
                pageProps.allpengeluaran,
                pageProps.filters.find((f) => f.key === "backdate")?.value
              )
            }
          >
            Cetak
          </Button>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="sm:w-[45vw] w-full">
            <Card
              className="shadow-md rounded-lg"
              styles={{ body: { padding: 5 } }}
            >
              <p className="text-xl font-bold">
                Transaksi Masuk (
                {formatterRupiah(
                  pageProps.pemasukan.reduce(
                    (sum, record) => sum + record.nominal,
                    0
                  )
                )}
                )
              </p>

              <Table
                columns={columns}
                dataSource={pageProps.pemasukan}
                scroll={{ x: 800, y: 320 }}
                className="w-full"
                bordered
                size="small"
                loading={pageProps.loading}
                rowKey={"id"}
              />
            </Card>
          </div>
          <div className="sm:w-[45vw] w-full">
            <Card
              className="shadow-md rounded-lg"
              styles={{ body: { padding: 5 } }}
            >
              <p className="text-xl font-bold">
                Transaksi Keluar (
                {formatterRupiah(
                  pageProps.pengeluaran.reduce(
                    (sum, record) => sum + record.nominal,
                    0
                  )
                )}
                )
              </p>

              <Table
                columns={columns}
                dataSource={pageProps.pengeluaran}
                scroll={{ x: 800, y: 320 }}
                className="w-full"
                bordered
                size="small"
                loading={pageProps.loading}
                rowKey={"id"}
              />
            </Card>
          </div>
        </div>
      </Spin>
      <UpsertTx
        action={action}
        setAction={setAction}
        getData={getData}
        key={action.data ? action.data.id : "create"}
        coas={coas}
      />
      {action.data && (
        <Modal
          open={action.delete}
          onCancel={() =>
            setAction({ ...action, delete: false, data: undefined })
          }
          title={"Hapus Transaksi " + action.data.id}
          onOk={() => handleDelete()}
          loading={action.loading}
          okButtonProps={{ danger: true }}
        >
          <p>Konfirmasi hapus Transaksi dengan TXID *{action.data.id}* ini?</p>
        </Modal>
      )}
    </div>
  );
}

const UpsertTx = ({
  action,
  setAction,
  getData,
  coas,
}: {
  action: IActtion<ITransaction>;
  setAction: Function;
  getData: Function;
  coas: COA[];
}) => {
  const [data, setData] = useState(action.data || defaultTx);

  const handleSubmit = async () => {
    setAction((prev) => ({ ...prev, loading: true }));
    await fetch("/api/trx", {
      method: action.data ? "PUT" : "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(async (res) => {
        setAction((prev) => ({ ...prev, data: undefined, upsert: false }));
        await getData();
      });
    setAction((prev) => ({ ...prev, loading: false }));
  };

  return (
    <Modal
      open={action.upsert}
      title={action.data ? "Update Data TX" : "Tambah Data TX"}
      onCancel={() =>
        setAction((prev) => ({ ...prev, upsert: false, data: undefined }))
      }
      onOk={() => handleSubmit()}
      loading={action.loading}
    >
      <div className="flex gap-2 items-center my-1">
        <p className="w-44">Nominal</p>
        <InputNumber<number>
          step={1000}
          formatter={formatterRupiah}
          value={data.nominal}
          parser={(displayValue) => {
            const cleanValue = displayValue
              ? displayValue.replace(/[^0-9]/g, "")
              : "0";
            return parseFloat(cleanValue) || 0;
          }}
          onChange={(e) => setData({ ...data, nominal: e || 0 })}
          className="w-full"
          style={{ width: "100%" }}
        />
      </div>
      <div className="flex gap-2 items-center my-1">
        <p className="w-44">Keterangan</p>
        <Input.TextArea
          value={data.desc || ""}
          onChange={(e) => setData({ ...data, desc: e.target.value })}
        />
      </div>
      <div className="flex gap-2 items-center my-1">
        <p className="w-44">COA</p>
        <Select
          className="w-full"
          value={data.cOAId}
          onChange={(e) => setData({ ...data, cOAId: e })}
          options={coas.map((c) => ({ label: c.name, value: c.id }))}
          showSearch
          optionFilterProp="label"
        />
      </div>
      <div className="flex gap-2 items-center my-1">
        <p className="w-44">Tanggal Tx</p>
        <Input
          type="date"
          value={moment(data.created_at).format("YYYY-MM-DD")}
          onChange={(e) =>
            setData({
              ...data,
              created_at: !isNaN(new Date(e.target.value).getTime())
                ? moment(e.target.value).toDate()
                : new Date(),
            })
          }
        />
      </div>
    </Modal>
  );
};

const defaultTx: ITransaction = {
  id: "",
  desc: null,
  nominal: 0,
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  file: null,
  cOAId: "",
  COA: {
    id: "",
    name: "",
    type: "MASUK",
    status: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

const KPI = ({
  title,
  value,
  color,
}: {
  title: any;
  value: any;
  color: string;
}) => (
  <div>
    <div className="font-semibold opacity-70 flex gap-2 items-center">
      <Wallet size={20} /> {title}
    </div>
    <div className={`font-bold my-2 text-lg ${color}`}>{value}</div>
  </div>
);
