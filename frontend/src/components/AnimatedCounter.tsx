'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export default function AnimatedCounter({ value, duration = 2 }: { value: number, duration?: number }) {
  const [mounted, setMounted] = useState(false);
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    setMounted(true);
    spring.set(value);
  }, [value, spring]);

  if (!mounted) {
    return <span>{value}</span>;
  }

  return <motion.span>{display}</motion.span>;
}
