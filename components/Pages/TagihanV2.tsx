import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  FileText,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
} from "lucide-react";

// --- DEFINISI TIPE DATA TS ---

type InvoiceStatus = "pending" | "paid" | "overdue" | "draft";
type SortKey =
  | "invoiceNumber"
  | "clientName"
  | "issueDate"
  | "dueDate"
  | "amount";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  amount: number;
}

interface NotificationState {
  type: "success" | "error";
  message: string;
}

interface FilterState {
  status: InvoiceStatus | "all";
  searchTerm: string;
}

interface ApiResponseData {
  invoices: Invoice[];
  total: number;
}

interface ApiResponse {
  status: number;
  msg: string;
  data: ApiResponseData;
}

// --- DEFINISI KONSTANTA DAN MOCK DATA ---

const statusColors: Record<
  InvoiceStatus,
  { color: string; icon: React.FC<any> }
> = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  overdue: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
  draft: { color: "bg-gray-100 text-gray-800", icon: FileText },
};

const statusLabels: Record<InvoiceStatus | "all", string> = {
  all: "Semua Status",
  pending: "Menunggu Pembayaran",
  paid: "Sudah Dibayar",
  overdue: "Jatuh Tempo",
  draft: "Draf",
};

// Data Mock
const createMockInvoices = (): Invoice[] => {
  const invoices: Invoice[] = [];
  const clientNames = [
    "PT Sinar Jaya",
    "CV Maju Mundur",
    "Klinik Sehat",
    "Yayasan Pendidikan",
    "Toko Roti Enak",
  ];
  const today = new Date();

  for (let i = 1; i <= 50; i++) {
    const statusIndex = i % 4;
    const status: InvoiceStatus = ["paid", "pending", "overdue", "draft"][
      statusIndex
    ] as InvoiceStatus;

    const issueDate = new Date(today);
    issueDate.setDate(today.getDate() - (50 - i)); // Tanggal terbit berurutan

    const dueDate = new Date(issueDate);
    dueDate.setDate(issueDate.getDate() + 30); // Jatuh tempo 30 hari setelah terbit

    invoices.push({
      id: `INV-${String(1000 + i).padStart(4, "0")}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(i).padStart(
        4,
        "0"
      )}`,
      clientName: clientNames[i % clientNames.length] + ` (${i})`,
      issueDate: issueDate.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      status: status,
      amount: Math.floor(Math.random() * 5000000 + 1000000),
    });
  }
  return invoices;
};

let mockInvoices: Invoice[] = createMockInvoices();

// --- MOCK API FUNCTIONS (Simulasi Server-side) ---

const mockApi = {
  /**
   * Mengambil tagihan dengan dukungan server-side filter, search, dan pagination.
   */
  fetchInvoices: async (
    page: number,
    pageSize: number,
    filters: FilterState,
    sortKey: SortKey | null,
    sortDirection: "asc" | "desc"
  ): Promise<ApiResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const lowerCaseSearch = filters.searchTerm.toLowerCase();

    // 1. Filter dan Search (Server-side)
    const filteredInvoices = mockInvoices.filter((invoice) => {
      const matchesStatus =
        filters.status === "all" || invoice.status === filters.status;
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(lowerCaseSearch) ||
        invoice.clientName.toLowerCase().includes(lowerCaseSearch);
      return matchesStatus && matchesSearch;
    });

    // 2. Sorting (Server-side)
    if (sortKey) {
      filteredInvoices.sort((a, b) => {
        let valA: string | number = a[sortKey];
        let valB: string | number = b[sortKey];

        if (typeof valA === "string" && typeof valB === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    const total = filteredInvoices.length;

    // 3. Pagination (Server-side)
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

    return {
      status: 200,
      msg: "OK",
      data: {
        invoices: paginatedInvoices,
        total: total,
      },
    };
  },

  // Mock fungsi untuk aksi lain (misalnya mengirim tagihan)
  sendInvoice: async (id: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Simulasi perubahan status jika tagihan berhasil dikirim
    mockInvoices = mockInvoices.map((inv) =>
      inv.id === id && inv.status === "draft"
        ? { ...inv, status: "pending" }
        : inv
    );
    return true;
  },
};

// --- HELPER COMPONENTS ---

// 1. Badge Status
const StatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
  const { color, icon: Icon } = statusColors[status];
  const label = statusLabels[status];
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${color} transition duration-150`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </span>
  );
};

// 2. Notifikasi
const Notification: React.FC<{
  type: NotificationState["type"];
  message: string;
  onClose: () => void;
}> = ({ type, message, onClose }) => {
  const bgColor =
    type === "success"
      ? "bg-green-100 border-green-400 text-green-700"
      : "bg-red-100 border-red-400 text-red-700";
  return (
    <div
      className={`p-4 border-l-4 ${bgColor} rounded-lg shadow-lg mb-4 flex justify-between items-center transition-opacity duration-300`}
    >
      <p className="font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-lg font-bold ml-4 p-1 rounded-full hover:bg-opacity-50 hover:bg-current transition"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

// 3. Header Kolom yang Dapat Diurutkan
const SortableHeader: React.FC<{
  title: string;
  sortKey: SortKey;
  currentSort: { key: SortKey | null; direction: "asc" | "desc" };
  onClick: (key: SortKey) => void;
}> = ({ title, sortKey, currentSort, onClick }) => {
  const isCurrent = currentSort.key === sortKey;
  const Icon = isCurrent
    ? currentSort.direction === "asc"
      ? ArrowUp
      : ArrowDown
    : null;

  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150"
      onClick={() => onClick(sortKey)}
    >
      <div className="flex items-center">
        {title}
        {Icon && <Icon className="w-3 h-3 ml-2 text-indigo-600" />}
      </div>
    </th>
  );
};

// 4. Pagination
interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 p-4 bg-white rounded-xl shadow-lg border">
      <div className="text-sm text-gray-700 mb-3 sm:mb-0">
        Menampilkan <span className="font-medium">{startItem}</span> -{" "}
        <span className="font-medium">{endItem}</span> dari{" "}
        <span className="font-medium">{totalItems}</span> total tagihan
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-sm font-semibold text-gray-700 px-3 py-1">
          Halaman {currentPage} dari {totalPages || 1}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Halaman Berikutnya"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// --- KOMPONEN UTAMA (App) ---

const App: React.FC = () => {
  // State Data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );

  // State Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
    "all"
  );
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    status: "all",
    searchTerm: "",
  });

  // State Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [currentSort, setCurrentSort] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc";
  }>({ key: "dueDate", direction: "desc" });

  // Fungsi utilitas
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const showNotification = useCallback(
    (type: NotificationState["type"], message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 3000);
    },
    []
  );

  // Handler utama untuk memuat data
  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    const pageToFetch = Math.max(1, currentPage);

    try {
      const result = await mockApi.fetchInvoices(
        pageToFetch,
        pageSize,
        currentFilters,
        currentSort.key,
        currentSort.direction
      );

      if (result.status === 200) {
        setInvoices(result.data.invoices);
        setTotalInvoices(result.data.total);
        const maxPages = Math.ceil(result.data.total / pageSize);
        if (pageToFetch > maxPages && maxPages > 0) {
          setCurrentPage(maxPages);
        }
      } else {
        showNotification("error", "Gagal memuat data tagihan: " + result.msg);
      }
    } catch (error) {
      console.error("Gagal memuat tagihan:", error);
      showNotification("error", "Gagal memuat data tagihan. Cek konsol.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, currentFilters, currentSort, showNotification]);

  // Efek untuk memuat data saat parameter berubah
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Handler aksi
  const handleApplyFilter = (e?: React.FormEvent) => {
    e?.preventDefault();
    setCurrentPage(1); // Reset ke halaman 1 saat filter/search baru
    setCurrentFilters({ status: statusFilter, searchTerm: searchTerm }); // Trigger fetch
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSort = (key: SortKey) => {
    setCurrentPage(1); // Reset ke halaman 1 saat sorting
    setCurrentSort((prev) => ({
      key: key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const handleSend = async (id: string, clientName: string) => {
    if (
      !window.confirm(
        `Yakin ingin mengirim tagihan kepada ${clientName}? Status akan berubah menjadi Menunggu Pembayaran.`
      )
    )
      return;

    setIsLoading(true);
    try {
      await mockApi.sendInvoice(id);
      showNotification(
        "success",
        `Tagihan untuk ${clientName} berhasil dikirim.`
      );
      loadInvoices(); // Muat ulang data
    } catch (error) {
      showNotification("error", `Gagal mengirim tagihan untuk ${clientName}.`);
      setIsLoading(false);
    }
  };

  // Aksi-aksi Placeholder (Implementasi modal dihilangkan sesuai permintaan, diganti dengan notif)
  const handleEdit = (invoice: Invoice) => {
    showNotification(
      "success",
      `Membuka modal Edit Tagihan #${invoice.invoiceNumber}.`
    );
    // Logika buka modal edit di sini
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(`Anda yakin ingin menghapus tagihan ini?`)) return;
    showNotification("error", `Tagihan #${id} berhasil dihapus (simulasi).`);
    // Logika hapus di sini
    loadInvoices(); // Muat ulang data
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 flex items-center">
          <FileText className="w-8 h-8 mr-3 text-indigo-600" />
          Manajemen Tagihan
        </h1>

        {/* Notifikasi */}
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Header Kontrol (Filter, Search, Tambah) */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Search & Filter */}
            <form
              onSubmit={handleApplyFilter}
              className="flex flex-col sm:flex-row w-full md:w-2/3 space-y-3 sm:space-y-0 sm:space-x-3"
            >
              {/* Filter Status */}
              <div className="relative w-full sm:w-1/3">
                <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as InvoiceStatus | "all")
                  }
                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition appearance-none"
                  disabled={isLoading}
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Input Pencarian */}
              <div className="relative w-full sm:w-2/3">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari No. Tagihan atau Klien..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
                  disabled={isLoading}
                />
              </div>

              {/* Tombol Terapkan */}
              <button
                type="submit"
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 flex items-center justify-center sm:w-auto"
                disabled={isLoading}
              >
                Terapkan
              </button>
            </form>

            {/* Tombol Tambah */}
            <button
              onClick={() =>
                showNotification("success", "Membuka modal Buat Tagihan Baru.")
              }
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 flex items-center w-full md:w-auto justify-center"
              disabled={isLoading}
            >
              <Plus className="w-5 h-5 mr-2" />
              Buat Tagihan Baru
            </button>
          </div>
        </div>

        {/* Tabel Daftar Tagihan */}
        <div className="relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-20 rounded-xl">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-lg text-indigo-600">
                Memuat data tagihan...
              </span>
            </div>
          )}

          <div className="bg-white shadow-xl rounded-xl overflow-x-auto border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <SortableHeader
                    title="No. Tagihan"
                    sortKey="invoiceNumber"
                    currentSort={currentSort}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    title="Klien"
                    sortKey="clientName"
                    currentSort={currentSort}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    title="Terbit"
                    sortKey="issueDate"
                    currentSort={currentSort}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    title="Jatuh Tempo"
                    sortKey="dueDate"
                    currentSort={currentSort}
                    onClick={handleSort}
                  />

                  <SortableHeader
                    title="Jumlah"
                    sortKey="amount"
                    currentSort={currentSort}
                    onClick={handleSort}
                  />
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.length === 0 && !isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-gray-500 text-lg"
                    >
                      Tidak ada tagihan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-indigo-50/20 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {invoice.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.issueDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                        {invoice.dueDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {invoice.status === "draft" && (
                          <button
                            onClick={() =>
                              handleSend(invoice.id, invoice.clientName)
                            }
                            title="Kirim Tagihan (Ubah ke Pending)"
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition"
                            disabled={isLoading}
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            showNotification(
                              "success",
                              `Mengunduh ${invoice.invoiceNumber}...`
                            )
                          }
                          title="Unduh PDF"
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition"
                          disabled={isLoading}
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(invoice)}
                          title="Edit Tagihan"
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 transition"
                          disabled={isLoading}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          title="Hapus Tagihan"
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kontrol Pagination */}
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalInvoices}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

// Placeholder untuk ikon ChevronDown (karena belum diimpor dari lucide-react)
const ChevronDown: React.FC<any> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-chevron-down"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// Ekspor komponen utama
export default App;
