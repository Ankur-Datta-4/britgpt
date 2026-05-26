"use client";

type LogoSize = "sm" | "md" | "lg";

type BritanniaLogoProps = {
  className?: string;
  size?: LogoSize;
  /** Square shield mark for navbar; wordmark for welcome / wide layouts */
  variant?: "wordmark" | "square";
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

const britanniaSquareHeights: Record<LogoSize, number> = {
  sm: 34,
  md: 40,
  lg: 48,
};

const consumaHeights: Record<LogoSize, number> = {
  sm: 22,
  md: 28,
  lg: 32,
};

/** Britannia logo — square mark (navbar) or horizontal wordmark (welcome). */
export const BritanniaLogo = ({
  className = "",
  size = "md",
  variant = "wordmark",
}: BritanniaLogoProps) => {
  const isSquare = variant === "square";
  const height = isSquare ? britanniaSquareHeights[size] : britanniaHeights[size];

  return (
    <img
      src={isSquare ? "/logos/britannia-square.png" : "/logos/britannia.svg"}
      alt="Britannia"
      width={isSquare ? height : undefined}
      height={height}
      className={`britannia-logo britannia-logo--${size}${isSquare ? " britannia-logo--square" : ""} ${className}`.trim()}
      draggable={false}
    />
  );
};

export const ConsumaLogo = ({ className = "", size = "md" }: ConsumaLogoProps) => (
  <img
    src="/logos/consuma.png"
    alt="consuma"
    height={consumaHeights[size]}
    className={`consuma-logo consuma-logo--${size} ${className}`.trim()}
    draggable={false}
  />
);
