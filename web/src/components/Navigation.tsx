/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, Map, Book, MessageCircle, User } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface NavProps {
  active: string;
  onSelect: (id: string) => void;
}

export default function Navigation({ active, onSelect }: NavProps) {
  const items = [
    { id: 'home', icon: Home, label: 'Logbook' },
    { id: 'map', icon: Map, label: 'Cartography' },
    { id: 'distill', icon: Book, label: 'Distill' },
    { id: 'chat', icon: MessageCircle, label: 'Dialogue' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-editorial-bg)] border-t border-[var(--color-editorial-line)] px-8 py-6 pb-10 z-50">
      <div className="flex justify-between items-center max-w-sm mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex flex-col items-center gap-2 transition-all",
                isActive ? "text-[var(--color-editorial-accent)]" : "text-[var(--color-editorial-ink)]/30 hover:text-[var(--color-editorial-ink)]"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
