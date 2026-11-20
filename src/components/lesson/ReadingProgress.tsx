"use client";
import { motion, useScroll, useSpring } from "motion/react";

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return <motion.div className="fixed top-0 right-0 left-0 z-50 h-1 origin-left bg-sun-500" style={{ scaleX: x }} />;
}
