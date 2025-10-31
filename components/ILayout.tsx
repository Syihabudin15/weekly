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
} from "lucide-react";

interface Permission {
  path: string;
  name: string;
  access: string[];
}

interface MenuItem {
  path: string;
  name: string;
  icon: any;
  requiredPermission?: string;
  children?: MenuItem[];
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Menu items
  const menuItems: MenuItem[] = [
    {
      path: "/dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/simulasi",
      name: "Simulasi",
      icon: Calculator,
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
      path: "/angsuran",
      name: "Jadwal Angsuran",
      icon: Calendar,
      requiredPermission: "/jadwal-angsuran",
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
  ];

  const hasPermission = (path: string): boolean => {
    if (!session?.user?.permissions) return false;

    const permissions: Permission[] = JSON.parse(
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
        redirect: true, // NextAuth will handle redirect
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: force redirect
      window.location.href = "/";
    }
  };

  // Filter menu berdasarkan permission
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  return (
    <div className="min-h-screen bg-gray-50 text-sm">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-blue-900 text-white transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden z-50`}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-800">
          <h1 className="text-xl font-bold">Weekly Loan</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {filteredMenuItems.map((item) => (
            <div key={item.path}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.path)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span>{item.name}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        expandedMenus.includes(item.path) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedMenus.includes(item.path) && (
                    <div className="ml-4 mt-2 space-y-1">
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
                  className={`flex items-center gap-3 p-2 text-sm rounded-lg hover:bg-blue-800 transition-colors ${
                    pathname === item.path ? "bg-blue-800" : ""
                  }`}
                >
                  <item.icon size={16} />
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="absolute bottom-0 w-64 p-3 border-t border-blue-800 flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold">{session?.user?.name}</p>
              <p className="text-xs text-blue-300">{session?.user?.position}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg p-2 hover:bg-red-600 transition-colors text-xs cursor-pointer"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-700"
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
        <main className="p-2">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
