"use client";

type LogoSize = "sm" | "md" | "lg";

type BritanniaLogoProps = {
  className?: string;
  size?: LogoSize;
};

type ConsumaLogoProps = {
  className?: string;
  size?: LogoSize;
};

const britanniaHeights: Record<LogoSize, number> = {
  sm: 32,
  md: 40,
  lg: 52,
};

const consumaHeights: Record<LogoSize, number> = {
  sm: 22,
  md: 28,
  lg: 32,
};

/** Official Britannia Industries wordmark (Wikimedia Commons). */
export const BritanniaLogo = ({ className = "", size = "md" }: BritanniaLogoProps) => (
  <img
    src="/logos/britannia.svg"
    alt="Britannia"
    height={britanniaHeights[size]}
    className={`britannia-logo britannia-logo--${size} ${className}`.trim()}
    draggable={false}
  />
);

export const ConsumaLogo = ({ className = "", size = "md" }: ConsumaLogoProps) => (
  <img
    src="/logos/consuma.png"
    alt="consuma"
    height={consumaHeights[size]}
    className={`consuma-logo consuma-logo--${size} ${className}`.trim()}
    draggable={false}
  />
);
