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
  can(path: string, action: "read" | "write" | "update" | "delete"): boolean {
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

export function usePermission() {
  const { data: session } = useSession();

  const checker = useMemo(() => {
    if (!session?.user?.permissions) {
      return new PermissionChecker([]);
    }
    return new PermissionChecker(session.user.permissions as string);
  }, [session?.user?.permissions]);

  return {
    can: (path: string, action: "read" | "write" | "update" | "delete") =>
      checker.can(path, action),
    canRead: (path: string) => checker.canRead(path),
    canWrite: (path: string) => checker.canWrite(path),
    canUpdate: (path: string) => checker.canUpdate(path),
    canDelete: (path: string) => checker.canDelete(path),
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
  const totalMargin = principal * (annualRate / 100) * (tenorWeeks / 52);
  const totalRepayment = principal + totalMargin;
  const weeklyPayment = totalRepayment / tenorWeeks; // Total Pengembalian dibagi Tenor (Minggu)
  return weeklyPayment;
};
export const convertWeeklyToMonthlyPayment = (
  weeklyPayment: number
): number => {
  // return weeklyPayment * (52 / 12);
  return weeklyPayment * 4;
};
