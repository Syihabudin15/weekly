// components/Layout/MainLayout.tsx
"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calculator,
  Users,
  UserCog,
  Package,
  FileText,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Layers2,
  BookMarkedIcon,
  FileBadge2,
} from "lucide-react";
import "@ant-design/v5-patch-for-react-19";
import { IPermission } from "./Interface";

export interface MenuItem {
  path: string;
  name: string;
  icon: any;
  requiredPermission?: string;
  children?: MenuItem[];
}

// Menu items
export const menuItems: MenuItem[] = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    path: "/simulasi",
    name: "Simulasi",
    icon: Calculator,
    requiredPermission: "/simulasi",
  },
  {
    path: "/monitoring",
    name: "Monitoring",
    icon: BookMarkedIcon,
    requiredPermission: "/monitoring",
  },
  {
    path: "/pengajuan",
    name: "Pengajuan",
    icon: FileBadge2,
    requiredPermission: "/pengajuan",
  },
  {
    path: "/debitur",
    name: "Data Debitur",
    icon: Users,
    requiredPermission: "/debitur",
  },
  {
    path: "/pengajuan",
    name: "Pengajuan Kredit",
    icon: FileText,
    requiredPermission: "/dapem",
    children: [
      { path: "/pengajuan/draft", name: "Draft", icon: null },
      { path: "/pengajuan/pending", name: "Pending", icon: null },
      { path: "/pengajuan/disetujui", name: "Disetujui", icon: null },
      { path: "/pengajuan/ditolak", name: "Ditolak", icon: null },
      { path: "/pengajuan/lunas", name: "Lunas", icon: null },
    ],
  },
  {
    path: "/tagihan",
    name: "Data Tagihan",
    icon: Calendar,
    requiredPermission: "/tagihan",
  },
  {
    path: "/jenis",
    name: "Jenis Kredit",
    icon: Layers2,
    requiredPermission: "/jenis",
  },
  {
    path: "/produk",
    name: "Produk Kredit",
    icon: Package,
    requiredPermission: "/produk",
  },
  {
    path: "/users",
    name: "Manajemen User",
    icon: UserCog,
    requiredPermission: "/users",
  },
  {
    path: "/roles",
    name: "Role & Permission",
    icon: Settings,
    requiredPermission: "/roles",
  },
  {
    path: "/settings",
    name: "Pengaturan Profile",
    icon: Settings,
  },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const hasPermission = (path: string): boolean => {
    if (!session?.user?.permissions) return false;

    const permissions: IPermission[] = JSON.parse(
      (session.user.permissions as string) || "[]"
    );

    return permissions.some(
      (perm) => path.startsWith(perm.path) && perm.access.includes("read")
    );
  };

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  return (
    <div className="min-h-screen bg-gray-50 text-sm">
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-blue-900 text-white transition-all duration-300 z-50
          ${sidebarOpen ? "w-64 lg:w-64" : "w-0 lg:w-16"}
          overflow-hidden
        `}
      >
        <div
          className={`flex items-center p-4 border-b border-blue-800 transition-all duration-300 ${
            sidebarOpen ? "justify-between" : "justify-center"
          }`}
        >
          <h1
            className={`text-xl font-bold ${
              sidebarOpen ? "opacity-100" : "opacity-0 hidden lg:block"
            }`}
          >
            Weekly Loan
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white cursor-pointer"
            title="Tutup Sidebar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="p-2 space-y-1 overflow-auto">
          {filteredMenuItems.map((item) => (
            <div key={item.path}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.path)}
                    // Kelas untuk menu utama (dengan anak)
                    className={`
                      w-full flex items-center p-3 rounded-lg transition-colors 
                      hover:bg-blue-800
                      ${sidebarOpen ? "justify-between" : "justify-center"}
                      ${pathname.startsWith(item.path) ? "bg-blue-800" : ""}
                    `}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      {/* Teks hanya ditampilkan saat sidebarOpen=true */}
                      <span className={`${sidebarOpen ? "inline" : "hidden"}`}>
                        {item.name}
                      </span>
                    </div>
                    {/* Icon Chevron hanya ditampilkan saat sidebarOpen=true */}
                    {sidebarOpen && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          expandedMenus.includes(item.path) ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>
                  {/* Sub-menu anak */}
                  {(expandedMenus.includes(item.path) ||
                    pathname.startsWith(item.path)) && (
                    <div
                      className={`${
                        sidebarOpen ? "ml-4 mt-2 space-y-1" : "hidden"
                      }`}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          href={child.path}
                          className={`block p-2 pl-8 rounded-lg hover:bg-blue-800 transition-colors ${
                            pathname === child.path ? "bg-blue-800" : ""
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.path}
                  // Kelas untuk menu tunggal
                  className={`
                    flex items-center p-3 rounded-lg hover:bg-blue-800 transition-colors 
                    ${pathname === item.path ? "bg-blue-800" : ""}
                    ${sidebarOpen ? "justify-start gap-3" : "justify-center"}
                  `}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <item.icon size={20} />
                  {/* Teks hanya ditampilkan saat sidebarOpen=true */}
                  <span className={`${sidebarOpen ? "inline" : "hidden"}`}>
                    {item.name}
                  </span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer/User Info & Logout */}
        <div
          className={`
            absolute bottom-0 border-t border-blue-800 p-3 
            ${
              sidebarOpen
                ? "w-64 flex justify-between items-center"
                : "w-16 hidden lg:flex justify-center flex-col items-center"
            }
          `}
        >
          {sidebarOpen ? (
            <>
              <div>
                <p className="text-sm font-semibold">{session?.user?.name}</p>
                <p className="text-xs text-blue-300">
                  {session?.user?.position}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg p-2 hover:bg-red-600 transition-colors text-xs cursor-pointer"
                title="Logout"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="rounded-full p-2 hover:bg-red-600 transition-colors text-white"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 min-h-screen ${
          // Mobile: w-0 saat terbuka (ditutupi overlay)
          // Desktop (lg): w-64 saat terbuka penuh, w-16 saat tertutup
          sidebarOpen ? "lg:ml-64 ml-0" : "lg:ml-16 ml-0"
        }`}
      >
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-700"
              title={sidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4">{children}</main>
      </div>

      {/* Overlay for mobile (tetap sama) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
