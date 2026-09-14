"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils/cn";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
};

export function Reveal({ children, className }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={
        shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }
      }
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
