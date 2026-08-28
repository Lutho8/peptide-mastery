import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CloudInjectionRecord {
  id: string;
  site_id: string;
  peptide_id: string;
  peptide_name: string | null;
  dose_mg: number | null;
  route: string;
  injected_at: string;
  pain_score: number | null;
  swelling_score: number | null;
  notes: string | null;
}

export interface CloudInjectionSite {
  id: string;
  region: string;
  side: "L" | "R" | "C";
  zone_index: number;
  svg_path_id: string;
  recommended_routes: string[];
  display_name: string;
}

/**
 * Cloud-backed hook for the catalog of injection sites and per-user
 * injection records. Returns empty arrays for guest users.
 */
export function useInjectionRecordsCloud() {
  const { user } = useAuth();
  const userId = user?.id;
  const [sites, setSites] = useState<CloudInjectionSite[]>([]);
  const [records, setRecords] = useState<CloudInjectionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setRecords([]);
      return;
    }
    const { data, error } = await supabase
      .from("injection_records")
      .select("*")
      .eq("user_id", userId)
      .order("injected_at", { ascending: false })
      .limit(200);
    if (!error && data) setRecords(data as CloudInjectionRecord[]);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const sitesRes = await supabase.from("injection_sites").select("*").order("zone_index");
      if (!cancelled && !sitesRes.error && sitesRes.data) {
        setSites(sitesRes.data as CloudInjectionSite[]);
      }
      if (userId) {
        await refresh();
      } else {
        setRecords([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId, refresh]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`injection-records:${userId}:${crypto.randomUUID()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'tracker',
        table: 'injection_records',
        filter: `user_id=eq.${userId}`,
      }, () => { void refresh(); })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn(`[Injection records] Realtime ${status.toLowerCase()}`);
      });
    return () => { void supabase.removeChannel(channel).catch(() => undefined); };
  }, [refresh, userId]);

  const logRecord = useCallback(async (params: {
    siteId: string;
    peptideId: string;
    peptideName?: string;
    doseMg?: number;
    route?: string;
    painScore?: number;
    swellingScore?: number;
    notes?: string;
    injectedAt?: string;
  }) => {
    if (!userId) return { error: "Sign in to log injections" } as const;
    const { error } = await supabase.from("injection_records").insert({
      user_id: userId,
      site_id: params.siteId,
      peptide_id: params.peptideId,
      peptide_name: params.peptideName ?? null,
      dose_mg: params.doseMg ?? null,
      route: params.route ?? "subcutaneous",
      pain_score: params.painScore ?? null,
      swelling_score: params.swellingScore ?? null,
      notes: params.notes ?? null,
      injected_at: params.injectedAt ?? new Date().toISOString(),
    });
    if (error) return { error: error.message } as const;
    await refresh();
    return { error: null } as const;
  }, [userId, refresh]);

  return { sites, records, loading, logRecord, refresh, isCloud: !!userId };
}

/**
 * Rank injection sites for the next dose using a 7-day cooldown and
 * least-recently-used scoring. Returns sites sorted best-first.
 */
export function rankNextSites(
  sites: CloudInjectionSite[],
  records: CloudInjectionRecord[],
  route: string = "subcutaneous",
  cooldownDays: number = 7,
): Array<{ site: CloudInjectionSite; score: number; lastUsedAt: number | null; reason: string }> {
  const now = Date.now();
  const cooldownMs = cooldownDays * 24 * 3600 * 1000;
  const lastUsed = new Map<string, number>();
  for (const r of records) {
    const t = new Date(r.injected_at).getTime();
    if (!lastUsed.has(r.site_id) || lastUsed.get(r.site_id)! < t) {
      lastUsed.set(r.site_id, t);
    }
  }
  

  return sites
    .filter((s) => s.recommended_routes.includes(route))
    .map((site) => {
      const last = lastUsed.get(site.id) ?? null;
      const sinceMs = last ? now - last : Infinity;
      const cooldownClear = sinceMs >= cooldownMs;
      let score = sinceMs === Infinity ? 1e9 : sinceMs / 3600000; // hours since use
      if (!cooldownClear) score -= 1e6;
      // (Side rotation heuristic intentionally omitted; recommended_routes filter is enough.)
      const reason = !cooldownClear
        ? `In ${cooldownDays}-day cooldown`
        : last
          ? `Last used ${Math.round(sinceMs / (24 * 3600000))}d ago`
          : "Never used — fresh site";
      return { site, score, lastUsedAt: last, reason };
    })
    .sort((a, b) => b.score - a.score);
}
