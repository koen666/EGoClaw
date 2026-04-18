/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface LingbaoProps {
  status?: 'idle' | 'happy' | 'thinking' | 'excited';
  className?: string;
  onClick?: () => void;
}

export default function Lingbao({ status = 'idle', className, onClick }: LingbaoProps) {
  const flameVariants = {
    idle: {
      scale: [1, 1.05, 1],
      rotate: [0, -2, 2, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    happy: {
        scale: [1, 1.2, 1],
        rotate: [0, -5, 5, 0],
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
    },
    thinking: {
        scale: [1, 0.95, 1],
        opacity: [0.8, 1, 0.8],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    excited: {
        scale: [1, 1.3, 1],
        y: [0, -20, 0],
        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
    }
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)} onClick={onClick}>
      {/* Glow Effect */}
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3] 
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute w-32 h-32 rounded-full bg-fire-glow blur-3xl"
      />

      {/* Main Body (The Fire) */}
      <motion.div
        variants={flameVariants}
        animate={status}
        className="relative w-24 h-32 flex flex-col items-center mix-blend-multiply opacity-90"
      >
        {/* Flame Shapes */}
        <div className="absolute bottom-0 w-20 h-24 bg-gradient-to-t from-fire-glow to-fire-core rounded-full blur-[2px]" 
             style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }} 
        />
        <div className="absolute bottom-4 w-12 h-16 bg-white/40 rounded-full blur-[8px]" />
        
        {/* Eyes */}
        <div className="absolute top-1/2 -mt-4 flex gap-4 z-10">
          <motion.div 
            animate={status === 'thinking' ? { height: 2 } : { height: 8 }}
            className="w-2 bg-black rounded-full" 
          />
          <motion.div 
            animate={status === 'thinking' ? { height: 2 } : { height: 8 }}
            className="w-2 bg-black rounded-full" 
          />
        </div>

        {/* Small Flame Tip */}
        <motion.div 
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -top-4 w-6 h-8 bg-fire-core rounded-full blur-[1px]" 
        />
      </motion.div>
    </div>
  );
}
