'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock,
  Eye,
  Plus,
  Loader2,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  Info,
  Search,
  X,
  AlertCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useSearch } from '@/components/AppShell';

interface Stats {
  total: number;
  verified: number;
  up_total: number;
  up_done: number;
  uk_total: number;
  uk_done: number;
  compliance: number;
}

interface MissingItem {
  id: number;
  unit: string;
  nama_eviden: string;
  format_req: string;
}

export default function Home() {
  const { searchQuery } = useSearch();
  const [stats, setStats] = useState<Stats>({
    total: 0, verified: 0, up_total: 0, up_done: 0, uk_total: 0, uk_done: 0, compliance: 0
  });
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [showStandarModal, setShowStandarModal] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const { data: documents } = await supabase
        .from('audit_documents')
        .select('id, unit, nama_eviden, format_req, is_uploaded, status');

      if (!documents) {
        setLoading(false);
        return;
      }

      const total = documents.length;
      const verified = documents.filter(d => d.is_uploaded && d.status !== 'revision').length;
      
      const upDocs = documents.filter(d => d.unit === 'UP');
      const ukDocs = documents.filter(d => d.unit === 'UK');

      setStats({
        total,
        verified,
        up_total: upDocs.length,
        up_done: upDocs.filter(d => d.is_uploaded && d.status !== 'revision').length,
        uk_total: ukDocs.length,
        uk_done: ukDocs.filter(d => d.is_uploaded && d.status !== 'revision').length,
        compliance: total > 0 ? Math.round((verified / total) * 100) : 0
      });

      // Ambil item yang belum lengkap
      const missing = documents
        .filter(d => !d.is_uploaded || d.status === 'revision')
        .map(d => ({ id: d.id, unit: d.unit, nama_eviden: d.nama_eviden, format_req: d.format_req }));
      setMissingItems(missing);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredMissingItems = useMemo(() => {
    return missingItems.filter(item => 
      item.nama_eviden.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.format_req.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [missingItems, searchQuery]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#1E3A8A]/20" size={64} />
      </div>
    );
  }

  const upPercent = stats.up_total > 0 ? Math.round((stats.up_done / stats.up_total) * 100) : 0;
  const ukPercent = stats.uk_total > 0 ? Math.round((stats.uk_done / stats.uk_total) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      {/* Notifikasi Toast */}
      {showNotification && (
        <div className="fixed top-24 right-6 lg:right-10 bg-[#1E3A8A] text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-slide-up">
           <Info size={20} />
           <span className="text-sm font-black uppercase tracking-widest">{showNotification}</span>
        </div>
      )}

      {/* Modal Pelajari Standar */}
      {showStandarModal && (
        <div className="fixed inset-0 bg-[#1A1C1E]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 lg:p-10 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-[#E9ECEF] pb-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PANDUAN AUDIT</span>
                <h3 className="text-xl font-black text-[#1E3A8A] mt-1">Standarisasi Dokumen Eviden</h3>
              </div>
              <button onClick={() => setShowStandarModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-slate-50">
                <X size={22} />
              </button>
            </div>
            <div className="space-y-6 text-sm text-slate-600 font-medium leading-relaxed">
              <div>
                <h4 className="text-sm font-black text-[#1A1C1E] uppercase tracking-widest flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]" /> Standar Unit Pengolah (UP)
                </h4>
                <p className="pl-4 border-l-2 border-slate-100">
                  Unit Pengolah wajib mengunggah dokumen eviden berupa Surat Tugas (ST), Laporan Hasil Kegiatan, Berita Acara, serta Dokumentasi Fisik. Format: PDF untuk dokumen naratif, JPG untuk foto, Excel untuk rekapitulasi, MP4 untuk video kegiatan.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-black text-[#1A1C1E] uppercase tracking-widest flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Standar Unit Kearsipan (UK)
                </h4>
                <p className="pl-4 border-l-2 border-slate-100">
                  Unit Kearsipan bertanggung jawab atas pengelolaan arsip inaktif daerah. Dokumen eviden meliputi Formulir Daftar Berkas, Daftar Isi Berkas, Berita Acara Pemindahan Arsip, serta Jadwal Retensi Arsip (JRA). Penyusunan fisik boks arsip wajib mengikuti standarisasi kode klasifikasi ANRI.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-black text-[#1A1C1E] uppercase tracking-widest flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Alur Verifikasi
                </h4>
                <ul className="list-disc pl-9 space-y-1.5">
                  <li><strong>Belum Ada:</strong> Dokumen belum diunggah ke server.</li>
                  <li><strong>Tersedia:</strong> Dokumen telah tersimpan dan siap diaudit.</li>
                  <li><strong>Revisi:</strong> Dokumen perlu diganti karena format/konten tidak sesuai.</li>
                </ul>
              </div>
            </div>
            <button onClick={() => setShowStandarModal(false)} className="mt-8 w-full bg-[#1E3A8A] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#1E3A8A]/10">
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-[#1E3A8A] tracking-tight">
            Dashboard SIDOKU
          </h1>
          <p className="text-base font-medium text-slate-400 mt-2 max-w-2xl">
            Pantau progres inventarisir dokumen eviden audit kearsipan kecamatan secara real-time.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white border border-[#E9ECEF] text-slate-600 px-5 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={18} /> Cetak
          </button>
        </div>
      </div>

      {/* Statistik Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Kedua Unit */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-[#E9ECEF] p-8 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-black text-[#1A1C1E]">Progress Inventarisir</h3>
              <p className="text-sm font-medium text-slate-400 mt-1">Perbandingan kelengkapan eviden per unit</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Donut Chart */}
            <div className="relative w-44 h-44 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="88" cy="88" r="72" stroke="currentColor" strokeWidth="18" fill="transparent" className="text-slate-100" />
                <circle 
                  cx="88" cy="88" r="72" 
                  stroke="currentColor" strokeWidth="18" fill="transparent" 
                  strokeDasharray="452.4"
                  strokeDashoffset={452.4 - (452.4 * stats.compliance) / 100}
                  strokeLinecap="round"
                  className="text-[#1E3A8A] transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-[#1A1C1E]">{stats.compliance}%</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Keseluruhan</span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="flex-1 w-full space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Unit Pengolah (UP)</span>
                  <span className="text-sm font-black text-[#1E3A8A]">{stats.up_done}/{stats.up_total} item &middot; {upPercent}%</span>
                </div>
                <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-[#1E3A8A] rounded-full transition-all duration-1000" style={{ width: `${upPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Unit Kearsipan (UK)</span>
                  <span className="text-sm font-black text-emerald-600">{stats.uk_done}/{stats.uk_total} item &middot; {ukPercent}%</span>
                </div>
                <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${ukPercent}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="bg-[#F8F9FB] p-3 rounded-xl border border-[#E9ECEF] text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Item</p>
                  <p className="text-xl font-black text-[#1A1C1E]">{stats.total}</p>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lengkap</p>
                  <p className="text-xl font-black text-emerald-600">{stats.verified}</p>
                </div>
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Belum</p>
                  <p className="text-xl font-black text-rose-600">{stats.total - stats.verified}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <Link href="/unit/UP" className="block bg-white rounded-[2rem] border border-[#E9ECEF] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#1E3A8A] flex items-center justify-center">
                <Building2 size={22} />
              </div>
              <ArrowUpRight size={20} className="text-slate-200 group-hover:text-[#1E3A8A] transition-colors" />
            </div>
            <h4 className="text-base font-black text-[#1A1C1E]">Unit Pengolah</h4>
            <p className="text-xs text-slate-400 font-bold mt-1">{stats.up_done}/{stats.up_total} item &middot; {upPercent}% selesai</p>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-[#1E3A8A] rounded-full transition-all duration-700" style={{ width: `${upPercent}%` }} />
            </div>
          </Link>

          <Link href="/unit/UK" className="block bg-white rounded-[2rem] border border-[#E9ECEF] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 size={22} />
              </div>
              <ArrowUpRight size={20} className="text-slate-200 group-hover:text-emerald-600 transition-colors" />
            </div>
            <h4 className="text-base font-black text-[#1A1C1E]">Unit Kearsipan</h4>
            <p className="text-xs text-slate-400 font-bold mt-1">{stats.uk_done}/{stats.uk_total} item &middot; {ukPercent}% selesai</p>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${ukPercent}%` }} />
            </div>
          </Link>
        </div>
      </div>

      {/* Daftar Item Belum Lengkap */}
      <div className="bg-white rounded-[2rem] border border-[#E9ECEF] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E9ECEF] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-rose-500" />
            <h3 className="text-lg font-black text-[#1A1C1E]">
              {searchQuery ? `Hasil Pencarian Belum Lengkap (${filteredMissingItems.length})` : `Item Belum Lengkap (${missingItems.length})`}
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
          {filteredMissingItems.length > 0 ? (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#E9ECEF]">
                  <th className="px-6 py-4">NO</th>
                  <th className="px-6 py-4">UNIT</th>
                  <th className="px-6 py-4">NAMA EVIDEN</th>
                  <th className="px-6 py-4">FORMAT</th>
                  <th className="px-6 py-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF]">
                {filteredMissingItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-2 py-0.5 text-[9px] font-black rounded-md uppercase",
                        item.unit === 'UP' ? "bg-indigo-50 text-[#1E3A8A]" : "bg-emerald-50 text-emerald-600"
                      )}>{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#1A1C1E]">{item.nama_eviden}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-[#F8F9FB] text-slate-400 text-[9px] font-black rounded-md uppercase border border-[#E9ECEF]">{item.format_req}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/unit/${item.unit}`} className="text-[#1E3A8A] hover:underline text-xs font-black uppercase tracking-wider">
                        Upload →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center flex flex-col items-center gap-4 opacity-40">
              <CheckCircle2 size={48} strokeWidth={1} className="text-emerald-500" />
              <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">
                {searchQuery ? "Tidak ada item cocok dengan pencarian" : "Semua Eviden Lengkap!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="bg-[#1E3A8A] rounded-[2rem] p-8 lg:p-10 text-white relative overflow-hidden shadow-2xl shadow-[#1E3A8A]/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-3">
            <div className="px-3 py-1 bg-white/10 rounded-lg w-fit text-[10px] font-black uppercase tracking-widest">Komitmen Standarisasi 2026</div>
            <p className="text-lg font-medium max-w-2xl leading-relaxed">
              SIDOKU membantu menginventarisir dokumen eviden audit kearsipan kecamatan secara digital, transparan, dan akuntabel.
            </p>
          </div>
          <button 
            onClick={() => setShowStandarModal(true)}
            className="bg-white text-[#1E3A8A] px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex-shrink-0"
          >
            Pelajari Standar
          </button>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
