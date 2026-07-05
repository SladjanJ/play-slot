import { cn } from "@/lib/utils";

type PlaySlotLogoProps = {
  className?: string;
  size?: number;
};

export function PlaySlotLogo({ className, size = 40 }: PlaySlotLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("shrink-0 drop-shadow-md", className)}
    >
      <defs>
        <radialGradient id="ball-shine" cx="35%" cy="28%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#f4f4f5" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#d4d4d8" stopOpacity="1" />
        </radialGradient>
        <linearGradient id="ball-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <filter id="ball-drop" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
        </filter>
      </defs>

      <circle
        cx="32"
        cy="34"
        r="26"
        fill="url(#ball-shine)"
        filter="url(#ball-drop)"
      />

      <g fill="url(#ball-shadow)" opacity="0.88">
        <path d="M32 12 L38 22 L32 28 L26 22 Z" />
        <path d="M18 24 L28 28 L26 36 L16 32 Z" />
        <path d="M46 24 L48 32 L38 36 L36 28 Z" />
        <path d="M22 44 L32 48 L30 56 L20 52 Z" />
        <path d="M42 44 L44 52 L34 56 L32 48 Z" />
        <path d="M32 34 L38 40 L32 46 L26 40 Z" />
      </g>

      <ellipse
        cx="24"
        cy="22"
        rx="8"
        ry="5"
        fill="#ffffff"
        opacity="0.35"
      />
    </svg>
  );
}
