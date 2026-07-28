// RevenueCat (Google Play Billing on Android, App Store on iOS) wrapper.
// Native-only. On web, every function short-circuits with ok=false so callers
// can fall back to Tagadapay (src/lib/billing.ts).
//
// Setup checklist:
//  1. Create product `app.peptidesa.premium.weekly` in Play Console.
//  2. In RevenueCat dashboard: entitlement `premium`, attached to the product,
//     placed in offering `default`.
//  3. Set VITE_REVENUECAT_ANDROID_KEY (goog_…) in Project Settings → Env Vars.
import { Capacitor } from '@capacitor/core';

const RC_PKG: string = '@revenuecat/purchases-capacitor';
export const PRODUCT_ID = 'app.peptidesa.premium.weekly';
export const OFFERING_ID = 'default';
export const ENTITLEMENT_ID = 'premium';

export interface BillingResult {
  ok: boolean;
  isPremium?: boolean;
  error?: string;
  reason?: 'not-native' | 'no-key' | 'no-offering' | 'cancelled' | 'unknown';
}

let initialized = false;
let initializingFor: string | null = null;

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function getApiKey(): string | null {
  // Vite exposes only VITE_-prefixed vars to the client.
  const key = (import.meta as any).env?.VITE_REVENUECAT_ANDROID_KEY as string | undefined;
  return key && key.length > 0 ? key : null;
}

/**
 * Configures RevenueCat with the public Android SDK key and the given user id.
 * Safe to call multiple times — re-runs only when the user id changes.
 */
export async function initializeBilling(userId: string): Promise<BillingResult> {
  if (!isNative()) return { ok: false, reason: 'not-native' };
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, reason: 'no-key', error: 'VITE_REVENUECAT_ANDROID_KEY is not set' };
  if (initialized && initializingFor === userId) return { ok: true };

  try {
    const { Purchases, LOG_LEVEL } = await import(/* @vite-ignore */ RC_PKG);
    if (!initialized) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
      await Purchases.configure({ apiKey, appUserID: userId });
      initialized = true;
    } else if (initializingFor !== userId) {
      await Purchases.logIn({ appUserID: userId });
    }
    initializingFor = userId;
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'unknown', error: e instanceof Error ? e.message : String(e) };
  }
}

/** Returns the package matching PRODUCT_ID inside the OFFERING_ID offering. */
export async function getOffering(): Promise<unknown | null> {
  if (!isNative()) return null;
  try {
    const { Purchases } = await import(/* @vite-ignore */ RC_PKG);
    const result: any = await Purchases.getOfferings();
    const offering = result?.all?.[OFFERING_ID] ?? result?.current;
    if (!offering) return null;
    const pkg = (offering.availablePackages ?? []).find(
      (p: any) => p?.product?.identifier === PRODUCT_ID,
    );
    return pkg ?? offering.availablePackages?.[0] ?? null;
  } catch {
    return null;
  }
}

function hasPremiumEntitlement(customerInfo: any): boolean {
  try {
    return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
  } catch {
    return false;
  }
}

export async function purchaseWeekly(): Promise<BillingResult> {
  if (!isNative()) return { ok: false, isPremium: false, reason: 'not-native' };
  try {
    const { Purchases } = await import(/* @vite-ignore */ RC_PKG);
    const pkg = await getOffering();
    if (!pkg) return { ok: false, isPremium: false, reason: 'no-offering', error: `No package found in offering "${OFFERING_ID}"` };
    const result: any = await Purchases.purchasePackage({ aPackage: pkg as any });
    return { ok: true, isPremium: hasPremiumEntitlement(result?.customerInfo) };
  } catch (e: any) {
    if (e?.userCancelled || e?.code === 'PURCHASE_CANCELLED' || /cancel/i.test(String(e?.message))) {
      return { ok: false, isPremium: false, reason: 'cancelled' };
    }
    return { ok: false, isPremium: false, reason: 'unknown', error: e instanceof Error ? e.message : String(e) };
  }
}

export async function restorePurchases(): Promise<BillingResult> {
  if (!isNative()) return { ok: false, isPremium: false, reason: 'not-native' };
  try {
    const { Purchases } = await import(/* @vite-ignore */ RC_PKG);
    const result: any = await Purchases.restorePurchases();
    return { ok: true, isPremium: hasPremiumEntitlement(result?.customerInfo) };
  } catch (e) {
    return { ok: false, isPremium: false, reason: 'unknown', error: e instanceof Error ? e.message : String(e) };
  }
}

export async function checkSubscriptionStatus(): Promise<{ isPremium: boolean }> {
  if (!isNative()) return { isPremium: false };
  try {
    const { Purchases } = await import(/* @vite-ignore */ RC_PKG);
    const result: any = await Purchases.getCustomerInfo();
    return { isPremium: hasPremiumEntitlement(result?.customerInfo) };
  } catch {
    return { isPremium: false };
  }
}
