import { type SVGProps } from "react";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Custom geometric "S" logo for SLATZ — replaces the generic Lucide Zap icon
 * with a high-tech sharp cyberpunk brand mark.
 */
export function LogoIcon({ size = 16, className, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M19 4 H8 L5 8 V11 L8 13 H16 L19 15 V18 L16 20 H5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
