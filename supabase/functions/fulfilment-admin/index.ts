import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const ALLOWED_ORIGINS = new Set([
  "https://peptide-south-africa.co.za",
  "https://www.peptide-south-africa.co.za",
  "capacitor://localhost",
  "http://localhost:5173",
]);

const SERVICES = new Set(["postnet_to_door", "postnet_to_postnet", "cape_town_local", "paxi_accessories"]);
const CHECKLIST_KEYS = [
  "items_verified", "batch_verified", "insulation_added", "cold_pack_added",
  "tamper_seal_applied", "insert_added", "final_check",
] as const;

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://peptide-south-africa.co.za",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type AllocationInput = {
  product_slug?: unknown;
  variant_label?: unknown;
  lot_number?: unknown;
  expires_at?: unknown;
  quantity?: unknown;
};

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(origin, { error: "Origin not allowed" }, 403);
  if (req.method !== "POST") return json(origin, { error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const userClient = createClient(supabaseUrl, anonKey, {
    db: { schema: "tracker" },
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user) return json(origin, { error: "Unauthorized" }, 401);
  const { data: isAdmin, error: roleError } = await userClient.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (roleError || !isAdmin) return json(origin, { error: "Forbidden" }, 403);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json(origin, { error: "Invalid JSON" }, 400); }
  const action = typeof body.action === "string" ? body.action : "overview";
  const admin = createClient(supabaseUrl, serviceKey, { db: { schema: "public" } });

  if (action === "create_shipment") {
    if (!isUuid(body.order_id) || typeof body.service !== "string" || !SERVICES.has(body.service)) {
      return json(origin, { error: "A valid order and delivery service are required" }, 400);
    }
    const { data: order, error: orderError } = await admin.from("orders")
      .select("id,public_ref,shipping_address")
      .eq("id", body.order_id)
      .single();
    if (orderError || !order) return json(origin, { error: "Order not found" }, 404);
    const address = order.shipping_address && typeof order.shipping_address === "object"
      ? order.shipping_address as Record<string, unknown>
      : {};
    const { error } = await admin.from("shipments").insert({
      web_order_id: order.id,
      order_ref: order.public_ref,
      service: body.service,
      postnet_branch_name: typeof body.postnet_branch_name === "string" ? body.postnet_branch_name.trim() || null : null,
      address_city: typeof address.city === "string" ? address.city : null,
      address_province: typeof address.province === "string" ? address.province : null,
      status: "pending_pick",
    });
    if (error) return json(origin, { error: "Shipment could not be created" }, 500);
    return json(origin, { ok: true });
  }

  if (action === "save_packing") {
    if (!isUuid(body.shipment_id) || !body.checklist || typeof body.checklist !== "object" || !Array.isArray(body.allocations)) {
      return json(origin, { error: "Shipment, checklist and batch allocations are required" }, 400);
    }
    const checklistInput = body.checklist as Record<string, unknown>;
    const checklist = Object.fromEntries(CHECKLIST_KEYS.map((key) => [key, checklistInput[key] === true]));
    const allocations = (body.allocations as AllocationInput[]).map((item) => ({
      shipment_id: body.shipment_id as string,
      product_slug: typeof item.product_slug === "string" ? item.product_slug.trim().toLowerCase() : "",
      variant_label: typeof item.variant_label === "string" ? item.variant_label.trim() || null : null,
      lot_number: typeof item.lot_number === "string" ? item.lot_number.trim() : "",
      expires_at: typeof item.expires_at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.expires_at) ? item.expires_at : null,
      quantity: typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1,
      allocated_by: user.id,
    }));
    if (allocations.length === 0 || allocations.some((item) => !item.product_slug || !item.lot_number)) {
      return json(origin, { error: "Every packed item needs a product slug and lot number" }, 400);
    }
    const { error: deleteError } = await admin.from("shipment_batch_allocations").delete().eq("shipment_id", body.shipment_id);
    if (deleteError) return json(origin, { error: "Existing batch allocation could not be updated" }, 500);
    const { error: allocationError } = await admin.from("shipment_batch_allocations").insert(allocations);
    if (allocationError) return json(origin, { error: "Batch allocation could not be saved" }, 500);
    const { error: shipmentError } = await admin.from("shipments").update({
      packing_checklist: checklist,
      tamper_seal_number: typeof body.tamper_seal_number === "string" ? body.tamper_seal_number.trim() || null : null,
      packing_notes: typeof body.packing_notes === "string" ? body.packing_notes.trim().slice(0, 1_000) || null : null,
      packed_by: user.id,
      packed_at: new Date().toISOString(),
      status: "packed",
    }).eq("id", body.shipment_id);
    if (shipmentError) return json(origin, { error: "Packing record could not be saved" }, 500);
    await admin.from("fulfilment_events").insert({ shipment_id: body.shipment_id, event: "packing_saved", logged_by: user.id });
    return json(origin, { ok: true });
  }

  if (action === "mark_ready") {
    if (!isUuid(body.shipment_id)) return json(origin, { error: "Valid shipment required" }, 400);
    const { error } = await admin.from("shipments").update({
      status: "ready_for_collection",
      ready_for_collection_at: new Date().toISOString(),
    }).eq("id", body.shipment_id);
    if (error) return json(origin, { error: error.message.includes("cannot be released") ? error.message : "Shipment is not ready" }, 409);
    await admin.from("fulfilment_events").insert({ shipment_id: body.shipment_id, event: "ready_for_collection", logged_by: user.id });
    return json(origin, { ok: true });
  }

  if (action === "dispatch") {
    if (!isUuid(body.shipment_id) || typeof body.tracking_number !== "string" || !body.tracking_number.trim()) {
      return json(origin, { error: "Tracking number is required" }, 400);
    }
    const { error } = await admin.from("shipments").update({
      status: "dispatched",
      tracking_number: body.tracking_number.trim().slice(0, 120),
      courier: typeof body.courier === "string" ? body.courier.trim().slice(0, 80) || "PostNet" : "PostNet",
      ship_date: new Date().toISOString().slice(0, 10),
      dispatched_at: new Date().toISOString(),
    }).eq("id", body.shipment_id).eq("status", "ready_for_collection");
    if (error) return json(origin, { error: error.message.includes("cannot be released") ? error.message : "Shipment could not be dispatched" }, 409);
    await admin.from("fulfilment_events").insert({ shipment_id: body.shipment_id, event: "dispatched", logged_by: user.id });
    return json(origin, { ok: true });
  }

  const [{ data: shipments, error: shipmentsError }, { data: orders, error: ordersError }] = await Promise.all([
    admin.from("shipments")
      .select("id,web_order_id,order_ref,status,service,postnet_branch_name,courier,tracking_number,packing_checklist,tamper_seal_number,packing_notes,created_at,updated_at,shipment_batch_allocations(id,product_slug,variant_label,lot_number,expires_at,quantity),orders(public_ref,customer_name,customer_email,customer_phone,order_items)")
      .order("created_at", { ascending: false })
      .limit(250),
    admin.from("orders")
      .select("id,public_ref,customer_name,customer_email,status,created_at")
      .in("status", ["paid", "processing"])
      .order("created_at", { ascending: false })
      .limit(250),
  ]);
  if (shipmentsError || ordersError) return json(origin, { error: "Fulfilment queue could not be loaded" }, 500);
  const shipmentOrderIds = new Set((shipments ?? []).map((shipment) => shipment.web_order_id).filter(Boolean));
  return json(origin, {
    shipments: shipments ?? [],
    unallocated_orders: (orders ?? []).filter((order) => !shipmentOrderIds.has(order.id)),
    stats: {
      queued: (shipments ?? []).filter((shipment) => ["pending_pick", "picking"].includes(shipment.status)).length,
      packing: (shipments ?? []).filter((shipment) => shipment.status === "packed").length,
      ready: (shipments ?? []).filter((shipment) => shipment.status === "ready_for_collection").length,
      dispatched: (shipments ?? []).filter((shipment) => ["dispatched", "in_transit", "out_for_delivery"].includes(shipment.status)).length,
    },
  });
});
