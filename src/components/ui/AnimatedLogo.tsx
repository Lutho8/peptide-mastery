import horizontalLogo from '@/assets/logo-horizontal.png';
import iconLogo from '@/assets/logo-icon.png';
import { cn } from '@/lib/utils';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onClick?: () => void;
  className?: string;
}

const horizontalSizeMap = {
  sm: 'h-9 w-auto',
  md: 'h-11 w-auto',
  lg: 'h-16 w-auto',
};

const iconSizeMap = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-16 w-16',
};

/**
 * Approved Peptide South Africa brand lockup.
 *
 * `showText` selects between the supplied horizontal wordmark and supplied
 * compact brand mark. Neither asset is reconstructed, recoloured or animated,
 * so the logo remains identical across the public journey and signed-in app.
 */
export function AnimatedLogo({ size = 'md', showText = true, onClick, className }: AnimatedLogoProps) {
  const logo = (
    <img
      src={showText ? horizontalLogo : iconLogo}
      alt=""
      aria-hidden="true"
      className={cn(
        'block shrink-0 object-contain',
        showText ? horizontalSizeMap[size] : iconSizeMap[size],
      )}
      loading="eager"
      decoding="async"
    />
  );

  if (!onClick) {
    return (
      <div className={cn('inline-flex items-center', className)} aria-label="Peptide South Africa">
        {logo}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center rounded-lg transition-opacity hover:opacity-90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
      aria-label="Peptide South Africa — dashboard home"
    >
      {logo}
    </button>
  );
}
