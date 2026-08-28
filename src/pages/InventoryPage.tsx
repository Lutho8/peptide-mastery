import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  AlertTriangle,
  Clock,
  Trash2,
  Pencil,
  Beaker,
  CalendarClock,
  ChevronRight,
  X,
  Cloud,
  CloudOff,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useInventory } from "@/hooks/useInventory";
import { InventoryItem } from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3 } },
};

// ===== Helpers =====
function formatDate(ts: number | string | undefined): string {
  if (ts == null || ts === "") return "Not recorded";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleDateString("en-ZA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(ts: number | string): number | null {
  const t = typeof ts === "number" ? ts : new Date(ts).getTime();
  if (!Number.isFinite(t) || t <= 0) return null;
  return Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
}

function getStockPercent(item: InventoryItem): number {
  return Math.round(((item.remainingMg ?? 0) / item.vialSizeMg) * 100);
}

function getStockColor(percent: number): string {
  if (percent > 50) return "bg-emerald-500";
  if (percent > 20) return "bg-amber-500";
  return "bg-red-500";
}

// ===== Vial Card Component =====
function VialCard({
  item,
  onDelete,
  onOpenDailyLog,
}: {
  item: InventoryItem;
  onDelete: (id: string) => void;
  onOpenDailyLog: () => void;
}) {
  const stockPercent = getStockPercent(item);
  const expiryDays = daysUntil(item.expirationDate);
  const stockColor = getStockColor(stockPercent);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "hover:shadow-lg transition-all duration-300 border-l-4",
        stockPercent <= 20 ? "border-l-red-500" : stockPercent <= 50 ? "border-l-amber-500" : "border-l-emerald-500"
      )}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-lg",
                stockPercent <= 20 ? "bg-red-50" : stockPercent <= 50 ? "bg-amber-50" : "bg-emerald-50"
              )}>
                <Beaker className={cn(
                  "h-5 w-5",
                  stockPercent <= 20 ? "text-red-500" : stockPercent <= 50 ? "text-amber-500" : "text-emerald-500"
                )} />
              </div>
              <div>
                <h3 className="font-semibold">{item.peptideName}</h3>
                <p className="text-xs text-muted-foreground">
                  {item.concentrationMgMl}mg/mL &middot; {item.volumeMl}mL vial
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>

          {/* Stock Progress */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-semibold">{item.remainingMg.toFixed(1)} / {item.vialSizeMg} mg</span>
            </div>
            <Progress value={stockPercent} className="h-2" />
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {stockPercent}% left
              </Badge>
              {expiryDays === null ? (
                <Badge variant="outline" className="text-xs">Expiry not recorded</Badge>
              ) : expiryDays <= 30 ? (
                <Badge variant="destructive" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {expiryDays <= 0 ? "Expired" : `${expiryDays}d left`}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <CalendarClock className="h-3 w-3 mr-1" />
                  {expiryDays}d left
                </Badge>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="text-xs text-muted-foreground space-y-1 mb-4">
            {item.batchNumber && <p>Batch: {item.batchNumber}</p>}
            {item.supplier && <p>Supplier: {item.supplier}</p>}
            <p>Reconstituted: {formatDate(item.openedDate)}</p>
            <p>Expires: {formatDate(item.expirationDate)}</p>
          </div>

          <div className="pt-3 border-t">
            <Button size="sm" variant="secondary" className="w-full" onClick={onOpenDailyLog}>
              Open Daily Log
            </Button>
            <p className="mt-2 text-[10px] text-muted-foreground">Entries are logged once in Daily Log, then synced to history and inventory.</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===== Main Component =====
export default function InventoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { items, alerts, addItem, removeItem, syncedToCloud } = useInventory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const displayItems = items;

  const [newVial, setNewVial] = useState<Partial<InventoryItem>>({
    peptideName: "",
    vialSizeMg: 5,
    remainingMg: 5,
    concentrationMgMl: 5,
    volumeMl: 1,
    reconstitutionDate: undefined,
    expirationDate: "",
    batchNumber: "",
    supplier: "",
  });

  const handleAddVial = () => {
    if (!newVial.peptideName || !newVial.expirationDate) return;
    const vial: InventoryItem = {
      id: `vial-${Date.now()}`,
      peptideId: newVial.peptideName!.toLowerCase().replace(/\s+/g, "-"),
      peptideName: newVial.peptideName!,
      vialSizeMg: newVial.vialSizeMg ?? 5,
      remainingMg: newVial.remainingMg ?? 5,
      concentrationMgMl: newVial.concentrationMgMl ?? 5,
      volumeMl: newVial.volumeMl ?? 1,
      openedDate: newVial.reconstitutionDate ? new Date(newVial.reconstitutionDate).getTime() : undefined,
      reconstitutionDate: newVial.reconstitutionDate,
      expirationDate: newVial.expirationDate,
      batchNumber: newVial.batchNumber,
      supplier: newVial.supplier,
    };
    addItem(vial);
    setDialogOpen(false);
    setNewVial({
      peptideName: "",
      vialSizeMg: 5,
      remainingMg: 5,
      concentrationMgMl: 5,
      volumeMl: 1,
      reconstitutionDate: undefined,
      expirationDate: "",
      batchNumber: "",
      supplier: "",
    });
  };

  const criticalAlerts = alerts.filter((a) => a.severity === "danger" || a.type === "expired");
  const warningAlerts = alerts.filter((a) => a.severity === "warning" && a.type !== "expired");

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  if (!user) return <Navigate to="/dashboard" replace />;

  return (
    <motion.div
      className="min-h-screen bg-background pb-12"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/?screen=home')} aria-label="Back to dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-3 rounded-xl bg-primary/10">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-3xl">Vial Inventory</h1>
                <p className="text-muted-foreground mt-1">
                  Track stock levels, expiration dates, and usage
                </p>
              </div>
              <Badge variant={syncedToCloud ? "default" : "secondary"} className="gap-1.5 ml-2 hidden sm:inline-flex">
                {syncedToCloud ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
                {syncedToCloud ? "Synced" : "Local"}
              </Badge>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vial
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Vial</DialogTitle>
                  <DialogDescription>Enter the details of your new peptide vial</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Peptide Name</label>
                    <Input
                      value={newVial.peptideName}
                      onChange={(e) => setNewVial((prev) => ({ ...prev, peptideName: e.target.value }))}
                      placeholder="e.g., BPC-157"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Vial Size (mg)</label>
                      <Input
                        type="number"
                        value={newVial.vialSizeMg}
                        onChange={(e) => setNewVial((prev) => ({ ...prev, vialSizeMg: parseFloat(e.target.value) }))}
                        min={0.1}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Remaining (mg)</label>
                      <Input
                        type="number"
                        value={newVial.remainingMg}
                        onChange={(e) => setNewVial((prev) => ({ ...prev, remainingMg: parseFloat(e.target.value) }))}
                        min={0}
                        step={0.1}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reconstituted date (optional)</label>
                      <Input
                        type="date"
                        value={typeof newVial.reconstitutionDate === 'string' ? newVial.reconstitutionDate : ''}
                        onChange={(e) => setNewVial((prev) => ({ ...prev, reconstitutionDate: e.target.value || undefined }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Recorded expiry date *</label>
                      <Input
                        type="date"
                        value={typeof newVial.expirationDate === 'string' ? newVial.expirationDate : ''}
                        onChange={(e) => setNewVial((prev) => ({ ...prev, expirationDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Copy the expiry from the vial, COA or qualified instruction. The app does not invent a shelf-life date.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Concentration (mg/mL)</label>
                      <Input
                        type="number"
                        value={newVial.concentrationMgMl}
                        onChange={(e) => setNewVial((prev) => ({ ...prev, concentrationMgMl: parseFloat(e.target.value) }))}
                        min={0.1}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Volume (mL)</label>
                      <Input
                        type="number"
                        value={newVial.volumeMl}
                        onChange={(e) => setNewVial((prev) => ({ ...prev, volumeMl: parseFloat(e.target.value) }))}
                        min={0.1}
                        step={0.1}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Batch Number (optional)</label>
                    <Input
                      value={newVial.batchNumber ?? ""}
                      onChange={(e) => setNewVial((prev) => ({ ...prev, batchNumber: e.target.value }))}
                      placeholder="e.g., BPC-2024-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Supplier (optional)</label>
                    <Input
                      value={newVial.supplier ?? ""}
                      onChange={(e) => setNewVial((prev) => ({ ...prev, supplier: e.target.value }))}
                      placeholder="e.g., Peptide Sciences"
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddVial} disabled={!newVial.peptideName || !newVial.expirationDate}>
                  Add Vial to Inventory
                </Button>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Alerts Section */}
        {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {criticalAlerts.map((alert) => (
              <Card key={alert.id} className="border-red-300 bg-red-50/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-800 font-medium">{alert.message}</p>
                </CardContent>
              </Card>
            ))}
            {warningAlerts.map((alert) => (
              <Card key={alert.id} className="border-amber-300 bg-amber-50/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-800">{alert.message}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Summary Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Vials:</span>
                  <span className="font-semibold">{displayItems.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Unique Peptides:</span>
                  <span className="font-semibold">{new Set(displayItems.map((i) => i.peptideId)).size}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Alerts:</span>
                  <span className="font-semibold">{alerts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vial Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {displayItems.map((item) => (
              <VialCard
                key={item.id}
                item={item}
                onDelete={removeItem}
                onOpenDailyLog={() => navigate('/?screen=daily-log')}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {displayItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No vials in inventory</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Add Vial" to start tracking your peptide inventory
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
