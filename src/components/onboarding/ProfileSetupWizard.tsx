import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, saveUserProfile, UserProfile } from '@/services/storage';
import { useProfileSync } from '@/hooks/useProfileSync';
import { Sparkles, ArrowRight, ArrowLeft, Check, Target, Dumbbell, Heart, Zap, Brain, Shield, Moon, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const STORAGE_FLAG = 'rtd-profile-setup-completed';

const GOALS = [
  { id: 'fat-loss', label: 'Fat Loss', icon: Flame },
  { id: 'muscle-gain', label: 'Muscle Gain', icon: Dumbbell },
  { id: 'recovery', label: 'Recovery & Healing', icon: Heart },
  { id: 'longevity', label: 'Longevity', icon: Shield },
  { id: 'cognitive', label: 'Cognitive Edge', icon: Brain },
  { id: 'energy', label: 'Energy & Performance', icon: Zap },
  { id: 'sleep', label: 'Sleep Quality', icon: Moon },
  { id: 'metabolic', label: 'Metabolic Health', icon: Target },
] as const;

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name too long'),
  age: z.number().int().min(18, 'Must be 18+').max(100, 'Invalid age'),
  gender: z.enum(['male', 'female']),
  height: z.number().min(120, 'Height must be at least 120cm').max(230, 'Height must be under 230cm'),
  weight: z.number().min(35, 'Weight must be at least 35kg').max(250, 'Weight must be under 250kg'),
  activityLevel: z.enum(['sedentary', 'moderate', 'active', 'athlete']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.array(z.string()).min(1, 'Pick at least one goal').max(5, 'Pick up to 5 goals'),
});

type WizardData = z.infer<typeof profileSchema>;

export function shouldShowProfileSetup(userId: string | undefined): boolean {
  if (!userId) return false;
  const flag = localStorage.getItem(`${STORAGE_FLAG}:${userId}`);
  if (flag) return false;
  // Also skip if profile already has stats (e.g., synced from cloud)
  const profile = getUserProfile();
  const hasStats = profile.age > 0 && profile.height > 0 && profile.weight > 0 && profile.name?.trim();
  return !hasStats;
}

export function ProfileSetupWizard({ open, onOpenChange, onComplete }: ProfileSetupWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { pushProfile } = useProfileSync();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<WizardData>({
    name: '',
    age: 30,
    gender: 'male',
    height: 175,
    weight: 75,
    activityLevel: 'moderate',
    experience: 'beginner',
    goals: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill name from auth metadata or email
  useEffect(() => {
    if (open && user) {
      const fallbackName =
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        '';
      setData((prev) => ({ ...prev, name: prev.name || fallbackName }));
    }
  }, [open, user]);

  const steps = [
    { title: 'Welcome', subtitle: "Let's make the tracker easier to use" },
    { title: 'About You', subtitle: 'Tell us a bit about yourself' },
    { title: 'Body Stats', subtitle: 'Used for progress and body composition' },
    { title: 'Experience', subtitle: 'Changes how much guidance we show' },
    { title: 'Your Goals', subtitle: 'Pick up to 5 — organises your dashboard' },
  ];

  const progress = ((step + 1) / steps.length) * 100;

  const toggleGoal = (id: string) => {
    setData((prev) => {
      const has = prev.goals.includes(id);
      if (has) return { ...prev, goals: prev.goals.filter((g) => g !== id) };
      if (prev.goals.length >= 5) {
        toast({ title: 'Up to 5 goals', description: 'Deselect one to add another.' });
        return prev;
      }
      return { ...prev, goals: [...prev.goals, id] };
    });
  };

  const validateCurrentStep = (): boolean => {
    setErrors({});
    if (step === 1) {
      const r = z.object({
        name: profileSchema.shape.name,
        age: profileSchema.shape.age,
        gender: profileSchema.shape.gender,
      }).safeParse(data);
      if (!r.success) {
        const fe: Record<string, string> = {};
        r.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
        setErrors(fe);
        return false;
      }
    }
    if (step === 2) {
      const r = z.object({
        height: profileSchema.shape.height,
        weight: profileSchema.shape.weight,
      }).safeParse(data);
      if (!r.success) {
        const fe: Record<string, string> = {};
        r.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
        setErrors(fe);
        return false;
      }
    }
    if (step === 4) {
      if (data.goals.length === 0) {
        setErrors({ goals: 'Pick at least one goal' });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (step < steps.length - 1) setStep(step + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    const parsed = profileSchema.safeParse(data);
    if (!parsed.success) {
      toast({ title: 'Please review your inputs', variant: 'destructive' });
      return;
    }
    const goalLabels: string[] = parsed.data.goals
      .map((id) => GOALS.find((g) => g.id === id)?.label as string | undefined)
      .filter((g): g is string => Boolean(g));

    const profile: UserProfile = {
      name: parsed.data.name,
      age: parsed.data.age,
      gender: parsed.data.gender,
      height: parsed.data.height,
      weight: parsed.data.weight,
      activityLevel: parsed.data.activityLevel,
      experience: parsed.data.experience,
      goals: goalLabels,
    };

    setIsSaving(true);
    saveUserProfile(profile);

    // Push to Supabase so it persists across devices and survives a localStorage clear
    const synced = await pushProfile(profile);

    if (user?.id) {
      localStorage.setItem(`${STORAGE_FLAG}:${user.id}`, new Date().toISOString());
    }
    setIsSaving(false);

    toast({
      title: '🎉 Profile ready',
      description: synced
        ? 'Saved to the cloud — your tracker is ready.'
        : 'Saved locally. Cloud sync will retry next time you open the app.',
    });
    onComplete?.();
    onOpenChange(false);
    setStep(0);
  };

  const handleSkip = () => {
    if (user?.id) {
      localStorage.setItem(`${STORAGE_FLAG}:${user.id}`, 'skipped');
    }
    onOpenChange(false);
    setStep(0);
  };

  const initials = useMemo(() => {
    const n = data.name.trim() || user?.email || 'You';
    return n.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2);
  }, [data.name, user]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleSkip(); }}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md sm:max-w-md max-h-[92dvh] overflow-y-auto bg-background border-border p-0 mx-auto rounded-xl">
        <div className="p-6 pb-2">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-primary" />
              <DialogTitle className="text-foreground text-lg">{steps[step].title}</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {steps[step].subtitle}
            </DialogDescription>
          </DialogHeader>
          <Progress value={progress} className="h-1.5 mt-4" />
          <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
            Step {step + 1} of {steps.length}
          </p>
        </div>

        <div className="px-6 pb-6 min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {step === 0 && (
                <div className="text-center py-6 space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl luxury-shimmer"
                  >
                    {initials}
                  </motion.div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-foreground">Welcome to Peptide South Africa</h3>
                    <p className="text-sm text-muted-foreground px-4">
                      Spend 60 seconds setting up your profile so the tracker can show the right level of guidance and progress views for <span className="text-foreground font-medium">you</span>.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {[
                      { icon: Target, label: 'Clear goals' },
                      { icon: Sparkles, label: 'Simpler guidance' },
                      { icon: Shield, label: 'Private tracking' },
                    ].map((b, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-2 text-center">
                        <b.icon size={16} className="text-primary mx-auto mb-1" />
                        <p className="text-[10px] text-muted-foreground leading-tight">{b.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="setup-name" className="text-xs">Full name</Label>
                    <Input
                      id="setup-name"
                      value={data.name}
                      maxLength={60}
                      onChange={(e) => setData({ ...data, name: e.target.value })}
                      placeholder="e.g., Alex Morgan"
                      className="bg-muted"
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="setup-age" className="text-xs">Age</Label>
                      <Input
                        id="setup-age"
                        type="number"
                        min={18}
                        max={100}
                        value={data.age || ''}
                        onChange={(e) => setData({ ...data, age: parseInt(e.target.value) || 0 })}
                        className="bg-muted"
                      />
                      {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Gender</Label>
                      <Select
                        value={data.gender}
                        onValueChange={(v: 'male' | 'female') => setData({ ...data, gender: v })}
                      >
                        <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="setup-height" className="text-xs">Height (cm)</Label>
                      <Input
                        id="setup-height"
                        type="number"
                        min={120}
                        max={230}
                        value={data.height || ''}
                        onChange={(e) => setData({ ...data, height: parseInt(e.target.value) || 0 })}
                        className="bg-muted"
                      />
                      {errors.height && <p className="text-xs text-destructive">{errors.height}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="setup-weight" className="text-xs">Weight (kg)</Label>
                      <Input
                        id="setup-weight"
                        type="number"
                        step="0.1"
                        min={35}
                        max={250}
                        value={data.weight || ''}
                        onChange={(e) => setData({ ...data, weight: parseFloat(e.target.value) || 0 })}
                        className="bg-muted"
                      />
                      {errors.weight && <p className="text-xs text-destructive">{errors.weight}</p>}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/40 p-2.5 rounded-lg">
                    Stored locally on your device. Used for BMI and body-composition progress tracking—not to choose a dose.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Activity level</Label>
                    <Select
                      value={data.activityLevel}
                      onValueChange={(v: WizardData['activityLevel']) => setData({ ...data, activityLevel: v })}
                    >
                      <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary — desk-based</SelectItem>
                        <SelectItem value="moderate">Moderate — 2-3 sessions/week</SelectItem>
                        <SelectItem value="active">Active — 4-5 sessions/week</SelectItem>
                        <SelectItem value="athlete">Athlete — daily training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Peptide experience</Label>
                    <Select
                      value={data.experience}
                      onValueChange={(v: WizardData['experience']) => setData({ ...data, experience: v })}
                    >
                      <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner — researching first protocol</SelectItem>
                        <SelectItem value="intermediate">Intermediate — 1+ cycle completed</SelectItem>
                        <SelectItem value="advanced">Advanced — multiple stacks run</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Pick what matters most ({data.goals.length}/5 selected)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {GOALS.map((g) => {
                      const active = data.goals.includes(g.id);
                      const Icon = g.icon;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleGoal(g.id)}
                          className={cn(
                            'flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left touch-target',
                            active
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                          )}
                        >
                          <div className={cn(
                            'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
                            active ? 'bg-primary/20' : 'bg-muted'
                          )}>
                            <Icon size={14} className={active ? 'text-primary' : 'text-muted-foreground'} />
                          </div>
                          <span className="text-xs font-medium">{g.label}</span>
                          {active && <Check size={12} className="text-primary ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {errors.goals && <p className="text-xs text-destructive">{errors.goals}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="border-t border-border p-4 flex items-center gap-2 bg-muted/20">
          {step > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(step - 1)}
              className="gap-1"
            >
              <ArrowLeft size={14} />
              Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
              Skip for now
            </Button>
          )}
          <Button onClick={handleNext} className="ml-auto gap-1.5" size="sm" disabled={isSaving}>
            {step === steps.length - 1 ? (
              isSaving ? (
                <>Saving…</>
              ) : (
                <>
                  <Check size={14} />
                  Finish
                </>
              )
            ) : (
              <>
                {step === 0 ? "Let's go" : 'Continue'}
                <ArrowRight size={14} />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
