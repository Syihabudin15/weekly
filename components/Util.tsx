export class PermissionChecker {
  private permissions: IPermission[];

  constructor(permissions: IPermission[] | string) {
    if (typeof permissions === "string") {
      this.permissions = JSON.parse(permissions);
    } else {
      this.permissions = permissions;
    }
  }

  /**
   * Check if user has specific access to a path
   */
  can(
    path: string,
    action: "read" | "write" | "update" | "delete" | "proses"
  ): boolean {
    return this.permissions.some((perm) => {
      const pathMatch =
        path.startsWith(perm.path) || perm.path.startsWith(path);
      return pathMatch && perm.access.includes(action);
    });
  }

  /**
   * Check if user can read
   */
  canRead(path: string): boolean {
    return this.can(path, "read");
  }

  /**
   * Check if user can write/create
   */
  canWrite(path: string): boolean {
    return this.can(path, "write");
  }

  /**
   * Check if user can update
   */
  canUpdate(path: string): boolean {
    return this.can(path, "update");
  }

  /**
   * Check if user can delete
   */
  canDelete(path: string): boolean {
    return this.can(path, "delete");
  }
  canProses(path: string): boolean {
    return this.can(path, "proses");
  }

  /**
   * Get all accessible paths for user
   */
  getAccessiblePaths(): string[] {
    return this.permissions.map((perm) => perm.path);
  }

  /**
   * Check if user has any access to a path
   */
  hasAccess(path: string): boolean {
    return this.permissions.some(
      (perm) => path.startsWith(perm.path) || perm.path.startsWith(path)
    );
  }

  /**
   * Get available actions for a specific path
   */
  getActions(path: string): string[] {
    const permission = this.permissions.find(
      (perm) => path.startsWith(perm.path) || perm.path.startsWith(path)
    );
    return permission ? permission.access : [];
  }
}

// hooks/usePermission.ts
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { IPermission } from "./Interface";
import moment from "moment";

export function usePermission() {
  const { data: session } = useSession();

  const checker = useMemo(() => {
    if (!session?.user?.permissions) {
      return new PermissionChecker([]);
    }
    return new PermissionChecker(session.user.permissions as string);
  }, [session?.user?.permissions]);

  return {
    can: (
      path: string,
      action: "read" | "write" | "update" | "delete" | "proses"
    ) => checker.can(path, action),
    canRead: (path: string) => checker.canRead(path),
    canWrite: (path: string) => checker.canWrite(path),
    canUpdate: (path: string) => checker.canUpdate(path),
    canDelete: (path: string) => checker.canDelete(path),
    canProses: (path: string) => checker.canDelete(path),
    hasAccess: (path: string) => checker.hasAccess(path),
    getActions: (path: string) => checker.getActions(path),
    getAccessiblePaths: () => checker.getAccessiblePaths(),
  };
}

export const formatterRupiah = (value: number | string | undefined) => {
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

export const formatterPercent = (value: number | string | undefined) =>
  value ? `${value} %` : "";

export const calculateWeeklyPayment = (
  principal: number,
  annualRate: number,
  tenorWeeks: number
): number => {
  // const totalMargin = principal * (annualRate / 100) * (tenorWeeks / 12 / 4);
  // const totalRepayment = principal + totalMargin;
  // const weeklyPayment = totalRepayment / tenorWeeks;
  const totalMargin = principal * (annualRate / 100);
  const pokok = principal / tenorWeeks;
  const weeklyPayment = pokok + totalMargin / tenorWeeks;
  const roundedPayment = Math.ceil(weeklyPayment / 1000) * 1000;
  return roundedPayment;
};

export const convertWeeklyToMonthlyPayment = (
  weeklyPayment: number
): number => {
  return weeklyPayment * 4;
};

export const STATUS_MAP = {
  DRAFT: { text: "DRAFT", color: "blue" },
  PENDING: { text: "PENDING", color: "gold" },
  SETUJU: { text: "DISETUJUI", color: "green" },
  TOLAK: { text: "DITOLAK", color: "red" },
  BATAL: { text: "BATAL", color: "purple" },
  LUNAS: { text: "LUNAS", color: "magenta" },
};
export const STATUSKAWIN_MAP = {
  K: { text: "KAWIN", color: "blue" },
  BK: { text: "BELUM KAWIN", color: "gold" },
  J: { text: "JANDA", color: "green" },
  D: { text: "DUDA", color: "magenta" },
};

export function getUsiaMasuk(birthdate: string | Date, nowdate: string | Date) {
  const now = moment(nowdate);
  const years = now.diff(moment(birthdate), "years");
  const months = now.diff(moment(birthdate).add(years, "years"), "months");
  const days = now.diff(
    moment(birthdate).add(years, "years").add(months, "months"),
    "days"
  );

  return `${years} tahun, ${months} bulan, ${days} hari`;
}
