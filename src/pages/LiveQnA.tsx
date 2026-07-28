import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Calendar, Users, Clock, CheckCircle2, ArrowLeft, Shield, Zap, BookOpen, Sparkles, Mail, Bell, CalendarPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useMembership } from '@/hooks/useMembership';
import { useAuth } from '@/contexts/AuthContext';
import { captureLead } from '@/lib/crm';
import { SEOHead } from '@/components/seo/SEOHead';
import { JsonLd } from '@/components/seo/JsonLd';

const COUNTRY_CODES = [
  { code: '+1', label: 'US (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+27', label: 'South Africa (+27)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+34', label: 'Spain (+34)' },
  { code: '+39', label: 'Italy (+39)' },
  { code: '+31', label: 'Netherlands (+31)' },
  { code: '+46', label: 'Sweden (+46)' },
  { code: '+47', label: 'Norway (+47)' },
  { code: '+48', label: 'Poland (+48)' },
  { code: '+55', label: 'Brazil (+55)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+82', label: 'South Korea (+82)' },
  { code: '+86', label: 'China (+86)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+90', label: 'Turkey (+90)' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Complete Beginner - Just getting started' },
  { value: 'some_research', label: 'Some Research Done - Looking for guidance' },
  { value: 'currently_using', label: 'Currently Using Peptides - Need optimization' },
  { value: 'experienced', label: 'Experienced User - Advanced questions' },
];

const TOPICS = [
  'Beginner Peptide Basics',
  'Dosage & Administration',
  'Stack Building',
  'Cycle Planning',
  'Reconstitution',
  'Safety & Side Effects',
  'Body Composition',
  'Anti-Aging Protocols',
];

function getNextSessionDate() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  while (next.getDay() !== 6) next.setDate(next.getDate() + 1);
  return next;
}

function getSessionMonth() {
  const d = getNextSessionDate();
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export default function LiveQnA() {
  const { toast } = useToast();
  const { hasPremium, isLoading: membershipLoading } = useMembership();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whatsappCountryCode: '+49',
    whatsappNumber: '',
    experienceLevel: 'beginner',
    topics: [] as string[],
    consent: false,
    premiumInterest: false,
  });

  const sessionDate = getNextSessionDate();
  const sessionMonth = getSessionMonth();

  const handleTopicToggle = (topic: string) => {
    setForm(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.consent) {
      toast({ title: 'Please fill all required fields', description: 'All fields marked with * are required, including consent.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('qna_registrations').insert({
        full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.slice(0, 100),
        first_name: form.firstName.trim().slice(0, 50),
        last_name: form.lastName.trim().slice(0, 50),
        email: form.email.trim().toLowerCase().slice(0, 255),
        whatsapp_country_code: form.whatsappCountryCode,
        whatsapp_number: form.whatsappNumber.trim().replace(/\D/g, '').slice(0, 15) || null,
        phone: form.whatsappNumber.trim() ? `${form.whatsappCountryCode}${form.whatsappNumber.trim().replace(/\D/g, '')}` : null,
        experience_level: form.experienceLevel,
        topics_of_interest: form.topics,
        session_month: sessionMonth,
        email_consent: form.consent,
        whatsapp_consent: form.consent && !!form.whatsappNumber.trim(),
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Already registered!', description: `You're already signed up for ${sessionMonth}.`, variant: 'default' });
          setRegistered(true);
        } else {
          throw error;
        }
      } else {
        setRegistered(true);
        const normalizedEmail = form.email.trim().toLowerCase();
        const normalizedPhone = form.whatsappNumber.trim()
          ? `${form.whatsappCountryCode}${form.whatsappNumber.trim().replace(/\D/g, '')}`
          : undefined;
        const planInterest = form.premiumInterest ? 'premium' : 'undecided';
        const baseLead = {
          email: normalizedEmail,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: normalizedPhone,
          planInterest,
          activityData: {
            session_month: sessionMonth,
            experience_level: form.experienceLevel,
            premium_interest: form.premiumInterest,
          },
        } as const;
        // Funnel signal — Q&A signup intent (+15 score)
        captureLead({
          ...baseLead,
          source: 'qa_signup',
          activityType: 'qa_signup',
        });
        // Conversion signal — confirmed registration (+40 score)
        captureLead({
          ...baseLead,
          source: 'live_qna_registration',
          activityType: 'consultation_booked',
        });
        toast({ title: 'Registration confirmed! 🎉', description: `You're in for the ${sessionMonth} Live Q&A. Check your email for details.` });
      }
    } catch {
      toast({ title: 'Registration failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    captureLead({
      email: user?.email ?? null,
      source: 'live_qna_premium_gate',
      planInterest: 'premium',
      activityType: 'premium_click',
      activityData: { surface: 'live_qna_page' },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Live Peptide Q&A — Monthly Expert Sessions | Peptide South Africa"
        description="Free monthly live peptide research Q&A. Ask experts about dosing, stacks, cycles, and bloodwork. First Saturday of every month."
        canonical="https://peptide-south-africa.co.za/live-qna"
      />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Peptide South Africa Live Peptide Q&A',
        description: 'Free monthly live Q&A on peptide research, dosing, stacks, cycles, and bloodwork interpretation.',
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        url: 'https://peptide-south-africa.co.za/live-qna',
        organizer: { '@type': 'Organization', name: 'Peptide South Africa', url: 'https://peptide-south-africa.co.za' },
        location: { '@type': 'VirtualLocation', url: 'https://peptide-south-africa.co.za/live-qna' },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: 'https://peptide-south-africa.co.za/live-qna' },
      }} />
      {/* Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Live Q&A Sessions</h1>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/10" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 text-sm px-4 py-1">
                <Sparkles className="w-4 h-4 mr-2" /> Free · Monthly Live on Zoom
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-flow">
                  Monthly Peptide Q&A
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
                Free monthly group consultation for registered researchers. Ask anything about peptides — from beginner basics to advanced stacking protocols.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-accent" /> {sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-accent" /> 7:00 PM CET</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4 text-accent" /> Limited Spots</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits + Form */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Benefits */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">What You'll Get</h2>
            {[
              { icon: BookOpen, title: 'Expert Guidance', desc: 'Personalized answers on dosage, reconstitution, and administration.' },
              { icon: Zap, title: 'Stack & Cycle Reviews', desc: 'Get your current or planned protocol reviewed live.' },
              { icon: Shield, title: 'Safety First', desc: 'Learn about side effects, interactions, and harm reduction.' },
              { icon: Users, title: 'Community Learning', desc: 'Benefit from other attendees\' questions and experiences.' },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}

            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Next Session:</strong> {sessionMonth} — First Saturday at 7:00 PM CET via Zoom. A link will be emailed to all registrants 24 hours before the session.
                </p>
              </CardContent>
            </Card>

            {/* Topics of Interest */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Topics Covered</h3>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(topic => (
                  <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Registration Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            {registered ? (
              <Card className="border-accent/50 bg-accent/5 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
                <CardContent className="p-7 space-y-6">
                  {/* Header */}
                  <div className="text-center space-y-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="mx-auto w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-9 h-9 text-accent" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-foreground">
                      You're confirmed for the {sessionMonth} Live Q&amp;A
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Saved to <strong className="text-foreground">{form.email.trim().toLowerCase()}</strong>. Here's what to expect next.
                    </p>
                  </div>

                  {/* What happens next */}
                  <div className="space-y-3">
                    {[
                      {
                        icon: Mail,
                        when: 'Right now',
                        what: `A confirmation email is on its way. If you don't see it within 5 minutes, check your spam folder.`,
                      },
                      {
                        icon: Bell,
                        when: 'Day before',
                        what: form.whatsappNumber.trim()
                          ? 'Zoom link, calendar invite, and a WhatsApp reminder.'
                          : 'Zoom link and a calendar invite straight to your inbox.',
                      },
                      {
                        icon: Video,
                        when: `${sessionDate.toLocaleDateString('en-US', { weekday: 'long' })} 7:00 PM CET`,
                        what: 'We go live on Zoom. Bring your protocol questions — no question is too basic.',
                      },
                    ].map((step, i) => (
                      <motion.div
                        key={step.when}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.1 }}
                        className="flex gap-3 p-3 rounded-lg bg-card/60 border border-border/40"
                      >
                        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <step.icon className="w-4 h-4 text-accent" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-accent uppercase tracking-wide">{step.when}</p>
                          <p className="text-sm text-foreground/90 mt-0.5">{step.what}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {form.premiumInterest && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        We'll also send research peptide updates from peptide-south-africa.com separately.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => {
                        const dt = (d: Date) =>
                          d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                        const start = new Date(sessionDate);
                        start.setHours(18, 0, 0, 0); // 7 PM CET ≈ 18:00 UTC (winter); good enough for ICS hint
                        const end = new Date(start.getTime() + 60 * 60 * 1000);
                        const ics = [
                          'BEGIN:VCALENDAR',
                          'VERSION:2.0',
                          'PRODID:-//Peptide South Africa//Live Q&A//EN',
                          'BEGIN:VEVENT',
                          `UID:psa-qna-${start.getTime()}@peptide-south-africa.co.za`,
                          `DTSTAMP:${dt(new Date())}`,
                          `DTSTART:${dt(start)}`,
                          `DTEND:${dt(end)}`,
                          `SUMMARY:Peptide South Africa — ${sessionMonth} Live Peptide Q&A`,
                          'DESCRIPTION:Zoom link will be emailed 24 hours before the session.',
                          'LOCATION:Zoom (link sent by email)',
                          'END:VEVENT',
                          'END:VCALENDAR',
                        ].join('\r\n');
                        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `peptide-south-africa-qna-${sessionMonth.replace(/\s+/g, '-').toLowerCase()}.ics`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <CalendarPlus className="w-4 h-4 mr-2" />
                      Add to calendar
                    </Button>
                    <a
                      href="https://peptide-south-africa.com?utm_source=tracker&utm_medium=live_qna&utm_campaign=buy_peptides"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="btn-sparkle w-full">
                        Buy Peptides
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/30 shadow-lg">
                <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary rounded-t-lg" />
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-1">Reserve Your Free Spot</h3>
                  <p className="text-sm text-muted-foreground mb-6">Free for registered researchers · {sessionMonth} Session · Via Zoom</p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                      <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                      <Input id="email" type="email" required maxLength={255} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
                    </div>

                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                        <Input id="firstName" required maxLength={50} value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="First name" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                        <Input id="lastName" required maxLength={50} value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Last name" />
                      </div>
                    </div>

                    {/* WhatsApp Number */}
                    <div>
                      <Label>WhatsApp Number <span className="text-destructive">*</span></Label>
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <Select value={form.whatsappCountryCode} onValueChange={v => setForm(p => ({ ...p, whatsappCountryCode: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {COUNTRY_CODES.map(cc => (
                              <SelectItem key={cc.code} value={cc.code}>{cc.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input type="tel" maxLength={15} value={form.whatsappNumber} onChange={e => setForm(p => ({ ...p, whatsappNumber: e.target.value }))} placeholder="15776292139" />
                      </div>
                    </div>

                    {/* Experience Level */}
                    <div>
                      <Label>👉 Choose the option below that best describes you 👈 <span className="text-destructive">*</span></Label>
                      <Select value={form.experienceLevel} onValueChange={v => setForm(p => ({ ...p, experienceLevel: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Consent */}
                    <div className="border border-border rounded-lg p-4 bg-muted/30">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={form.consent}
                          onCheckedChange={(checked) => setForm(p => ({ ...p, consent: checked === true }))}
                          className="mt-0.5"
                        />
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          I consent to receiving communications from Peptide South Africa regarding the Q&A session I registered for, as well as additional updates via email and WhatsApp. I understand that my personal data will be processed and shared with Zoom to facilitate the webinar. I may withdraw my consent at any time with future effect by using the unsubscribe link in the communications. <span className="text-destructive">*</span>
                        </span>
                      </label>
                      <Link to="/privacy" className="text-xs text-primary hover:underline mt-2 block">
                        Click here to know how we use and protect your data.
                      </Link>
                    </div>

                    {/* Premium interest */}
                    <div className="border border-accent/30 rounded-lg p-4 bg-accent/5">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={form.premiumInterest}
                          onCheckedChange={(checked) => setForm(p => ({ ...p, premiumInterest: checked === true }))}
                          className="mt-0.5"
                        />
                        <span className="text-sm text-foreground leading-relaxed flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-accent shrink-0" />
                          I'd like updates on research peptides from peptide-south-africa.com.
                        </span>
                      </label>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg" 
                      disabled={loading || !form.consent}
                    >
                      {loading ? 'Registering...' : 'SUBMIT'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
