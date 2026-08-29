import { ArrowLeft, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ConfessionsPanel } from '@/components/companion/ConfessionsPanel';
import { getAllSelectablePeptides } from '@/data/blendAdapters';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead } from '@/components/seo/SEOHead';

const compounds = getAllSelectablePeptides();

export default function ConfessionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Peptide Confessions | Free Community Experiences"
        description="Read moderated peptide experiences for free or sign in to share an anonymous confession. Community stories are experiences, not medical advice."
        canonical="https://peptide-south-africa.co.za/confessions"
        keywords="peptide experiences South Africa, peptide community, peptide confessions, peptide tracker journal"
      />
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/')}><ArrowLeft className="mr-2 h-4 w-4" />Peptide South Africa</Button>
          <Button type="button" size="sm" onClick={() => navigate(user ? '/dashboard?screen=measurement&tool=confessions' : '/dashboard')}>{user ? 'Open dashboard' : <><LogIn className="mr-2 h-4 w-4" />Sign in to post</>}</Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-3 py-5 pb-16 sm:px-4 sm:py-8">
        <ConfessionsPanel compounds={compounds} publicView onSignIn={() => navigate('/dashboard')} />
      </main>
    </div>
  );
}
