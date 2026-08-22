import { useEffect, useMemo, useState } from 'react';
import { Apple, ArrowRight, Check, Copy, Download, MoreVertical, Plus, Share2, ShieldCheck, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { chromeIntentUrl, detectPlatform, getInstallCtaState, isStandalone, type Platform } from '@/lib/pwaInstall';
import { track } from '@/lib/analytics';
import { markStep } from '@/lib/onboardingProgress';
import { InstallDeviceMockup } from '@/components/pwa/InstallDeviceMockup';

type Device = 'ios' | 'android';

const IOS_STEPS = [
  { icon: Share2, title: 'Tap Share', body: 'Use Safari’s Share button in the toolbar.' },
  { icon: Plus, title: 'Add to Home Screen', body: 'Scroll to “Add to Home Screen”.' },
  { icon: Check, title: 'Tap Add', body: 'The tracker appears with your other apps.' },
];

const ANDROID_STEPS = [
  { icon: MoreVertical, title: 'Open Chrome’s menu', body: 'Tap the three dots in the top-right.' },
  { icon: Download, title: 'Choose Install app', body: '“Add to Home screen” works too.' },
  { icon: Check, title: 'Confirm Install', body: 'Open it from your Home Screen.' },
];

function deviceFromPlatform(platform: Platform): Device {
  return platform.startsWith('android') ? 'android' : 'ios';
}

export function PWAInstallJourney() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [device, setDevice] = useState<Device>('ios');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);
    setDevice(deviceFromPlatform(detected));
    track('install_platform_detected', {
      platform: detected,
      isInstallable,
      isStandalone: isStandalone(),
      surface: 'install-guide',
    });
    markStep('install_viewed');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cta = useMemo(
    () => getInstallCtaState({ isInstallable, isInstalled, platform }),
    [isInstallable, isInstalled, platform],
  );
  const steps = device === 'ios' ? IOS_STEPS : ANDROID_STEPS;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://peptide-south-africa.co.za/install');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      track('install_link_copied', { platform, surface: 'install-guide' });
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="install-app" className="relative overflow-hidden border-y border-border/70 bg-background py-14 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--accent)/0.12),transparent_35%),radial-gradient(circle_at_85%_80%,hsl(var(--primary)/0.10),transparent_35%)]" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-secondary px-3 py-1 text-xs font-semibold text-primary">
              <Smartphone className="h-3.5 w-3.5 text-accent" />
              Install the tracker
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Put Peptide South Africa on your Home Screen.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              No store account or download file. Follow three steps and the tracker opens full-screen like an app.
            </p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            <div>
              <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-sm" role="tablist" aria-label="Choose your phone">
                {(['ios', 'android'] as Device[]).map((choice) => {
                  const active = device === choice;
                  return (
                    <button
                      key={choice}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setDevice(choice);
                        track('install_tab_switched', { to: choice, surface: 'install-guide' });
                      }}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-primary'}`}
                    >
                      {choice === 'ios' ? <Apple className="h-4 w-4" /> : <span className="text-sm">▶</span>}
                      {choice === 'ios' ? 'iPhone & iPad' : 'Android'}
                    </button>
                  );
                })}
              </div>

              {platform === 'ios-non-safari' && device === 'ios' && (
                <div className="mt-5 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
                  <p className="font-semibold text-foreground">Open this page in Safari first.</p>
                  <p className="mt-1 text-muted-foreground">iPhone and iPad add web apps from Safari’s Share menu.</p>
                  <Button variant="outline" size="sm" className="mt-3 min-h-11 gap-2" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Link copied' : 'Copy install link'}
                  </Button>
                </div>
              )}

              {platform === 'android-other' && device === 'android' && (
                <div className="mt-5 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
                  <p className="font-semibold text-foreground">Chrome gives the clearest install flow.</p>
                  <a href={chromeIntentUrl('https://peptide-south-africa.co.za/install')} className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-primary">
                    Open in Chrome <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}

              <ol className="mt-6 grid gap-3 sm:grid-cols-3">
                {steps.map(({ icon: Icon, title, body }, index) => (
                  <li key={title} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-accent">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">0{index + 1}</span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {cta.kind === 'native-prompt' && device === 'android' ? (
                  <Button size="lg" className="min-h-12 gap-2" onClick={() => install('install-guide')}>
                    <Download className="h-4 w-4" /> Install Peptide SA
                  </Button>
                ) : cta.kind === 'installed' ? (
                  <a href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
                    <Check className="h-4 w-4" /> Open tracker
                  </a>
                ) : (
                  <Button size="lg" variant="outline" className="min-h-12 gap-2" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Install link copied' : 'Send this link to your phone'}
                  </Button>
                )}
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-accent" /> Same secure account and data sync
                </span>
              </div>
            </div>

            <InstallDeviceMockup device={device} />
          </div>
        </div>
      </div>
    </section>
  );
}
