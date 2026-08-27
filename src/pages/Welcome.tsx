import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedLogo } from "@/components/ui/AnimatedLogo";
import { useAuth } from "@/contexts/AuthContext";
import { DASHBOARD_PATH } from "@/lib/authRedirect";
import { getStoreCategoryHref } from "@/lib/storeLinks";
import { recordStoreCtaClick } from "@/lib/storeCta";

const SHOP_URL = getStoreCategoryHref('all', 'welcome');

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate(DASHBOARD_PATH, { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-[hsl(222_47%_11%)] via-background to-[hsl(217_33%_17%)] flex items-center justify-center px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl mx-auto text-center"
      >
        <div className="mb-6 sm:mb-8 flex justify-center">
          <AnimatedLogo size="lg" showText={false} />
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] text-balance">
          Track Your Protocol.{" "}
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-flow">
            See What's Actually Working.
          </span>
        </h1>

        <p className="mt-5 sm:mt-6 mx-auto max-w-xl text-sm sm:text-lg text-muted-foreground leading-relaxed text-pretty">
          The only free peptide tracker built for South African researchers. Dose logging,
          bloodwork integration, monthly expert Q&amp;As.{" "}
          <span className="text-foreground font-semibold">No paywalls. Ever.</span>
        </p>

        <div className="mt-8 sm:mt-10 mx-auto flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:items-center sm:gap-4">
          <Link to={DASHBOARD_PATH} className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-base font-bold gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] transition-all ring-2 ring-primary/20"
            >
              Sign In / Start Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <a
            href={SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
            onClick={() => recordStoreCtaClick({ placement: 'welcome', destination: SHOP_URL })}
          >
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-14 px-8 text-base gap-2 border-primary/30 hover:border-primary/60"
            >
              <ShoppingBag className="w-4 h-4" />
              Buy Peptides
            </Button>
          </a>
        </div>

        <p className="mt-8 sm:mt-10 text-xs text-muted-foreground">
          Built in Cape Town 🇿🇦 · For research use only · Not FDA approved.
        </p>
      </motion.div>
    </div>
  );
}
