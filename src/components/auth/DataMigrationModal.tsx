import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Database, CheckCircle2, Loader2, Cloud, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import {
  scanForLegacyData,
  migrateLegacyLocalData,
  backfillToCloud,
  markMigrationPrompted,
  markMigrationResolved,
  MigrationSummary,
} from '@/services/migration';

interface DataMigrationModalProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

export function DataMigrationModal({ userId, open, onClose }: DataMigrationModalProps) {
  const [summary, setSummary] = useState<MigrationSummary | null>(null);
  const [phase, setPhase] = useState<'detected' | 'migrating' | 'backfilling' | 'done' | 'error'>('detected');
  const [error, setError] = useState<string | null>(null);
  const [migratedKeys, setMigratedKeys] = useState(0);

  useEffect(() => {
    if (open && userId) {
      const s = scanForLegacyData(userId);
      setSummary(s);
      markMigrationPrompted(userId);
    }
  }, [open, userId]);

  const handleMigrate = async () => {
    if (!userId) return;

    setPhase('migrating');
    setError(null);

    // Step 1: Migrate localStorage
    const localResult = migrateLegacyLocalData(userId);
    if (!localResult.success) {
      setPhase('error');
      setError(localResult.error || 'Local migration failed');
      toast.error('Migration failed: ' + (localResult.error || 'Unknown error'));
      return;
    }
    setMigratedKeys(localResult.migratedKeys);

    // Step 2: Backfill to cloud
    setPhase('backfilling');
    const cloudResult = await backfillToCloud(userId);
    if (!cloudResult.success) {
      setPhase('error');
      setError(cloudResult.message);
      toast.error('Cloud backfill failed: ' + cloudResult.message);
      return;
    }

    markMigrationResolved(userId);
    setPhase('done');
    try { window.dispatchEvent(new CustomEvent('rtd:local-history-recovered')); } catch { /* noop */ }
    toast.success('Tracker history recovered and synced to cloud');
  };

  const handleSkip = () => {
    markMigrationResolved(userId);
    onClose();
  };

  if (!summary) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {phase === 'detected' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {phase === 'migrating' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
            {phase === 'backfilling' && <Cloud className="w-5 h-5 text-primary animate-pulse" />}
            {phase === 'done' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {phase === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
            {phase === 'detected' && 'Unsynced tracker history found'}
            {phase === 'migrating' && 'Migrating local data...'}
            {phase === 'backfilling' && 'Syncing to cloud...'}
            {phase === 'done' && 'Recovery complete'}
            {phase === 'error' && 'Migration failed'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {phase === 'detected' && (
              <>
                We found tracker records stored on this device that are not yet attached to your signed-in account.
                <br /><br />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                    <span>{summary.totalLegacyKeys} groups of local tracker records</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span>{summary.namespaces.map((item) => item.displayLabel).join(', ')}</span>
                  </div>
                </div>
                <br />
                Recover them into this account so your logs, cycles and settings can continue here.
              </>
            )}
            {phase === 'migrating' && 'Copying local data to your current account...'}
            {phase === 'backfilling' && 'Pushing migrated data to the new cloud project...'}
            {phase === 'done' && (
              <>
                Successfully recovered <strong>{migratedKeys}</strong> groups of tracker data.
                <br />
                Your recovered entries, cycles, stacks and settings are now available.
              </>
            )}
            {phase === 'error' && (
              <>
                Something went wrong during migration:
                <br />
                <span className="text-red-400">{error}</span>
                <br /><br />
                Your original data is still safe. You can retry or contact support.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          {phase === 'detected' && (
            <>
              <Button onClick={handleMigrate} className="w-full">
                <Database className="w-4 h-4 mr-2" />
                Recover My Tracker History
              </Button>
              <Button variant="ghost" onClick={handleSkip} className="w-full text-muted-foreground">
                Not now
              </Button>
            </>
          )}

          {(phase === 'migrating' || phase === 'backfilling') && (
            <Button disabled className="w-full">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {phase === 'migrating' ? 'Migrating locally...' : 'Syncing to cloud...'}
            </Button>
          )}

          {phase === 'done' && (
            <Button onClick={onClose} className="w-full">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Continue to App
            </Button>
          )}

          {phase === 'error' && (
            <>
              <Button onClick={handleMigrate} variant="outline" className="w-full">
                Retry Migration
              </Button>
              <Button onClick={handleSkip} variant="ghost" className="w-full text-muted-foreground">
                Continue without migrating
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
