'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search,
  Loader2,
  CheckCircle2,
  FileText,
  ImageIcon,
  FileSpreadsheet,
  Film,
  Printer,
  RefreshCcw,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useSearch } from '@/components/AppShell';

interface AuditDoc {
  id: number;
  unit: string;
  nama_eviden: string;
  format_req: string;
  is_uploaded: boolean;
  file_url: string | null;
  status?: string;
}

export default function RekapLengkapPage() {
  const [items, setItems] = useState<AuditDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, setSearchQuery } = useSearch();
  const [filterUnit, setFilterUnit] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('audit_documents')
        .select('*')
        .order('unit', { ascending: true })
        .order('id', { ascending: true });
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.nama_eviden.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.format_req.toLowerCase().includes(searchQuery.toLowerCase());
      const matchUnit = filterUnit === 'Semua' || item.unit === filterUnit;
      const matchStatus = filterStatus === 'Semua' ||
        (filterStatus === 'Lengkap' && item.is_uploaded && item.status !== 'revision') ||
        (filterStatus === 'Belum' && (!item.is_uploaded || item.status === 'missing')) ||
        (filterStatus === 'Revisi' && item.status === 'revision');
      return matchSearch && matchUnit && matchStatus;
    });
  }, [items, searchQuery, filterUnit, filterStatus]);

  const upItems = items.filter(i => i.unit === 'UP');
  const ukItems = items.filter(i => i.unit === 'UK');
  const upDone = upItems.filter(i => i.is_uploaded && i.status !== 'revision').length;
  const ukDone = ukItems.filter(i => i.is_uploaded && i.status !== 'revision').length;

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF': return <FileText size={16} />;
      case 'JPG': return <ImageIcon size={16} />;
      case 'EXCEL': return <FileSpreadsheet size={16} />;
      case 'MP4': return <Film size={16} />;
      default: return <FileText size={16} />;
    }
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
          <h1 className="text-3xl lg:text-4xl font-black text-[#1E3A8A] tracking-tight">Rekap Lengkap</h1>
          <p className="text-base font-medium text-slate-400 mt-1">Seluruh item eviden dari kedua unit dalam satu tampilan.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 bg-white border border-[#E9ECEF] text-slate-600 px-4 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCcw size={16} /> Refresh
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#1E3A8A] text-white px-5 py-3 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#1E3A8A]/20">
            <Printer size={16} /> Cetak Rekap
          </button>
        </div>
      </div>

      {/* Ringkasan Per Unit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border border-[#E9ECEF] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Unit Pengolah (UP)</h3>
            <span className="text-lg font-black text-[#1E3A8A]">{upItems.length > 0 ? Math.round((upDone / upItems.length) * 100) : 0}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 mb-3">
            <div className="h-full bg-[#1E3A8A] rounded-full transition-all duration-700" style={{ width: `${upItems.length > 0 ? Math.round((upDone / upItems.length) * 100) : 0}%` }} />
          </div>
          <p className="text-xs font-bold text-slate-400">{upDone} dari {upItems.length} item lengkap &middot; <span className="text-rose-500">{upItems.length - upDone} belum</span></p>
        </div>

        <div className="bg-white rounded-[2rem] border border-[#E9ECEF] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Unit Kearsipan (UK)</h3>
            <span className="text-lg font-black text-emerald-600">{ukItems.length > 0 ? Math.round((ukDone / ukItems.length) * 100) : 0}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 mb-3">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${ukItems.length > 0 ? Math.round((ukDone / ukItems.length) * 100) : 0}%` }} />
          </div>
          <p className="text-xs font-bold text-slate-400">{ukDone} dari {ukItems.length} item lengkap &middot; <span className="text-rose-500">{ukItems.length - ukDone} belum</span></p>
        </div>
      </div>

      {/* Tabel Gabungan */}
      <div className="bg-white rounded-[2rem] border border-[#E9ECEF] overflow-hidden shadow-sm">
        {/* Filter Bar */}
        <div className="p-6 border-b border-[#E9ECEF] flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={16} className="text-slate-400" />
            {['Semua', 'UP', 'UK'].map(u => (
              <button key={u} onClick={() => setFilterUnit(u)} className={clsx(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                filterUnit === u ? "bg-[#1E3A8A] text-white border-[#1E3A8A]" : "bg-white text-slate-400 border-[#E9ECEF] hover:bg-slate-50"
              )}>{u === 'Semua' ? 'Semua Unit' : u}</button>
            ))}
            <div className="w-px h-6 bg-[#E9ECEF] hidden lg:block" />
            {['Semua', 'Lengkap', 'Belum', 'Revisi'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={clsx(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                filterStatus === s ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-[#E9ECEF] hover:bg-slate-50"
              )}>{s}</button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" placeholder="Cari nama eviden..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F9FB] rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold border-none focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none"
            />
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          {filteredItems.length > 0 ? (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#E9ECEF]">
                  <th className="px-6 py-4">NO</th>
                  <th className="px-6 py-4">UNIT</th>
                  <th className="px-6 py-4">NAMA EVIDEN</th>
                  <th className="px-6 py-4">FORMAT</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF]">
                {filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-[#F8F9FB] transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-300">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-2.5 py-0.5 text-[9px] font-black rounded-md uppercase",
                        item.unit === 'UP' ? "bg-indigo-50 text-[#1E3A8A]" : "bg-emerald-50 text-emerald-600"
                      )}>{item.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={clsx("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                          item.format_req === 'PDF' ? 'bg-rose-50 text-rose-500' :
                          item.format_req === 'JPG' ? 'bg-blue-50 text-blue-500' :
                          item.format_req === 'EXCEL' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                        )}>
                          {getFormatIcon(item.format_req)}
                        </span>
                        <span className="text-sm font-bold text-[#1A1C1E]">{item.nama_eviden}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-[#F8F9FB] text-slate-400 text-[9px] font-black rounded-md uppercase border border-[#E9ECEF]">{item.format_req}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.is_uploaded && item.status !== 'missing' ? (
                        item.status === 'revision' ? (
                          <span className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase"><span className="w-2 h-2 bg-amber-500 rounded-full" />Revisi</span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase"><span className="w-2 h-2 bg-emerald-500 rounded-full" />Tersedia</span>
                        )
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-300 text-[10px] font-black uppercase"><span className="w-2 h-2 bg-slate-200 rounded-full" />Belum Ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/unit/${item.unit}`} className="text-[#1E3A8A] hover:underline text-xs font-black uppercase tracking-wider">
                        Buka →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center flex flex-col items-center gap-4 opacity-30">
              <FileText size={48} strokeWidth={1} />
              <p className="text-xs font-black uppercase tracking-widest">Tidak ada data ditemukan</p>
            </div>
          )}
        </div>

        {/* Footer Count */}
        <div className="p-4 border-t border-[#E9ECEF] text-center">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Menampilkan {filteredItems.length} dari {items.length} item
          </span>
        </div>
      </div>
    </div>
  );
}
