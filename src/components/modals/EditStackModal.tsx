import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GradientCard } from '@/components/ui/GradientCard';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { getAllSelectablePeptides, findPeptideOrBlend } from '@/data/blendAdapters';
import { Plus, Trash2, X, FlaskConical, Info } from 'lucide-react';
import { toast } from 'sonner';

export type ExperienceTier = 'beginner' | 'intermediate' | 'advanced' | 'athlete';

export interface StackItem {
  peptideId: string;
  dose: string;
  frequency: string;
  experienceLevel?: ExperienceTier;
}

interface EditStackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStack: StackItem[];
  onSave: (stack: StackItem[]) => void;
}

export function EditStackModal({ open, onOpenChange, currentStack, onSave }: EditStackModalProps) {
  const [stack, setStack] = useState<StackItem[]>([]);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newPeptideId, setNewPeptideId] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newFrequency, setNewFrequency] = useState('');

  useEffect(() => {
    if (open) {
      setStack([...currentStack]);
      setShowAddNew(false);
    }
  }, [open, currentStack]);

  const handleUpdateItem = (index: number, field: 'dose' | 'frequency', value: string) => {
    const updated = [...stack];
    updated[index] = { ...updated[index], [field]: value };
    setStack(updated);
  };

  const handleRemoveItem = (index: number) => {
    setStack(stack.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!newPeptideId) {
      toast.error('Please select a peptide');
      return;
    }
    if (!newDose) {
      toast.error('Please enter a dose');
      return;
    }
    if (!newFrequency) {
      toast.error('Please enter a frequency');
      return;
    }

    // Check if already in stack
    if (stack.some(s => s.peptideId === newPeptideId)) {
      toast.error('This peptide is already in your stack');
      return;
    }

    setStack([...stack, { peptideId: newPeptideId, dose: newDose, frequency: newFrequency }]);
    setNewPeptideId('');
    setNewDose('');
    setNewFrequency('');
    setShowAddNew(false);
    toast.success('Item added to your recorded workspace');
  };

  const handleSave = () => {
    onSave(stack);
    onOpenChange(false);
    toast.success('Stack updated successfully');
  };

  const allSelectable = getAllSelectablePeptides();
  const availablePeptides = allSelectable.filter(p => !stack.some(s => s.peptideId === p.id));
  const availableIndividual = availablePeptides.filter(p => !p.isBlend);
  const availableBlends = availablePeptides.filter(p => p.isBlend);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Recorded Workspace</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Stack Items */}
          {stack.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No items have been recorded yet.</p>
              <p className="text-sm">Add only information from an existing plan or your own research record.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stack.map((item, index) => {
                const peptide = findPeptideOrBlend(item.peptideId);
                const isBlend = allSelectable.find(s => s.id === item.peptideId)?.isBlend;
                if (!peptide) return null;

                return (
                  <GradientCard key={item.peptideId} className="p-3">
                    <div className="flex items-start gap-3">
                      {isBlend ? (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                          <FlaskConical className="w-4 h-4 text-purple-400" />
                        </div>
                      ) : (
                        <CategoryBadge category={peptide.category} showCount={false} size="sm" />
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground text-sm">{peptide.name}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Dose</Label>
                            <Input
                              value={item.dose}
                              onChange={(e) => handleUpdateItem(index, 'dose', e.target.value)}
                              placeholder="e.g., 500mcg"
                              className="h-8 text-sm bg-muted border-border"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Frequency</Label>
                            <Input
                              value={item.frequency}
                              onChange={(e) => handleUpdateItem(index, 'frequency', e.target.value)}
                              placeholder="e.g., Daily"
                              className="h-8 text-sm bg-muted border-border"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </GradientCard>
                );
              })}
            </div>
          )}

          {/* Add New Peptide Form */}
          {showAddNew ? (
            <GradientCard className="p-4 border-primary/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground text-sm">Add Peptide</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowAddNew(false)}
                >
                  <X size={14} />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-muted-foreground">
                  <Info size={14} className="mt-0.5 shrink-0 text-primary" />
                  <p>The app records the item, amount and frequency you enter. It does not select or recommend these values.</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Peptide / Blend</Label>
                  <Select value={newPeptideId} onValueChange={setNewPeptideId}>

                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder="Select peptide or blend" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIndividual.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Individual Peptides</div>
                          {availableIndividual.map(peptide => (
                            <SelectItem key={peptide.id} value={peptide.id}>
                              {peptide.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {availableBlends.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t border-border mt-1 pt-1.5">Blends & Stacks</div>
                          {availableBlends.map(peptide => (
                            <SelectItem key={peptide.id} value={peptide.id}>
                              <span className="flex items-center gap-1.5">
                                <FlaskConical className="w-3 h-3 text-purple-400" />
                                {peptide.name}
                              </span>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">

                  <div>
                    <Label className="text-xs text-muted-foreground">Recorded amount</Label>
                    <Input
                      value={newDose}
                      onChange={(e) => setNewDose(e.target.value)}
                      placeholder="Enter from your plan"
                      className="bg-muted border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Frequency</Label>
                    <Input
                      value={newFrequency}
                      onChange={(e) => setNewFrequency(e.target.value)}
                      placeholder="Enter from your plan"
                      className="bg-muted border-border"
                    />
                  </div>
                </div>

                <Button onClick={handleAddItem} className="w-full" size="sm">
                  <Plus size={14} className="mr-1" />
                  Add recorded item
                </Button>
              </div>
            </GradientCard>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setShowAddNew(true)}
            >
              <Plus size={16} className="mr-2" />
              Add recorded item
            </Button>
          )}

          {/* Save Button */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Save workspace
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
