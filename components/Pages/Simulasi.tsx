// app/simulasi/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Form,
  InputNumber,
  Button,
  Card,
  Col,
  Row,
  Typography,
  message,
  Space,
  Alert,
  Select,
  Input,
} from "antd";
import {
  Calculator,
  DollarSign,
  Clock,
  Percent,
  Zap,
  TrendingUp,
  Layers,
  Layers2,
  Package,
  User,
  CircleDollarSign,
  Scale,
} from "lucide-react";
import { Jenis, Produk } from "@prisma/client";
import {
  calculateWeeklyPayment,
  formatterPercent,
  formatterRupiah,
} from "../Util";

const { Title, Text } = Typography;

interface CalculationInputs {
  plafon: number;
  tenorWeeks: number; // TENOR DALAM MINGGU
  annualMarginRate: number;
  produkId: string;
  jenisId: string;
  salary: number;
  pelunasan: number;
}

interface CalculationResults {
  totalBiayaAwal: number;
  plafonDiterima: number;
  calculatedDsr: number;
  maxDsr: number;
  dsrValidationPassed: boolean;
  byAdmin: number;
  byTabungan: number;
  byTatalaksana: number;
  byMaterai: number;
  pelunasan: number;
}

const convertWeeklyToMonthlyPayment = (weeklyPayment: number): number => {
  // return weeklyPayment * (52 / 12);
  return weeklyPayment * 4;
};

// --- Komponen Simulasi ---

export default function CreditSimulationPage() {
  const [form] = Form.useForm<CalculationInputs>();
  const [weeklyInstallment, setWeeklyInstallment] = useState<number | null>(
    null
  ); // Angsuran Mingguan
  const [results, setResults] = useState<CalculationResults | null>(null);
  // const [schedule, setSchedule] = useState<AmortizationSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [producs, setProducs] = useState<Produk[]>([]);
  const [jeniss, setJeniss] = useState<Jenis[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Produk | null>(null);
  const [selectedJenis, setSelectedJenis] = useState<Jenis | null>(null);

  useEffect(() => {
    (async () => {
      const reqProduct = await fetch("/api/produk?page=1&pageSize=100");
      const reqJenis = await fetch("/api/jenis?page=1&pageSize=100");
      const { data: dataProduk } = await reqProduct.json();
      const { data: dataJenis } = await reqJenis.json();
      setProducs(dataProduk);
      setJeniss(dataJenis);
    })();
  }, []);

  const handleProductChange = (productId: string) => {
    const selectedProduct = producs.find((p) => p.id === productId);
    if (selectedProduct) {
      form.setFieldValue("annualMarginRate", selectedProduct.margin);
    }
    setSelectedProduct(selectedProduct || null);
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

  const onFinish = (values: CalculationInputs) => {
    setLoading(true);
    setWeeklyInstallment(null);
    setResults(null);

    const {
      plafon,
      tenorWeeks,
      annualMarginRate,
      produkId,
      jenisId,
      salary,
      pelunasan,
    } = values;

    if (
      plafon <= 0 ||
      tenorWeeks <= 0 ||
      annualMarginRate < 0 ||
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
      const weeklyPayment = calculateWeeklyPayment(
        plafon,
        annualMarginRate,
        tenorWeeks
      );
      setWeeklyInstallment(weeklyPayment);

      // 2. Hitung Biaya-Biaya di Awal (Sama seperti skema bulanan, berdasarkan Plafon)
      const byAdmin = plafon * (selectedProduct.by_admin / 100);
      const byTabungan = selectedProduct.by_tabungan;
      const byTatalaksana = plafon * (selectedProduct.by_tatalaksana / 100);
      const byMaterai = selectedProduct.by_materai;

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

  // Format nilai mata uang (sama, karena hanya memformat angka)
  const formatter = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return "Rp 0";
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
      console.error("Formatter received a non-numeric value:", value);
      return "Rp 0 (Invalid)";
    }
    return `Rp ${numValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Simulasi Kredit Mingguan 📅
        </h1>
      </div>

      <Row gutter={[24, 24]}>
        {/* Kolom Kiri: Input Form */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <Calculator size={20} /> Parameter Simulasi
              </Space>
            }
            className="shadow-lg"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              // Tenor default diubah ke 52 (1 tahun)
              initialValues={{
                plafond: 0,
                tenorWeeks: 0,
                annualMarginRate: 0,
                pelunasan: 0,
              }}
            >
              <Row gutter={[5, 5]}>
                <Col span={12}>
                  {/* Plafond (Sama) */}
                  <Form.Item
                    name="fullname"
                    label={
                      <Space>
                        <User size={16} /> Nama Lengkap
                      </Space>
                    }
                    rules={[{ required: false }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  {/* Tenor (Minggu) */}
                  <Form.Item
                    name="salary"
                    label={
                      <Space>
                        <CircleDollarSign size={16} /> Pendapatan
                      </Space>
                    } // LABEL BERUBAH
                    rules={[
                      {
                        required: true,
                        message: "Masukkan pendapatan bulanan!",
                      },
                    ]}
                  >
                    <InputNumber<number>
                      min={10000}
                      step={10000}
                      formatter={formatter}
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
                      options={producs.map((p) => ({
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
                      min={100000}
                      max={selectedProduct?.max_plafon || 2000000}
                      step={10000}
                      formatter={formatter}
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
                    name="tenorWeeks"
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
                hidden={selectedJenis && selectedJenis.pelunasan ? false : true}
              >
                <InputNumber<number>
                  min={0}
                  step={10000}
                  formatter={formatter}
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

              {/* Suku Bunga/Margin (Sama) */}
              <Form.Item
                name="annualMarginRate"
                hidden
                label={
                  <Space>
                    <Percent size={16} /> Margin (% Per Tahun)
                  </Space>
                }
                rules={[
                  { required: true, message: "Masukkan persentase margin!" },
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
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  icon={<Zap size={20} />}
                >
                  {loading ? "Menghitung..." : "Hitung Simulasi"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Kolom Kanan: Hasil Simulasi */}
        <Col xs={24} lg={14}>
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
                  <div className="bg-blue-50 p-4 rounded-lg text-center border-l-4 border-blue-500">
                    <Text type="secondary" className="block text-sm">
                      Plafon Pinjaman
                    </Text>{" "}
                    <Title level={4} className="mb-0 mt-1 text-blue-700">
                      {weeklyInstallment && form.getFieldValue("tenorWeeks")
                        ? formatter(
                            weeklyInstallment * form.getFieldValue("tenorWeeks")
                          )
                        : "Rp 0"}
                    </Title>
                  </div>
                </Col>
                {/* Total Margin */}
                <Col xs={24} lg={8}>
                  <div className="bg-green-50 p-4 rounded-lg text-center border-l-4 border-green-500">
                    <Text type="secondary" className="block text-sm">
                      Terima Bersih
                    </Text>
                    <Title level={4} className="mb-0 mt-1 text-green-700">
                      {results ? formatter(results.plafonDiterima) : 0}
                    </Title>
                  </div>
                </Col>
                {/* Total Pembayaran */}
                <Col xs={24} lg={8}>
                  <div className="bg-red-50 p-4 rounded-lg text-center border-l-4 border-red-500">
                    <Text type="secondary" className="block text-sm">
                      Angsuran Mingguan
                    </Text>
                    <Title level={4} className="mb-0 mt-1 text-red-700">
                      {weeklyInstallment
                        ? formatter(weeklyInstallment)
                        : "Rp 0"}
                    </Title>
                  </div>
                </Col>
              </Row>

              {/* DSR Validation Alert */}
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

              {/* Rincian Biaya Awal dan Plafon Diterima */}
              <Title level={4} className="mt-6 mb-2">
                <Space>
                  <Layers size={18} /> Rincian Pencairan
                </Space>
              </Title>
              {results ? (
                <div className="space-y-3 p-4 bg-gray-50 border rounded-lg">
                  <div className="flex justify-between font-semibold border-b pb-1">
                    <Text>Plafond Pinjaman:</Text>
                    <Text>{formatter(form.getFieldValue("plafon"))}</Text>
                  </div>

                  <div className="flex justify-between text-red-600">
                    <Text>Biaya Admin:</Text>
                    <Text>- {formatter(results.byAdmin)}</Text>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <Text>Biaya Tatalaksana:</Text>
                    <Text>- {formatter(results.byTatalaksana)}</Text>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <Text>Biaya Tabungan:</Text>
                    <Text>- {formatter(results.byTabungan)}</Text>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <Text>Biaya Materai:</Text>
                    <Text>- {formatter(results.byMaterai)}</Text>
                  </div>
                  {selectedJenis && selectedJenis.pelunasan && (
                    <div className="flex justify-between text-red-600">
                      <Text>Nominal Pelunasan:</Text>
                      <Text>- {formatter(results.pelunasan)}</Text>
                    </div>
                  )}
                  <div className="flex justify-between text-red-600 font-bold">
                    <Text type="danger">Total Biaya:</Text>
                    <Text type="danger">
                      - {formatter(results.totalBiayaAwal)}
                    </Text>
                  </div>

                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-dashed">
                    <Text className="text-blue-700">
                      Plafond Bersih Diterima:
                    </Text>
                    <Text className="text-blue-700">
                      {formatter(results.plafonDiterima)}
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
          </Card>
        </Col>
      </Row>
    </div>
  );
}
