import type React from "react"

interface AuroraOverlayProps {
  animationSpeed?: number
}

/**
 * Aurora overlay — drop inside any `position: relative` container.
 * Colors tuned to the Cyber-Noir red accent (#e60039).
 */
export function AuroraOverlay({ animationSpeed = 20 }: AuroraOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -inset-[10px] blur-[60px] opacity-60 [animation:aurora_var(--speed)_linear_infinite] [background-image:var(--aurora)] [background-size:200%_200%] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_40%,transparent_100%)]"
        style={
          {
            "--aurora":
              "radial-gradient(ellipse at 20% 0%, #e60039 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, #ff1a54 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, #8c0024 0%, transparent 60%)",
            "--speed": `${animationSpeed}s`,
          } as React.CSSProperties
        }
      />
    </div>
  )
}
