import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { InventoryItem, InventoryAlert } from "@/types";
import {
  getInventory,
  saveInventory,
  checkInventoryAlerts,
} from "@/data/inventory";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Map a public.inventory_items row to the in-app InventoryItem shape.
 */
function rowToItem(row: {
  id: string;
  peptide_id: string;
  peptide_name: string;
  vial_total_mg: number;
  bac_water_ml: number | null;
  reconstituted_at: string | null;
  expires_at: string | null;
  remaining_mg: number;
  lot_number: string | null;
  vendor: string | null;
  coa_url: string | null;
  status?: string;
  notes?: string | null;
}): InventoryItem {
  const concentrationMgMl = row.bac_water_ml && row.bac_water_ml > 0
    ? row.vial_total_mg / row.bac_water_ml
    : undefined;
  return {
    id: row.id,
    peptideId: row.peptide_id,
    peptideName: row.peptide_name,
    vialSizeMg: row.vial_total_mg,
    remainingMg: row.remaining_mg,
    concentrationMgMl,
    volumeMl: row.bac_water_ml ?? undefined,
    openedDate: row.reconstituted_at ? new Date(row.reconstituted_at).getTime() : undefined,
    reconstitutionDate: row.reconstituted_at ?? undefined,
    reconstitutionVolumeMl: row.bac_water_ml ?? undefined,
    expirationDate: row.expires_at ? new Date(row.expires_at).getTime() : "",
    batchNumber: row.lot_number ?? undefined,
    supplier: row.vendor ?? undefined,
  };
}

function itemToRow(item: InventoryItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    peptide_id: item.peptideId,
    peptide_name: item.peptideName,
    vial_total_mg: item.vialSizeMg,
    bac_water_ml: item.reconstitutionVolumeMl ?? item.volumeMl ?? null,
    reconstituted_at: item.reconstitutionDate
      ? new Date(item.reconstitutionDate).toISOString()
      : item.openedDate
        ? new Date(item.openedDate).toISOString()
        : null,
    remaining_mg: item.remainingMg ?? item.vialSizeMg,
    lot_number: item.batchNumber ?? null,
    vendor: item.supplier ?? null,
    coa_url: null,
    status: "active",
  };
}

/**
 * Hook: useInventory
 *
 * Cloud-first when the user is signed in (Supabase `inventory_items`), with
 * localStorage fallback for guest users. Transparently migrates local items
 * to the cloud on first authenticated load if the cloud table is empty.
 */
export function useInventory(): {
  items: InventoryItem[];
  alerts: InventoryAlert[];
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string) => void;
  updateItem: (item: InventoryItem) => void;
  totalPeptides: number;
  totalVials: number;
  syncedToCloud: boolean;
} {
  const { user } = useAuth();
  const userId = user?.id;
  const [items, setItems] = useState<InventoryItem[]>(getInventory);
  const [syncedToCloud, setSyncedToCloud] = useState(false);
  const migratedRef = useRef(false);

  // Persist to localStorage as a cache
  useEffect(() => {
    saveInventory(items);
  }, [items]);

  // Cloud sync: load + migrate
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setSyncedToCloud(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (cancelled || error) return;

      if (data && data.length > 0) {
        setItems(data.map(rowToItem));
        setSyncedToCloud(true);
      } else if (!migratedRef.current) {
        migratedRef.current = true;
        const local = getInventory();
        if (local.length > 0) {
          const rows = local.map((it) => itemToRow(it, userId));
          const { error: upErr } = await supabase
            .from("inventory_items")
            .upsert(rows, { onConflict: "id" });
          if (!upErr) setSyncedToCloud(true);
        } else {
          setSyncedToCloud(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`inventory-items:${userId}:${crypto.randomUUID()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'tracker',
        table: 'inventory_items',
        filter: `user_id=eq.${userId}`,
      }, async () => {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        if (!error && data) {
          setItems(data.map(rowToItem));
          setSyncedToCloud(true);
        }
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn(`[Inventory] Realtime ${status.toLowerCase()}`);
      });
    return () => { void supabase.removeChannel(channel).catch(() => undefined); };
  }, [userId]);

  const alerts = useMemo(() => checkInventoryAlerts(items), [items]);

  const addItem = useCallback((item: InventoryItem) => {
    setItems((prev) => [...prev, item]);
    if (userId) {
      supabase.from("inventory_items").insert(itemToRow(item, userId)).then(({ error }) => {
        if (error) console.error("[inventory] insert failed", error);
      });
    }
  }, [userId]);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (userId) {
      supabase.from("inventory_items").delete().eq("id", itemId).eq("user_id", userId).then(({ error }) => {
        if (error) console.error("[inventory] delete failed", error);
      });
    }
  }, [userId]);

  const updateItem = useCallback((item: InventoryItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    if (userId) {
      const row = itemToRow(item, userId);
      supabase.from("inventory_items").update(row).eq("id", item.id).eq("user_id", userId).then(({ error }) => {
        if (error) console.error("[inventory] update failed", error);
      });
    }
  }, [userId]);

  const totalPeptides = useMemo(
    () => new Set(items.map((i) => i.peptideId)).size,
    [items]
  );
  const totalVials = items.length;

  return { items, alerts, addItem, removeItem, updateItem, totalPeptides, totalVials, syncedToCloud };
}
