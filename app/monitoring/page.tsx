'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, RefreshCcw } from 'lucide-react';
import MemoryMap, { type AuditDocument } from '@/components/MemoryMap';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/components/AppShell';

export default function PetaDokumenPage() {
  const [upItems, setUpItems] = useState<AuditDocument[]>([]);
  const [ukItems, setUkItems] = useState<AuditDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { searchQuery } = useSearch();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('audit_documents')
        .select('*')
        .order('id', { ascending: true });

      const all = data || [];
      setUpItems(all.filter(d => d.unit === 'UP'));
      setUkItems(all.filter(d => d.unit === 'UK'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUpItems = useMemo(() => {
    return upItems.filter(item => 
      item.nama_eviden.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.format_req.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [upItems, searchQuery]);

  const filteredUkItems = useMemo(() => {
    return ukItems.filter(item => 
      item.nama_eviden.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.format_req.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ukItems, searchQuery]);

  const getStats = (items: AuditDocument[]) => {
    const total = items.length;
    const done = items.filter(i => i.is_uploaded && i.status !== 'missing' && i.status !== 'revision').length;
    const revision = items.filter(i => i.status === 'revision').length;
    const missing = total - done - revision;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, revision, missing, percent };
  };

  const upStats = getStats(upItems);
  const ukStats = getStats(ukItems);
  const allItems = [...upItems, ...ukItems];
  const totalStats = getStats(allItems);

  const handleSelect = (item: AuditDocument) => {
    router.push(`/unit/${item.unit}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#1E3A8A]/20" size={64} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-[#1E3A8A] tracking-tight">Peta Dokumen</h1>
          <p className="text-base font-medium text-slate-400 mt-1">Visualisasi seluruh status eviden kedua unit dalam satu pandangan.</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 bg-white border border-[#E9ECEF] text-slate-600 px-5 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {/* Progress Rings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressRing label="Keseluruhan" stats={totalStats} color="#1E3A8A" />
        <ProgressRing label="Unit Pengolah (UP)" stats={upStats} color="#4F46E5" />
        <ProgressRing label="Unit Kearsipan (UK)" stats={ukStats} color="#10B981" />
      </div>

      {/* Memory Map: UP */}
      <div className="bg-white rounded-[2rem] border border-[#E9ECEF] p-6 lg:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-[#1A1C1E]">Unit Pengolah (UP)</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">{upStats.done}/{upStats.total} item lengkap &middot; Klik kotak untuk membuka halaman unit</p>
          </div>
          <span className="text-xl font-black text-[#1E3A8A]">{upStats.percent}%</span>
        </div>
        {filteredUpItems.length > 0 ? (
          <MemoryMap items={filteredUpItems} onSelect={handleSelect} />
        ) : (
          <p className="text-center py-10 text-sm font-bold text-slate-300 uppercase tracking-widest">
            {searchQuery ? "Tidak ada item cocok dengan pencarian" : "Belum ada item di Unit Pengolah"}
          </p>
        )}
      </div>

      {/* Memory Map: UK */}
      <div className="bg-white rounded-[2rem] border border-[#E9ECEF] p-6 lg:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-[#1A1C1E]">Unit Kearsipan (UK)</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">{ukStats.done}/{ukStats.total} item lengkap &middot; Klik kotak untuk membuka halaman unit</p>
          </div>
          <span className="text-xl font-black text-emerald-600">{ukStats.percent}%</span>
        </div>
        {filteredUkItems.length > 0 ? (
          <MemoryMap items={filteredUkItems} onSelect={handleSelect} />
        ) : (
          <p className="text-center py-10 text-sm font-bold text-slate-300 uppercase tracking-widest">
            {searchQuery ? "Tidak ada item cocok dengan pencarian" : "Belum ada item di Unit Kearsipan"}
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressRing({ label, stats, color }: { 
  label: string; 
  stats: { total: number; done: number; missing: number; revision: number; percent: number }; 
  color: string 
}) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (circumference * stats.percent) / 100;

  return (
    <div className="bg-white rounded-[2rem] border border-[#E9ECEF] p-6 shadow-sm flex items-center gap-6">
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="40" stroke="#F1F5F9" strokeWidth="8" fill="transparent" />
          <circle 
            cx="48" cy="48" r="40" 
            stroke={color} strokeWidth="8" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-[#1A1C1E]">{stats.percent}%</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-[#1A1C1E] mt-1">{stats.done}<span className="text-sm text-slate-300">/{stats.total}</span></p>
        <div className="flex gap-3 mt-2">
          <span className="text-[9px] font-black text-emerald-500">{stats.done} Lengkap</span>
          <span className="text-[9px] font-black text-slate-300">{stats.missing} Kosong</span>
          {stats.revision > 0 && <span className="text-[9px] font-black text-amber-500">{stats.revision} Revisi</span>}
        </div>
      </div>
    </div>
  );
}
