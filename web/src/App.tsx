/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Search, Sparkles, ChevronRight, Bookmark, ArrowRight, Plus } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Components
import Lingbao from '@/src/components/Lingbao';
import GrowthMap from '@/src/components/GrowthMap';
import SkillCard from '@/src/components/SkillCard';
import Navigation from '@/src/components/Navigation';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [lingbaoStatus, setLingbaoStatus] = useState<'idle' | 'happy' | 'thinking' | 'excited'>('idle');
  const [messages, setMessages] = useState<string[]>([
    "Welcome back.",
    "The 'Self-Introduction' concept from your archive is ready for high-fidelity realization. Shall we begin?"
  ]);

  // Simulate Lingbao reactions
  useEffect(() => {
    const timer = setTimeout(() => setLingbaoStatus('happy'), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen pb-32 selection:bg-[var(--color-editorial-accent)] selection:text-white">
      {/* Header */}
      <header className="px-10 py-8 flex justify-between items-center sticky top-0 z-40 bg-[var(--color-editorial-bg)]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-serif font-bold italic tracking-tighter">
            EGoclaw.
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-8 text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--color-editorial-ink)]/40">
            <span>Archive</span>
            <span>Manifesto</span>
          </div>
          <button className="relative p-2 rounded-full hover:bg-black/5 transition-colors">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[var(--color-editorial-accent)] rounded-full" />
          </button>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="max-w-4xl mx-auto px-10">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-16 py-12"
            >
              <div className="flex flex-col justify-center">
                <span className="meta-label">Lingbao / Volume 01</span>
                <h1 className="text-[72px] font-serif font-normal leading-[0.9] tracking-[-0.04em] mb-8">
                  Transforming <span className="italic">Thoughts</span> into Form.
                </h1>
                <p className="text-lg leading-relaxed text-[var(--color-editorial-ink)]/70 mb-12 max-w-sm">
                  {messages[1]}
                </p>
                <div className="flex gap-4">
                  <button className="px-8 py-4 bg-[var(--color-editorial-ink)] text-white font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-[var(--color-editorial-accent)] transition-all">
                    Initialize Project
                  </button>
                  <button className="px-8 py-4 border border-[var(--color-editorial-line)] font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-black/5 transition-all">
                    Archive
                  </button>
                </div>
              </div>

              <div className="relative aspect-square flex items-center justify-center bg-[#EAE8E1] rounded-sm overflow-hidden">
                <Lingbao 
                  status={lingbaoStatus} 
                  className="scale-125 cursor-pointer" 
                  onClick={() => setLingbaoStatus('excited')}
                />
                <div className="absolute bottom-6 right-8 font-mono text-[9px] opacity-20 tracking-widest">
                  CONCEPT_MODEL_01
                </div>
                {/* Visual Accent */}
                <div className="absolute top-10 left-10 w-20 h-0.5 bg-[var(--color-editorial-line)]" />
                <div className="absolute top-10 left-10 w-0.5 h-20 bg-[var(--color-editorial-line)]" />
              </div>

              {/* Stats Bar */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-[var(--color-editorial-line)] py-10 mt-12">
                 <div className="flex flex-col gap-1">
                   <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-black/30 text-fire-glow animate-pulse">Live Tracking</span>
                   <span className="text-xl font-serif font-bold italic underline decoration-[var(--color-editorial-line)] underline-offset-4">Public Speaking</span>
                 </div>
                 <div className="flex flex-col gap-1">
                   <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-black/30">Active Skills</span>
                   <span className="text-xl font-serif font-bold">12 Mastery Nodes</span>
                 </div>
                 <div className="flex flex-col gap-1">
                   <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-black/30">Sync Status</span>
                   <span className="text-xl font-serif font-bold">Encrypted / Stable</span>
                 </div>
                 <div className="flex flex-col gap-1">
                   <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-black/30">Archive Date</span>
                   <span className="text-xl font-serif font-bold">18.04.26</span>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'map' && (
             <motion.div
               key="map"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="py-12"
             >
               <div className="flex justify-between items-end mb-12">
                 <div>
                   <span className="meta-label">Structural Mapping</span>
                   <h2 className="text-6xl font-serif font-normal leading-tight tracking-tight">Cartography.</h2>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Growth Index</p>
                    <p className="text-2xl font-serif font-bold tracking-tighter">7 / 12 Nodes</p>
                 </div>
               </div>
               
               <div className="editorial-card p-2">
                  <GrowthMap />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                 <div className="editorial-card p-10 flex flex-col gap-4 group">
                    <Sparkles className="text-[var(--color-editorial-accent)] mb-2" size={32} />
                    <h3 className="text-2xl font-serif italic font-bold">Recent Detection</h3>
                    <p className="text-sm text-[var(--color-editorial-ink)]/60 leading-relaxed italic">
                      "I've identified a recurring pattern in your AI-related collection. A new node is emerging: generative topology."
                    </p>
                    <button className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-[var(--color-editorial-accent)] group-hover:gap-3 transition-all">
                      Update Map <ArrowRight size={14} />
                    </button>
                 </div>
                 <div className="editorial-card p-10 bg-[var(--color-editorial-ink)] text-white">
                    <Bookmark className="text-[var(--color-editorial-accent)] mb-6 opacity-50" size={32} />
                    <h3 className="text-2xl font-serif font-bold mb-4">Pending Objects</h3>
                    <div className="flex items-end justify-between">
                      <span className="font-serif text-5xl">12</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 pb-2">Uncategorized Artifacts</span>
                    </div>
                 </div>
               </div>
             </motion.div>
          )}

          {activeTab === 'distill' && (
            <motion.div
              key="distill"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <div className="flex flex-col gap-1 mb-16 max-w-xl">
                 <span className="meta-label">Analytical Distillation</span>
                 <h2 className="text-7xl font-serif font-normal leading-[0.85] tracking-tighter mb-8">Refining <span className="italic">Raw</span> Interest.</h2>
                 <p className="text-lg text-[var(--color-editorial-ink)]/60 leading-relaxed font-serif italic">
                    The process of converting transient heartbeat into persistent skill structures.
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                 <div className="md:col-span-2 border-b border-[var(--color-editorial-line)] pb-4 mb-4">
                   <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 italic">Priority Extractions</span>
                 </div>
                 <SkillCard title="Emotional Composition" category="Vison" duration="8min" steps={4} color="#00d4ff" />
                 <SkillCard title="Chronometric Rituals" category="Lifestyle" duration="15min" steps={6} color="#4ade80" />
                 <SkillCard title="Recursive Rhetoric" category="Articulation" duration="12min" steps={3} color="#2D4BF0" />
                 <div className="editorial-card border-dashed flex flex-col items-center justify-center p-12 text-center opacity-40 hover:opacity-100 transition-all cursor-pointer">
                    <Plus size={32} strokeWidth={1} className="mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Add Custom Node</p>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col h-[75vh] py-12"
            >
              <div className="border-b border-[var(--color-editorial-line)] pb-8 mb-8 flex items-center justify-between">
                 <div>
                   <span className="meta-label">Direct Link</span>
                   <h2 className="text-4xl font-serif font-bold italic tracking-tight">Dialogue.</h2>
                 </div>
                 <div className="w-12 h-12 rounded-full border border-[var(--color-editorial-line)] flex items-center justify-center text-[10px] font-mono">
                    CH_01
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-12 pr-4 custom-scrollbar">
                 <div className="flex gap-8 group">
                   <div className="w-12 h-12 rounded-full border border-[var(--color-editorial-line)] flex items-center justify-center p-2 shrink-0 overflow-hidden bg-white group-hover:border-[var(--color-editorial-accent)] transition-all">
                     <div className="w-full h-full fire-gradient blur-sm opacity-50" />
                   </div>
                   <div className="max-w-[70%]">
                     <p className="font-serif italic text-lg leading-relaxed text-[var(--color-editorial-ink)]">
                       I've been analyzing your recent activity. You seem to be gravitating towards structural Minimalism. Shall we re-orient your growth map to accommodate this shift?
                     </p>
                     <div className="mt-4 flex gap-4">
                        <button className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-editorial-accent)] border-b border-transparent hover:border-[var(--color-editorial-accent)] transition-all">Agree</button>
                        <button className="text-[10px] font-bold uppercase tracking-widest text-black/40 border-b border-transparent hover:border-black/40 transition-all">Dismiss</button>
                     </div>
                   </div>
                 </div>

                 <div className="flex gap-8 flex-row-reverse text-right">
                   <div className="w-12 h-12 rounded-full bg-[var(--color-editorial-ink)] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                     YOU
                   </div>
                   <div className="max-w-[70%]">
                     <p className="font-serif text-lg leading-relaxed text-[var(--color-editorial-ink)]/60">
                       Yes, the reductionist approach feels more sustainable for long-term mastery.
                     </p>
                   </div>
                 </div>
              </div>

              {/* Chat Input */}
              <div className="pt-12">
                <div className="flex items-center gap-6 border-b border-[var(--color-editorial-ink)] pb-4 group">
                  <input 
                    type="text" 
                    placeholder="Input command or query..." 
                    className="flex-1 bg-transparent px-0 py-2 outline-none text-xl font-serif italic text-[var(--color-editorial-ink)] placeholder:text-[var(--color-editorial-ink)]/20"
                  />
                  <button className="text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-[var(--color-editorial-accent)] transition-all">
                    Execute
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <Navigation active={activeTab} onSelect={setActiveTab} />
      
      {/* Floating Action Circle */}
      {activeTab === 'home' && (
         <motion.button 
           initial={{ scale: 0, rotate: 20 }}
           animate={{ scale: 1, rotate: -10 }}
           whileHover={{ scale: 1.1, rotate: 5 }}
           className="fixed bottom-32 right-12 w-32 h-32 rounded-full bg-[var(--color-editorial-accent)] text-white flex items-center justify-center p-6 text-center text-[10px] font-bold uppercase tracking-[0.15em] leading-tight z-50 shadow-2xl"
         >
           Refine Now
         </motion.button>
      )}
    </div>
  );
}

