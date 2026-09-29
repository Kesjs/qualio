"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  blur?: boolean;
  yOffset?: number;
  xOffset?: number;
  className?: string;
  width?: "fit-content" | "100%";
}

export function Reveal({
  children,
  delay = 0,
  duration = 0.5,
  direction = "up",
  blur = true,
  yOffset = 24,
  xOffset = 24,
  className,
  width = "100%",
}: RevealProps) {
  const directions = {
    up: { y: yOffset, x: 0 },
    down: { y: -yOffset, x: 0 },
    left: { x: xOffset, y: 0 },
    right: { x: -xOffset, y: 0 },
    none: { x: 0, y: 0 },
  };

  return (
    <div style={{ position: "relative", width }} className={className}>
      <motion.div
        initial={{
          opacity: 0,
          ...directions[direction],
          filter: blur ? "blur(4px)" : "none",
        }}
        whileInView={{
          opacity: 1,
          y: 0,
          x: 0,
          filter: "blur(0px)",
        }}
        viewport={{ once: true, margin: "0px" }}
        transition={{
          duration: Math.min(duration, 0.4),
          delay,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function RevealGroup({
  children,
  className,
  stagger = 0.1,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  direction = "up",
  blur = true,
  yOffset = 24,
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "none";
  blur?: boolean;
  yOffset?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          y: direction === "up" ? yOffset : 0,
          filter: blur ? "blur(8px)" : "none",
        },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
