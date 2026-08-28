export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number; // cm
  weight: number; // kg
  activityLevel: 'sedentary' | 'moderate' | 'active' | 'athlete';
  experience: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
}

export interface BodyComposition {
  date: string;
  weight: number;
  bmi: number;
  bodyFat: number;
  fatFreeWeight: number;
  muscleMass: number;
  skeletalMuscle: number;
  bodyWater: number;
  subcutaneousFat: number;
  visceralFat: number;
  boneMass: number;
  protein: number;
  bmr: number;
  metabolicAge: number;
}

export interface DoseSchedule {
  id: string;
  peptideId: string;
  peptideName: string;
  dose: string;
  frequency: 'daily' | 'weekly' | '2x-week' | '3x-week' | 'custom';
  customDays?: number[];
  time: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  notes?: string;
}

export interface Cycle {
  id: string;
  peptideId: string;
  peptideName: string;
  dose: string;
  frequency: string;
  startDate: string;
  plannedDuration: number; // days
  breakDuration: number; // days
  status: 'active' | 'break' | 'completed';
  notes?: string;
  pauseReason?: 'missed_doses' | 'out_of_stock' | 'other';
  pausedAt?: string;   // ISO date when paused
  resumedAt?: string;  // ISO date when last resumed
  missedDays?: number;
  /** Sub-doses that together make one complete dose. Mirrors stack item. */
  splitParts?: number;
  /** HH:MM administration times. Length should equal splitParts for split doses. */
  doseTimes?: string[];
  /** Whether computed push reminders are enabled for this cycle. */
  reminderEnabled?: boolean;
  /** Lead-time minutes before scheduled dose. */
  reminderLeadMinutes?: number;
  /** Cloud conflict-resolution timestamp; not customer-facing. */
  updatedAt?: string;
}

// Default empty profile for new members. Each user fills in their own data.
export const userProfile: UserProfile = {
  name: '',
  age: 0,
  gender: 'male',
  height: 0,
  weight: 0,
  activityLevel: 'moderate',
  experience: 'beginner',
  goals: [],
};

// New users start with no historical data. Body composition is added via the
// Body Composition modal (manual entry or scale sync).
export const bodyCompositionHistory: BodyComposition[] = [];

// New users start with an empty stack. They build their own via "My Stack".
export const activeStack: { peptideId: string; dose: string; frequency: string }[] = [];

// New users start with no active cycles. They start cycles from "My Stack".
export const activeCycles: Cycle[] = [];

// New users start with no scheduled doses. They add reminders themselves.
export const todaysDoses: DoseSchedule[] = [];

// Public news ticker — research updates shown to everyone.
export const newsItems = [
  'New study shows BPC-157 accelerates tendon healing by 40% in animal models',
  'Retatrutide Phase 3 trials show 24% body weight reduction at 48 weeks',
  'MOTS-c research reveals potential as exercise mimetic for metabolic health',
  'Epitalon study demonstrates telomere lengthening in human cell cultures',
  'SS-31 clinical trials for heart failure show promising mitochondrial benefits',
];

// Generic optimization tips shown on My Stack screen (only when user has a stack).
export const stackOptimizations = [
  {
    title: 'Add GHK-Cu for regeneration',
    description: 'Synergizes with BPC-157 and TB-500 for enhanced tissue repair and anti-aging benefits.',
    priority: 'high',
  },
  {
    title: 'Consider MOTS-c for metabolic optimization',
    description: 'Complements GLP-1 agonists for enhanced metabolic flexibility and endurance.',
    priority: 'medium',
  },
  {
    title: 'Time GH peptides with circadian rhythm',
    description: 'Pre-bed dosing of CJC/Ipamorelin aligns with natural growth hormone pulses.',
    priority: 'low',
  },
];
