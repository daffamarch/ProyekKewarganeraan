'use client';

import { clsx } from 'clsx';

export interface AuditDocument {
  id: number;
  unit: string;
  nama_eviden: string;
  format_req: string;
  is_uploaded: boolean;
  file_url: string | null;
  status?: 'completed' | 'missing' | 'revision';
}

interface Props {
  items: AuditDocument[];
  onSelect: (item: AuditDocument) => void;
  selectedId?: number;
}

export default function MemoryMap({ items, onSelect, selectedId }: Props) {
  const sortedItems = [...items].sort((a, b) => a.id - b.id);

  return (
    <div>
      {/* Legenda */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-dashed border-[#D1D5DB] bg-white" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kosong</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-400" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revisi</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5 gap-2.5">
        {sortedItems.map((item) => {
          const isUploaded = item.is_uploaded && item.status !== 'missing';
          const isRevision = item.status === 'revision';
          const isSelected = selectedId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              title={`${item.nama_eviden} — ${item.format_req}`}
              className={clsx(
                "aspect-square rounded-xl transition-all duration-200 relative group flex items-center justify-center",
                // Kosong: abu-abu dashed
                !isUploaded && !isRevision && "border-2 border-dashed border-[#D1D5DB] bg-white hover:border-[#1E3A8A]/40 hover:bg-[#EEF2FF]",
                // Revisi: kuning
                isRevision && "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95",
                // Tersedia: hijau
                isUploaded && !isRevision && "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95",
                // Selected: ring biru
                isSelected && "ring-[3px] ring-[#1E3A8A] ring-offset-2 z-10 scale-110 shadow-xl"
              )}
            >
              <span className={clsx(
                "text-[9px] font-black transition-colors",
                isUploaded || isRevision ? "text-white" : "text-slate-300"
              )}>
                {item.id}
              </span>

              {/* Tooltip */}
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-[#1A1C1E] text-white text-[8px] font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-20 max-w-[150px] truncate">
                {item.nama_eviden}
                <span className="block text-[7px] text-white/50 mt-0.5">{item.format_req}</span>
              </div>
            </button>
          );
        })}

        {/* Placeholder jika item sedikit */}
        {items.length > 0 && items.length < 10 && Array.from({ length: 10 - items.length }).map((_, i) => (
          <div 
            key={`ph-${i}`} 
            className="aspect-square rounded-xl border-2 border-dashed border-slate-100 opacity-30" 
          />
        ))}
      </div>

      {/* Info jumlah */}
      {items.length > 0 && (
        <div className="mt-4 text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">
          {items.filter(i => i.is_uploaded && i.status !== 'missing').length} / {items.length} Item Terisi
        </div>
      )}
    </div>
  );
}
