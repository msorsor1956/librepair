import { motion } from "framer-motion";

interface AnimatedLogoProps {
  size?: number;
  /** show the spinning gear ring halo effect */
  showGlow?: boolean;
  className?: string;
}

/**
 * Animated LIBrepair logo:
 * - Scale + fade entrance
 * - Continuous slow "breathing" scale pulse
 * - Red radial glow that pulses in sync
 * - Decorative rotating ring of dots around the logo
 */
export function AnimatedLogo({ size = 320, showGlow = true, className = "" }: AnimatedLogoProps) {
  const dotCount = 12;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer rotating ring of dots */}
      {showGlow && (
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: dotCount }).map((_, i) => {
            const angle = (i / dotCount) * 2 * Math.PI;
            const radius = size * 0.46;
            const x = Math.cos(angle) * radius + size / 2;
            const y = Math.sin(angle) * radius + size / 2;
            const isLarge = i % 3 === 0;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: isLarge ? 8 : 4,
                  height: isLarge ? 8 : 4,
                  left: x - (isLarge ? 4 : 2),
                  top: y - (isLarge ? 4 : 2),
                  backgroundColor: isLarge ? "#e02020" : "rgba(224,32,32,0.4)",
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: (i / dotCount) * 2,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </motion.div>
      )}

      {/* Counter-rotating inner ring (slower) */}
      {showGlow && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size * 0.82,
            height: size * 0.82,
            border: "1.5px dashed rgba(224,32,32,0.25)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Red glow blob behind logo */}
      {showGlow && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size * 0.65,
            height: size * 0.65,
            background: "radial-gradient(circle, rgba(224,32,32,0.22) 0%, transparent 70%)",
            filter: "blur(16px)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Logo image — entrance + breathing pulse */}
      <motion.img
        src="/logo1.png"
        alt="LIBrepair"
        style={{ width: size * 0.7, height: size * 0.7, objectFit: "contain", position: "relative", zIndex: 10 }}
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: [1, 1.04, 1], y: 0 }}
        transition={{
          opacity: { duration: 0.6 },
          y: { duration: 0.6 },
          scale: {
            delay: 0.6,
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />
    </div>
  );
}
