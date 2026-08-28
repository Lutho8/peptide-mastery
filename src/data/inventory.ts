import type { InventoryItem, InventoryAlert } from "@/types";

export type { InventoryItem, InventoryAlert };

export interface DoseUsage {
  id: string;
  itemId: string;
  peptideId: string;
  date: number;
  amountMcg: number;
}

const STORAGE_KEY = "peptide_inventory";

export const defaultInventory: InventoryItem[] = [];

export function getInventory(): InventoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveInventory(items: InventoryItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function calculateRemainingDoses(
  item: InventoryItem,
  usagesOrDoseMg: DoseUsage[] | number = 5,
  doseMcg?: number
): number {
  if (typeof usagesOrDoseMg === "number") {
    const doseMg = usagesOrDoseMg;
    return item.remainingMg > 0 ? Math.floor(item.remainingMg / doseMg) : 0;
  }
  const usages = usagesOrDoseMg;
  const dose = (doseMcg ?? 500) / 1000;
  const usedMg = usages
    .filter((u) => u.itemId === item.id)
    .reduce((sum, u) => sum + u.amountMcg / 1000, 0);
  const remaining = Math.max(0, item.remainingMg - usedMg);
  return dose > 0 ? Math.floor(remaining / dose) : 0;
}

function toMs(d: number | string | undefined): number {
  if (d == null) return 0;
  return typeof d === "number" ? d : new Date(d).getTime();
}

export interface ExpirationStatus {
  status: "ok" | "expiring" | "expired" | "valid" | "expiring-soon";
  daysRemaining: number;
}

export function getExpirationStatus(expirationDate: number | string): ExpirationStatus {
  const days = Math.floor((toMs(expirationDate) - Date.now()) / (1000 * 60 * 60 * 24));
  const status: ExpirationStatus["status"] = days <= 0 ? "expired" : days <= 30 ? "expiring-soon" : "valid";
  return { status, daysRemaining: days };
}

export interface ReconstitutionStatus {
  status: "fresh" | "aging" | "expired" | "unreconstituted" | "not-reconstituted" | "expiring-soon";
  daysRemaining: number;
}

export function getReconstitutionStatus(reconstitutionDate?: number | string): ReconstitutionStatus {
  if (!reconstitutionDate) return { status: "not-reconstituted", daysRemaining: 0 };
  // A reconstitution date alone cannot establish a product's shelf life.
  // Expiry is handled only from the user's separately recorded expiry date.
  return { status: "fresh", daysRemaining: 0 };
}

export function getLowStockAlerts(items: InventoryItem[], _usages?: DoseUsage[]): InventoryAlert[] {
  return checkInventoryAlerts(items);
}

export function checkInventoryAlerts(items: InventoryItem[]): InventoryAlert[] {
  const now = Date.now();
  const alerts: InventoryAlert[] = [];

  for (const item of items) {
    const remainingMg = item.remainingMg ?? 0;
    const remainingRatio = item.vialSizeMg > 0 ? remainingMg / item.vialSizeMg : 0;
    if (remainingMg > 0 && remainingRatio <= 0.2) {
      const msg = `${item.peptideName} has ${remainingMg.toFixed(1)}mg remaining`;
      alerts.push({
        id: `low-${item.id}`,
        type: "low_stock",
        itemId: item.id,
        peptideName: item.peptideName,
        message: msg,
        severity: "warning",
        item,
        alert: msg,
      });
    }

    const expiryMs = toMs(item.expirationDate);
    if (!Number.isFinite(expiryMs) || expiryMs <= 0) continue;
    const daysUntilExpiry = (expiryMs - now) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry <= 0) {
      const msg = `${item.peptideName} vial has expired`;
      alerts.push({
        id: `expired-${item.id}`,
        type: "expired",
        itemId: item.id,
        peptideName: item.peptideName,
        message: msg,
        severity: "danger",
        item,
        alert: msg,
      });
    } else if (daysUntilExpiry <= 30) {
      const msg = `${item.peptideName} expires in ${Math.ceil(daysUntilExpiry)} days`;
      alerts.push({
        id: `expiring-${item.id}`,
        type: "expiring_soon",
        itemId: item.id,
        peptideName: item.peptideName,
        message: msg,
        severity: "warning",
        item,
        alert: msg,
      });
    }
  }

  return alerts;
}
