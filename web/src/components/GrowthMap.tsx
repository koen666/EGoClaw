/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Target, Lightbulb, Camera, BookOpen, Brain, Zap } from 'lucide-react';

const NODES = [
  { id: '1', label: '表达力', icon: BookOpen, x: 200, y: 200, color: '#1A1A1A', size: 80 },
  { id: '2', label: '自我介绍', parentId: '1', x: 100, y: 100, color: '#2D4BF0', size: 60 },
  { id: '3', label: '演讲技巧', parentId: '1', x: 300, y: 120, color: '#2D4BF0', size: 60 },
  { id: '4', label: '摄影', icon: Camera, x: 500, y: 400, color: '#1A1A1A', size: 70 },
  { id: '5', label: '构图', parentId: '4', x: 600, y: 300, color: '#2D4BF0', size: 50 },
  { id: '6', label: 'AI工具', icon: Zap, x: 200, y: 500, color: '#1A1A1A', size: 75 },
  { id: '7', label: 'Gemini', parentId: '6', x: 350, y: 550, color: '#2D4BF0', size: 55 },
];

export default function GrowthMap({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-[60vh] overflow-hidden bg-[#EAE8E1]/30", className)}>
      <svg className="w-full h-full" viewBox="0 0 800 600">
        {/* Connection Lines */}
        {NODES.filter(n => n.parentId).map(node => {
          const parent = NODES.find(p => p.id === node.parentId);
          if (!parent) return null;
          return (
            <motion.line
              key={`line-${node.id}`}
              x1={parent.x}
              y1={parent.y}
              x2={node.x}
              y2={node.y}
              stroke={node.color}
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.2 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map((node) => {
          const Icon = node.icon || Lightbulb;
          return (
            <motion.g
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: 'spring', 
                stiffness: 260, 
                damping: 20,
                delay: Math.random() * 0.5 
              }}
              whileHover={{ scale: 1.1 }}
              className="cursor-pointer"
            >
              {/* Main Square/Circle for Editorial */}
              <rect
                x={node.x - node.size / 2}
                y={node.y - node.size / 2}
                width={node.size}
                height={node.size}
                fill={node.color}
                fillOpacity={node.id === '1' || node.id === '4' || node.id === '6' ? "1" : "0.05"}
                stroke={node.color}
                strokeWidth="1"
              />

              {/* Icon / Label Space */}
              <foreignObject
                x={node.x - node.size / 2}
                y={node.y - node.size / 2}
                width={node.size}
                height={node.size}
              >
                <div className={cn(
                  "w-full h-full flex flex-col items-center justify-center text-[10px] font-serif font-bold p-1 text-center leading-tight",
                  (node.id === '1' || node.id === '4' || node.id === '6') ? "text-white" : "text-[var(--color-editorial-ink)]"
                )}>
                  <Icon size={node.size / 3} className="mb-1" />
                  <span className="italic">{node.label}</span>
                </div>
              </foreignObject>
            </motion.g>
          );
        })}
      </svg>
      
      {/* Background Grid */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-5">
        <div className="w-full h-full border-[0.5px] border-[var(--color-editorial-ink)]" style={{ 
          backgroundImage: 'linear-gradient(to right, #1A1A1A 1px, transparent 1px), linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)',
          backgroundSize: '40px 40px' 
        }} />
      </div>
    </div>
  );
}
