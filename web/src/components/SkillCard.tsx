/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Play, ClipboardList, Timer, ArrowRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface SkillCardProps {
  title: string;
  category: string;
  duration: string;
  steps: number;
  color: string;
}

export default function SkillCard({ title, category, duration, steps, color }: SkillCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="editorial-card p-6 flex flex-col gap-4 group transition-all"
    >
      <div className="flex justify-between items-start">
        <span className="meta-label mb-0">
          {category}
        </span>
        <div className="flex items-center gap-1 text-[var(--color-editorial-ink)]/40 text-[10px] font-mono">
          <Timer size={12} />
          <span>{duration}</span>
        </div>
      </div>

      <h3 className="text-xl font-serif font-bold italic line-height-tight text-[var(--color-editorial-ink)]">
        {title}
      </h3>

      <div className="flex items-center gap-2 text-[var(--color-editorial-ink)]/60 text-[10px] font-bold uppercase tracking-wider">
        <ClipboardList size={12} />
        <span>{steps} Actionable Steps</span>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-[var(--color-editorial-line)] pt-4">
        <div className="flex -space-x-1">
           {[1,2,3].map(i => (
             <div key={i} className="w-6 h-6 rounded-sm border border-[var(--color-editorial-bg)] bg-[var(--color-editorial-ink)]/10" />
           ))}
        </div>
        <button className="text-[var(--color-editorial-accent)] font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
          Details <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}
