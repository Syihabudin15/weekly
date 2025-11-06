"use client";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import {
  BookUser,
  Calculator,
  Clock,
  DollarSign,
  Layers,
  Layers2,
  MinusCircle,
  Package,
  Percent,
  PlusCircle,
  SaveIcon,
  Scale,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import {
  calculateWeeklyPayment,
  convertWeeklyToMonthlyPayment,
  formatterPercent,
  formatterRupiah,
} from "../Util";
import { useEffect, useState } from "react";
import { Jenis, Produk } from "@prisma/client";
import { CalculationInputs, CalculationResults, IDapem } from "../Interface";
import { useSession } from "next-auth/react";
import moment from "moment";
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface IWilayah {
  code: string;
  name: string;
}
interface IOptionWilayah {
  province: IWilayah[];
  selectedProvince: string | undefined;
  regency: IWilayah[];
  selectedRegency: string | undefined;
  district: IWilayah[];
  selectedDistrict: string | undefined;
  village: IWilayah[];
}

export default function UpsertPengajuan({
  data,
  deviasi,
}: {
  data?: IDapem;
  deviasi?: boolean;
}) {
  const { data: session } = useSession();
  const [form] = Form.useForm();
  const [jeniss, setJeniss] = useState<Jenis[]>([]);
  const [products, setProducts] = useState<Produk[]>([]);
  const [weeklyInstallment, setWeeklyInstallment] = useState<number | null>(
    null
  ); // Angsuran Mingguan
  const [results, setResults] = useState<CalculationResults | null>(null);
  // const [schedule, setSchedule] = useState<AmortizationSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJenis, setSelectedJenis] = useState<Jenis | null>(
    data ? data.Jenis : null
  );
  const [selectedProduct, setSelectedProduct] = useState<Produk | null>(
    data ? data.Produk : null
  );
  const [wilayah, setWilayah] = useState<IOptionWilayah>({
    province: [],
    selectedProvince: data ? data.DataDebitur.provinsi : undefined,
    regency: [],
    selectedRegency: data ? data.DataDebitur.kota : undefined,
    district: [],
    selectedDistrict: data ? data.DataDebitur.kecamatan : undefined,
    village: [],
  });
  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId);
    setSelectedProduct(selectedProduct || null);
    form.setFieldsValue({
      margin: selectedProduct ? selectedProduct.margin : 0,
      by_admin: selectedProduct ? selectedProduct.by_admin : 0,
      by_tatalaksana: selectedProduct ? selectedProduct.by_tatalaksana : 0,
      by_tabungan: selectedProduct ? selectedProduct.by_tabungan : 0,
      by_materai: selectedProduct ? selectedProduct.by_materai : 0,
    });
  };
  const handleJenisChange = (jenisId: string) => {
    const selectedJenis = jeniss.find((p) => p.id === jenisId);
    setSelectedJenis(selectedJenis || null);
  };
  // Tentukan warna status DSR
  const getDsrStatusColor = (passed: boolean | null) => {
    if (passed === null) return "text-gray-500";
    return passed ? "text-green-600" : "text-red-600";
  };

  const getDsrStatusText = (passed: boolean | null) => {
    if (passed === null) return "Hitung untuk cek";
    return passed ? "Memenuhi Syarat" : "Melebihi Batas";
  };
  const onCekSimulasi = (values: CalculationInputs) => {
    setLoading(true);
    setWeeklyInstallment(null);
    setResults(null);

    const {
      plafon,
      tenor,
      margin,
      produkId,
      jenisId,
      salary,
      pelunasan,
      by_admin,
      by_tatalaksana,
      by_tabungan,
      by_materai,
    } = values;

    if (
      plafon <= 0 ||
      tenor <= 0 ||
      margin < 0 ||
      !produkId ||
      !jenisId ||
      !selectedJenis ||
      !selectedProduct ||
      selectedJenis.id !== jenisId ||
      selectedProduct.id !== produkId
    ) {
      message.error("Pastikan semua input bernilai positif.");
      setLoading(false);
      return;
    }

    try {
      // 1. Hitung Angsuran Mingguan
      const weeklyPayment = parseInt(
        calculateWeeklyPayment(plafon, margin, tenor).toFixed(0)
      );
      setWeeklyInstallment(weeklyPayment);

      // 2. Hitung Biaya-Biaya di Awal (Sama seperti skema bulanan, berdasarkan Plafon)
      const byAdmin = plafon * (by_admin / 100);
      const byTabungan = by_tabungan;
      const byTatalaksana = plafon * (by_tatalaksana / 100);
      const byMaterai = by_materai;

      const totalBiayaAwal =
        byAdmin + byTabungan + byTatalaksana + byMaterai + pelunasan;
      const plafonDiterima = plafon - totalBiayaAwal;

      const monthlyDebtPayment = convertWeeklyToMonthlyPayment(weeklyPayment);

      // DSR = (Angsuran Bulanan / Pendapatan Bulanan) * 100
      const calculatedDsr = (monthlyDebtPayment / salary) * 100;

      const dsrValidationPassed = calculatedDsr <= selectedProduct.dsr;

      setResults({
        totalBiayaAwal,
        plafonDiterima,
        calculatedDsr,
        maxDsr: selectedProduct.dsr,
        dsrValidationPassed,
        byAdmin,
        byMaterai,
        byTabungan,
        byTatalaksana,
        pelunasan,
      });
      if (!dsrValidationPassed) {
        message.warning(
          `Peringatan: DSR (${calculatedDsr.toFixed(
            2
          )}%) melebihi batas maksimum produk (${
            selectedProduct.dsr
          }%). Plafon harus disesuaikan.`
        );
      } else {
        message.success("Simulasi berhasil dihitung! DSR memenuhi syarat.");
      }

      message.success("Simulasi berhasil dihitung!");
    } catch (error) {
      console.error(error);
      message.error("Gagal menghitung simulasi.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    (async () => {
      const res = await fetch(
        `/api/wilayah${
          wilayah.selectedProvince ? "?provId=" + wilayah.selectedProvince : ""
        }${
          wilayah.selectedRegency ? "&regencyId=" + wilayah.selectedRegency : ""
        }${
          wilayah.selectedDistrict
            ? "&districtId=" + wilayah.selectedDistrict
            : ""
        }`
      );
      const { data } = await res.json();
      setWilayah((prev) => ({
        ...prev,
        province: data.provinsi,
        regency: data.kota,
        district: data.kecamatan,
        village: data.kelurahan,
      }));
    })();
  }, [
    wilayah.selectedProvince,
    wilayah.selectedDistrict,
    wilayah.selectedRegency,
  ]);

  useEffect(() => {
    (async () => {
      const reqProduct = await fetch("/api/produk?page=1&pageSize=100");
      const reqJenis = await fetch("/api/jenis?page=1&pageSize=100");
      const { data: dataProduk } = await reqProduct.json();
      const { data: dataJenis } = await reqJenis.json();
      setProducts(dataProduk);
      setJeniss(dataJenis);
    })();
    if (data) {
      onCekSimulasi(form.getFieldsValue() as CalculationInputs);
    }
  }, []);

  const handleFinish = async (e: IDapem) => {
    setLoading(true);
    e.createdById = session ? session.user.id : "";
    if (data) {
      e.createdById = data.createdById;
      e.id = data.id;
      e.DataDebitur.id = data.dataDebiturId;
    }
    e.DataDebitur.salary = e.salary;
    e.DataDebitur.tanggal_lahir = new Date(e.DataDebitur.tanggal_lahir);
    e.dsr = selectedProduct?.dsr || 50;

    await fetch(`/api/dapem`, {
      method: data ? "PUT" : "POST",
      body: JSON.stringify({
        ...e,
        Produk: selectedProduct,
        Jenis: selectedJenis,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 200) {
          message.success("Data pengajuan berhasil ditambahkan");
          window.location.href = "/pengajuan";
        } else {
          console.log({ res });
          message.error(res.msg);
        }
      })
      .catch((err) => {
        console.log(err);
        message.error("Internal Server Error");
      });
    setLoading(false);
  };

  return (
    <div className="bg-white p-2 rounded-lg">
      <Form
        form={form}
        layout="vertical"
        initialValues={
          data
            ? {
                ...data,
                DataDebitur: {
                  ...data.DataDebitur,
                  tanggal_lahir: moment(data.DataDebitur.tanggal_lahir).format(
                    "YYYY-MM-DD"
                  ),
                },
              }
            : {
                tenor: 0,
                status_sub: "DRAFT",
                DataKeluarga: [],
                margin: 0,
                pelunasan: 0,
              }
        }
        onFinish={handleFinish}
      >
        <Space>
          <User size={16} />
          <Title level={5} className="mt-4 mb-2 text-blue-600">
            Data Debitur Utama
          </Title>
        </Space>
        <Row gutter={[24, 24]}>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "name"]}
              label="Nama Debitur"
              rules={[
                { required: true, message: "Wajib mengisi nama debitur" },
              ]}
            >
              <Input placeholder="Nama lengkap sesuai KTP" />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "nik"]}
              label="NIK"
              rules={[
                {
                  required: true,
                  pattern: /^\d{16}$/,
                  message: "NIK harus 16 digit angka",
                },
              ]}
            >
              <Input
                placeholder="Nomor Induk Kependudukan (16 digit)"
                maxLength={16}
              />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "tanggal_lahir"]}
              label="Tanggal Lahir"
              rules={[
                { required: true, message: "Wajib mengisi tanggal lahir" },
              ]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name="salary"
              label="Pendapatan Bulanan"
              rules={[
                { required: true, message: "Wajib mengisi Pendapatan Bulanan" },
              ]}
            >
              <InputNumber<number>
                min={1000000}
                step={500000}
                formatter={formatterRupiah}
                parser={(displayValue) => {
                  const cleanValue = displayValue
                    ? displayValue.replace(/[^0-9]/g, "")
                    : "0";
                  return parseFloat(cleanValue) || 0;
                }}
                className="w-full"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Divider size="small" style={{ opacity: 50, color: "#aaa" }}>
          Alamat
        </Divider>
        <Row gutter={[24, 24]}>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "provinsi"]}
              label="Provinsi"
              rules={[
                { required: true, message: "Wajib memilih jenis kelamin" },
              ]}
            >
              <Select
                placeholder="Pilih Provinsi"
                onChange={(e) =>
                  setWilayah((prev) => ({
                    ...prev,
                    selectedProvince: e,
                    selectedRegency: undefined,
                    selectedDistrict: undefined,
                    regency: [],
                    district: [],
                    village: [],
                  }))
                }
              >
                {wilayah.province.map((p, i) => (
                  <Option key={i} value={p.code}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "kota"]}
              label="Kota/Kabupaten"
              rules={[{ required: true, message: "Wajib memilih kota" }]}
            >
              <Select
                placeholder="Pilih Kota/Kabupaten"
                onChange={(e) =>
                  setWilayah((prev) => ({
                    ...prev,
                    selectedRegency: e,
                    selectedDistrict: undefined,
                    district: [],
                    village: [],
                  }))
                }
              >
                {wilayah.regency.map((p, i) => (
                  <Option key={i} value={p.code}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "kecamatan"]}
              label="Kecamatan"
              rules={[{ required: true, message: "Wajib memilih kecamatan" }]}
            >
              <Select
                placeholder="Pilih Kecamatan"
                onChange={(e) =>
                  setWilayah((prev) => ({
                    ...prev,
                    selectedDistrict: e,
                    village: [],
                  }))
                }
              >
                {wilayah.district.map((p, i) => (
                  <Option key={i} value={p.code}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "kelurahan"]}
              label="Kelurahan/Desa"
              rules={[{ required: true, message: "Wajib memilih kelurahan" }]}
            >
              <Select placeholder="Pilih Kelurahan">
                {wilayah.village.map((p, i) => (
                  <Option key={i} value={p.code}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 24]}>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "alamat"]}
              label="Alamat Rumah"
              rules={[
                { required: true, message: "Wajib mengisi alamat rumah" },
              ]}
            >
              <TextArea placeholder="Jl. example No 18 RT 001 RW 001"></TextArea>
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "kode_pos"]}
              label="Kode Pos"
              rules={[{ required: true, message: "Wajib mengisi kode pos" }]}
            >
              <Input placeholder="40399" />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "jenis_kelamin"]}
              label="Jenis Kelamin"
              rules={[
                { required: true, message: "Wajib memilih jenis kelamin" },
              ]}
            >
              <Select placeholder="Pilih Jenis Kelamin">
                <Option value="L">Laki-laki</Option>
                <Option value="P">Perempuan</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "status_kawin"]}
              label="Status Kawin"
              rules={[
                { required: true, message: "Wajib memilih status kawin" },
              ]}
            >
              <Select placeholder="Pilih Status">
                <Option value="K">Kawin</Option>
                <Option value="BK">Belum Kawin</Option>
                <Option value="J">Janda</Option>
                <Option value="D">Duda</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 24]}>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "pekerjaan"]}
              label="Pekerjaan"
              rules={[{ required: true, message: "Wajib mengisi Pekerjaan" }]}
            >
              <Input placeholder="Pedagang" />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "alamat_pekerjaan"]}
              label="Alamat Pekerjaan"
              rules={[
                { required: true, message: "Wajib mengisi Alamat Pekerjaan" },
              ]}
            >
              <TextArea placeholder="Jl. xx No x"></TextArea>
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["DataDebitur", "no_telepon"]}
              label="No Telepon"
              rules={[{ required: true, message: "Wajib mengisi No Telepon" }]}
            >
              <Input placeholder="088xxxxxxxxx" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* --- SEKSI DATA KELUARGA (TANGGUNGAN) --- */}
        <Space>
          <BookUser size={16} />
          <Title level={5} className="mt-4 mb-2 text-blue-600">
            Data Keluarga (Kontak Darurat)
          </Title>
        </Space>
        <Form.List name={["DataDebitur", "DataKeluarga"]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, fieldKey, ...restField }) => (
                <Row gutter={[24, 24]} key={key}>
                  <Form.Item
                    {...restField}
                    name={[name, "id"]}
                    fieldKey={[fieldKey || "", "id"]}
                    rules={[{ required: false, message: "Nama Wajib diisi" }]}
                    // style={{ width: 130 }}
                    hidden
                  >
                    <Input placeholder="Nama Anggota Keluarga" />
                  </Form.Item>
                  <Col xs={12} lg={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      fieldKey={[fieldKey || "", "name"]}
                      rules={[{ required: true, message: "Nama Wajib diisi" }]}
                      // style={{ width: 130 }}
                    >
                      <Input placeholder="Nama Anggota Keluarga" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} lg={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "hubungan"]}
                      fieldKey={[fieldKey || "", "hubungan"]}
                      rules={[
                        { required: true, message: "Hubungan Wajib diisi" },
                      ]}
                      // style={{ width: 120 }}
                    >
                      <Select placeholder="Hubungan">
                        <Option value="Suami/Istri">Istri/Suami</Option>
                        <Option value="Anak Kandung">Anak Kandung</Option>
                        <Option value="Orang Tua">Orang Tua</Option>
                        <Option value="Lainnya">Lainnya</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={12} lg={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "no_telepon"]}
                      fieldKey={[fieldKey || "", "no_telepon"]}
                      rules={[
                        { required: true, message: "No Telepon Wajib diisi" },
                      ]}
                      // style={{ width: 130 }}
                    >
                      <Input
                        minLength={0}
                        maxLength={15}
                        placeholder="No Telepon"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} lg={6}>
                    <MinusCircle
                      onClick={() => remove(name)}
                      className="text-red-500"
                    />
                  </Col>
                </Row>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusCircle />}
                >
                  Tambah Anggota Keluarga
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        <Form.Item name="description" label="Keterangan" className="mt-4">
          <TextArea rows={2} placeholder="Keterangan tambahan (optinal)" />
        </Form.Item>
        <Divider />
        <Space>
          <Calculator size={16} />
          <Title level={5} className="mt-4 mb-2 text-blue-600">
            Detail Permohonan Kredit
          </Title>
        </Space>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <Calculator size={20} /> Parameter Simulasi
                </Space>
              }
              className="shadow-lg"
            >
              <Row gutter={[5, 5]}>
                <Col span={12}>
                  {/* Tenor (Minggu) */}
                  <Form.Item
                    name="jenisId"
                    label={
                      <Space>
                        <Layers2 size={16} /> Jenis Kredit
                      </Space>
                    } // LABEL BERUBAH
                    rules={[
                      {
                        required: true,
                        message: "Mohon pilih jenis kredit!",
                      },
                    ]}
                  >
                    <Select
                      options={jeniss.map((j) => ({
                        label: j.name,
                        value: j.id,
                      }))}
                      onChange={handleJenisChange}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  {/* Plafond (Sama) */}
                  <Form.Item
                    name="produkId"
                    label={
                      <Space>
                        <Package size={16} /> Produk Kredit
                      </Space>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Mohon pilih produk!",
                      },
                    ]}
                  >
                    <Select
                      options={products.map((p) => ({
                        label: p.name,
                        value: p.id,
                      }))}
                      onChange={handleProductChange}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[5, 5]}>
                <Col span={12}>
                  {/* Plafond (Sama) */}
                  <Form.Item
                    name="plafon"
                    label={
                      <Space>
                        <DollarSign size={16} /> Plafond (Rp)
                      </Space>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Masukkan jumlah pembiayaan!",
                      },
                    ]}
                  >
                    <InputNumber<number>
                      min={500000}
                      max={selectedProduct?.max_plafon || 2000000}
                      step={500000}
                      formatter={formatterRupiah}
                      parser={(displayValue) => {
                        const cleanValue = displayValue
                          ? displayValue.replace(/[^0-9]/g, "")
                          : "0";
                        return parseFloat(cleanValue) || 0;
                      }}
                      className="w-full"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  {/* Tenor (Minggu) */}
                  <Form.Item
                    name="tenor"
                    label={
                      <Space>
                        <Clock size={16} /> Tenor (Minggu)
                      </Space>
                    } // LABEL BERUBAH
                    rules={[
                      {
                        required: true,
                        message: "Masukkan jangka waktu dalam minggu!",
                      },
                    ]}
                  >
                    <InputNumber<number>
                      min={0} // Minimal 1 bulan
                      max={selectedProduct?.max_tenor || 10} // Maksimal 3 tahun
                      step={4}
                      style={{ width: "100%" }}
                      formatter={(value) => `${value}`} // FORMAT BERUBAH
                      suffix="Minggu"
                      parser={(displayValue) => {
                        const cleanValue = displayValue
                          ? displayValue.replace(" Minggu", "")
                          : "0"; // PARSER BERUBAH
                        return parseInt(cleanValue) || 0;
                      }}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>
              {selectedProduct && (
                <div className="italic mb-1">
                  <div className="flex justify-between">
                    <p>Maksimal Plafon</p>
                    <p>{formatterRupiah(selectedProduct.max_plafon)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Maksimal Tenor</p>
                    <p>{selectedProduct.max_tenor} Minggu</p>
                  </div>
                </div>
              )}
              <Row gutter={[24, 24]} hidden={!deviasi}>
                <Col span={12}>
                  <Form.Item
                    name="by_admin"
                    label={
                      <Space>
                        <Percent size={16} /> Administrasi (%)
                      </Space>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Masukkan persentase biaya admin!",
                      },
                    ]}
                  >
                    <InputNumber<number>
                      min={0.1}
                      max={50}
                      step={0.1}
                      formatter={(value) => `${value}%`}
                      parser={(displayValue) => {
                        const cleanValue = displayValue
                          ? displayValue.replace("%", "")
                          : "0";
                        return parseFloat(cleanValue) || 0;
                      }}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="by_tatalaksana"
                    label={
                      <Space>
                        <Percent size={16} /> Tatalaksana (%)
                      </Space>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Masukkan persentase biaya tatalaksana!",
                      },
                    ]}
                  >
                    <InputNumber<number>
                      min={0.1}
                      max={50}
                      step={0.1}
                      formatter={(value) => `${value}%`}
                      parser={(displayValue) => {
                        const cleanValue = displayValue
                          ? displayValue.replace("%", "")
                          : "0";
                        return parseFloat(cleanValue) || 0;
                      }}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[24, 24]} hidden={!deviasi}>
                <Col span={12}>
                  <Form.Item
                    name="by_tabungan"
                    label={
                      <Space>
                        <DollarSign size={16} /> Tabungan (Rp)
                      </Space>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Masukkan jumlah tabungan!",
                      },
                    ]}
                  >
                    <InputNumber<number>
                      min={0}
                      step={100000}
                      formatter={formatterRupiah}
                      parser={(displayValue) => {
                        const cleanValue = displayValue
                          ? displayValue.replace(/[^0-9]/g, "")
                          : "0";
                        return parseFloat(cleanValue) || 0;
                      }}
                      className="w-full"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="by_materai"
                    label={
                      <Space>
                        <DollarSign size={16} /> Materai (Rp)
                      </Space>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Masukkan jumlah materai!",
                      },
                    ]}
                  >
                    <InputNumber<number>
                      min={0}
                      step={100000}
                      formatter={formatterRupiah}
                      parser={(displayValue) => {
                        const cleanValue = displayValue
                          ? displayValue.replace(/[^0-9]/g, "")
                          : "0";
                        return parseFloat(cleanValue) || 0;
                      }}
                      className="w-full"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[24, 24]}>
                <Col
                  span={12}
                  hidden={
                    selectedJenis && selectedJenis.pelunasan ? false : true
                  }
                >
                  <Form.Item
                    name="pelunasan"
                    label={
                      <Space>
                        <DollarSign size={16} /> Pelunasan (Rp)
                      </Space>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Masukkan jumlah pelunasan!",
                      },
                    ]}
                  >
                    <InputNumber<number>
                      min={0}
                      step={500000}
                      formatter={formatterRupiah}
                      parser={(displayValue) => {
                        const cleanValue = displayValue
                          ? displayValue.replace(/[^0-9]/g, "")
                          : "0";
                        return parseFloat(cleanValue) || 0;
                      }}
                      className="w-full"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12} hidden={!deviasi}>
                  <Form.Item
                    name="margin"
                    hidden
                    label={
                      <Space>
                        <Percent size={16} /> Margin (% Per Tahun)
                      </Space>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Masukkan persentase margin!",
                      },
                    ]}
                  >
                    <InputNumber<number>
                      min={0.1}
                      max={50}
                      step={0.1}
                      formatter={(value) => `${value}%`}
                      parser={(displayValue) => {
                        const cleanValue = displayValue
                          ? displayValue.replace("%", "")
                          : "0";
                        return parseFloat(cleanValue) || 0;
                      }}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="button"
                  loading={loading}
                  block
                  size="large"
                  icon={<Zap size={20} />}
                  onClick={() =>
                    onCekSimulasi(
                      form.getFieldsValue() as any as CalculationInputs
                    )
                  }
                >
                  {loading ? "Menghitung..." : "Hitung Simulasi"}
                </Button>
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <TrendingUp size={20} /> Ringkasan Hasil
                </Space>
              }
              className="shadow-lg h-full"
            >
              <div className="flex flex-col gap-4">
                <Row gutter={[16, 16]}>
                  {/* Angsuran Mingguan */}
                  <Col xs={24} lg={8}>
                    <div className="bg-blue-50 p-2 rounded-lg text-center border-l-4 border-blue-500">
                      <Text type="secondary" className="block text-sm">
                        Plafon Pinjaman
                      </Text>{" "}
                      <Title level={4} className="mb-0 mt-1 text-blue-700">
                        {formatterRupiah(form.getFieldValue("plafon"))}
                      </Title>
                    </div>
                  </Col>
                  {/* Total Margin */}
                  <Col xs={24} lg={8}>
                    <div className="bg-green-50 p-2 rounded-lg text-center border-l-4 border-green-500">
                      <Text type="secondary" className="block text-sm">
                        Terima Bersih
                      </Text>
                      <Title level={4} className="mb-0 mt-1 text-green-700">
                        {results ? formatterRupiah(results.plafonDiterima) : 0}
                      </Title>
                    </div>
                  </Col>
                  {/* Total Pembayaran */}
                  <Col xs={24} lg={8}>
                    <div className="bg-red-50 p-2 rounded-lg text-center border-l-4 border-red-500">
                      <Text type="secondary" className="block text-sm">
                        Angsuran
                      </Text>
                      <Title level={4} className="mb-0 mt-1 text-red-700">
                        {weeklyInstallment
                          ? formatterRupiah(weeklyInstallment)
                          : "Rp 0"}
                      </Title>
                    </div>
                  </Col>
                </Row>
                {results && (
                  <Alert
                    message={
                      <Space>
                        <Scale size={18} />
                        Status DSR Produk ({results.maxDsr}%):
                        <Text
                          strong
                          className={getDsrStatusColor(
                            results.dsrValidationPassed
                          )}
                        >
                          {getDsrStatusText(results.dsrValidationPassed)}
                        </Text>
                      </Space>
                    }
                    description={
                      results.dsrValidationPassed
                        ? `DSR pinjaman ini ${formatterPercent(
                            results.calculatedDsr.toFixed(2)
                          )} berada di bawah batas maksimum yang ditetapkan oleh produk. Pemenuhan kriteria DSR tercapai.`
                        : `DSR sebesar ${formatterPercent(
                            results.calculatedDsr.toFixed(2)
                          )} melebihi batas produk ${formatterPercent(
                            results.maxDsr
                          )}. Pertimbangkan untuk mengurangi Plafon atau menambah Tenor.`
                    }
                    type={results.dsrValidationPassed ? "success" : "warning"}
                    showIcon
                    style={{ fontSize: 12 }}
                  />
                )}
                <Title level={4} className="mt-6 mb-2">
                  <Space>
                    <Layers size={18} /> Rincian Pencairan
                  </Space>
                </Title>
                {results ? (
                  <div className="space-y-3 p-4 bg-gray-50 border rounded-lg">
                    <div className="flex justify-between font-semibold border-b pb-1">
                      <Text>Plafond Pinjaman:</Text>
                      <Text>
                        {formatterRupiah(form.getFieldValue("plafon"))}
                      </Text>
                    </div>

                    <div className="flex justify-between text-red-600">
                      <Text>Biaya Admin:</Text>
                      <Text>- {formatterRupiah(results.byAdmin)}</Text>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <Text>Biaya Tatalaksana:</Text>
                      <Text>- {formatterRupiah(results.byTatalaksana)}</Text>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <Text>Biaya Tabungan:</Text>
                      <Text>- {formatterRupiah(results.byTabungan)}</Text>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <Text>Biaya Materai:</Text>
                      <Text>- {formatterRupiah(results.byMaterai)}</Text>
                    </div>
                    {selectedJenis && selectedJenis.pelunasan && (
                      <div className="flex justify-between text-red-600">
                        <Text>Nominal Pelunasan:</Text>
                        <Text>- {formatterRupiah(results.pelunasan)}</Text>
                      </div>
                    )}
                    <div className="flex justify-between text-red-600 font-bold">
                      <Text type="danger">Total Biaya:</Text>
                      <Text type="danger">
                        - {formatterRupiah(results.totalBiayaAwal)}
                      </Text>
                    </div>

                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-dashed">
                      <Text className="text-blue-700">
                        Plafond Bersih Diterima:
                      </Text>
                      <Text className="text-blue-700">
                        {formatterRupiah(results.plafonDiterima)}
                      </Text>
                    </div>
                  </div>
                ) : (
                  <Alert
                    message="Lakukan perhitungan simulasi untuk melihat rincian biaya dan plafon bersih."
                    type="info"
                  />
                )}
              </div>
              <Form.Item style={{ marginTop: 10 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  icon={<SaveIcon size={20} />}
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
