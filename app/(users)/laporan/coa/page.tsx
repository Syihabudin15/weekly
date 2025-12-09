"use client";

import { IActtion, IPageProps } from "@/components/Interface";
import { usePermission } from "@/components/Util";
import { COA } from "@prisma/client";
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  TableProps,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2, Search, ListCheckIcon, PlusCircle } from "lucide-react";
import dayjs from "dayjs";
const { Title } = Typography;

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<COA>>({
    loading: false,
    page: 1,
    pageSize: 50,
    data: [],
    total: 0,
    filters: [],
  });
  const [action, setAction] = useState<IActtion<COA>>({
    upsert: false,
    delete: false,
    loading: false,
    data: undefined,
  });
  const { canWrite, canUpdate, canDelete } = usePermission();

  const getData = async () => {
    setPageProps((prev) => ({ ...prev, loading: true }));
    const req = await fetch(
      `/api/coa?page=${pageProps.page}&pageSize=${
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

  const handleDelete = async () => {
    if (!action.data) return alert("Tidak ada data untuk dihapus!");
    setAction((prev) => ({ ...prev, loading: true }));
    await fetch("/api/coa?id=" + action.data.id, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(async (res) => {
        setAction((prev) => ({ ...prev, data: undefined, upsert: false }));
        await getData();
      });
    setAction((prev) => ({ ...prev, loading: false }));
  };

  const columns: TableProps<COA>["columns"] = useMemo(
    () => [
      {
        title: "ID COA",
        dataIndex: "id",
        key: "id",
        width: 120,
      },
      {
        title: "Akun",
        dataIndex: "name",
        key: "name",
        width: 180,
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        render: (text, record) => (
          <Tag color={record.type === "MASUK" ? "blue" : "red"}>{text}</Tag>
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

  return (
    <div className="bg-gray-50">
      <Title
        level={3}
        className="text-xl font-bold mb-4 text-gray-800 flex gap-2 items-center"
      >
        <ListCheckIcon size={18} /> Daftar Akun
      </Title>

      <Spin spinning={pageProps.loading} tip="Memuat data status...">
        <Card
          className="shadow-md rounded-lg"
          styles={{ body: { padding: 5 } }}
        >
          <div className="p-2 flex justify-between">
            <div className="flex gap-2 items-center">
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
              <Select
                options={[
                  { label: "MASUK", value: "MASUK" },
                  { label: "KELUAR", value: "KELUAR" },
                ]}
                allowClear
                size="small"
                style={{ width: 150 }}
                placeholder="Pilih Type.."
                onChange={(e) => {
                  const filt = pageProps.filters.filter(
                    (f) => f.key !== "type"
                  );
                  if (e) {
                    filt.push({ key: "type", value: e });
                  }
                  setPageProps((prev) => ({ ...prev, filters: filt }));
                }}
              />
            </div>
            <Input
              placeholder="Cari Akun..."
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
          </div>
          <Table
            columns={columns}
            dataSource={pageProps.data}
            pagination={{
              pageSize: pageProps.pageSize,
              total: pageProps.total,
              pageSizeOptions: [50, 100, 200, 500, 1000],
              onChange(page, pageSize) {
                setPageProps((prev) => ({ ...prev, page, pageSize }));
              },
            }}
            scroll={{ x: 800, y: 320 }}
            className="w-full"
            bordered
            size="small"
            loading={pageProps.loading}
            rowKey={"id"}
          />
        </Card>
      </Spin>
      <UpsertCOA
        action={action}
        setAction={setAction}
        getData={getData}
        key={action.data ? action.data.id : "create"}
      />
      {action.data && (
        <Modal
          open={action.delete}
          onCancel={() =>
            setAction({ ...action, delete: false, data: undefined })
          }
          title={"Hapus COA " + action.data.name}
          onOk={() => handleDelete()}
          loading={action.loading}
          okButtonProps={{ danger: true }}
        >
          <p>Konfirmasi hapus COA *{action.data.name}* ini?</p>
        </Modal>
      )}
    </div>
  );
}

const UpsertCOA = ({
  action,
  setAction,
  getData,
}: {
  action: IActtion<COA>;
  setAction: Function;
  getData: Function;
}) => {
  const [data, setData] = useState(action.data || defaultCOA);

  const handleSubmit = async () => {
    setAction((prev) => ({ ...prev, loading: true }));
    await fetch("/api/coa", {
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
      title={action.data ? "Update Data COA" : "Tambah Data COA"}
      onCancel={() =>
        setAction((prev) => ({ ...prev, upsert: false, data: undefined }))
      }
      onOk={() => handleSubmit()}
      loading={action.loading}
    >
      <div className="flex gap-2 items-center my-1">
        <p className="w-44">Nama Akun</p>
        <Input
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
        />
      </div>
      <div className="flex gap-2 items-center my-1">
        <p className="w-44">Type Akun</p>
        <Select
          className="w-full"
          value={data.type}
          onChange={(e) => setData({ ...data, type: e })}
          options={[
            { label: "MASUK", value: "MASUK" },
            { label: "KELUAR", value: "KELUAR" },
          ]}
        />
      </div>
    </Modal>
  );
};

const defaultCOA: COA = {
  id: "",
  name: "",
  type: "MASUK",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
};
