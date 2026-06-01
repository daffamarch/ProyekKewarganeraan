'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  FileText, 
  Loader2, 
  RefreshCcw, 
  CheckCircle2, 
  Info,
  ImageIcon,
  FileSpreadsheet,
  Film,
  X
} from 'lucide-react';
import MemoryMap, { type AuditDocument } from '@/components/MemoryMap';
import FileUpload from '@/components/FileUpload';
import { clsx } from 'clsx';
import { useSearch } from '@/components/AppShell';

export default function UnitPage() {
  const { unitId } = useParams();
  const [items, setItems] = useState<AuditDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<AuditDocument | null>(null);
  const { searchQuery, setSearchQuery } = useSearch();
  const [showNotification, setShowNotification] = useState<string | null>(null);
  
  // State untuk Modal Tambah Dokumen
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ nama: '', format: 'PDF' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: itemsData } = await supabase
        .from('audit_documents')
        .select('*')
        .eq('unit', unitId)
        .order('id', { ascending: true });
      
      const mappedData = itemsData || [];
      setItems(mappedData);
      
      // Auto select first item if none selected, or refresh current selection
      if (!selectedItem && mappedData.length > 0) {
        setSelectedItem(mappedData[0]);
      } else if (selectedItem) {
        const updated = mappedData.find(i => i.id === selectedItem.id);
        setSelectedItem(updated || (mappedData.length > 0 ? mappedData[0] : null));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [unitId, selectedItem]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.nama) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('audit_documents')
        .insert([{
          unit: unitId,
          nama_eviden: newDoc.nama,
          format_req: newDoc.format,
          is_uploaded: false,
          status: 'missing'
        }]);

      if (error) throw error;
      
      window.dispatchEvent(new CustomEvent('sidoku-document-changed', {
        detail: {
          eventType: 'INSERT',
          doc: {
            nama_eviden: newDoc.nama,
            format_req: newDoc.format,
            unit: unitId,
            is_uploaded: false,
            status: 'missing'
          }
        }
      }));

      handleQuickAction('Item eviden baru berhasil ditambahkan');
      setShowAddModal(false);
      setNewDoc({ nama: '', format: 'PDF' });
      fetchData();
    } catch (err: any) {
      handleQuickAction('Gagal: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Hapus item ini beserta file-nya (jika ada) dari daftar inventaris?')) return;

    try {
      // Hapus file fisik via API jika ada
      const item = items.find(i => i.id === id);
      if (item?.is_uploaded && item?.file_url) {
        await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: id }),
        });
      }

      // Hapus record dari Supabase
      await supabase.from('audit_documents').delete().eq('id', id);
      
      window.dispatchEvent(new CustomEvent('sidoku-document-changed', {
        detail: {
          eventType: 'DELETE',
          doc: { id }
        }
      }));

      if (selectedItem?.id === id) setSelectedItem(null);
      handleQuickAction('Item berhasil dihapus');
      fetchData();
    } catch (err: any) {
      handleQuickAction('Gagal menghapus: ' + err.message);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const uploaded = items.filter(i => i.is_uploaded && i.status !== 'missing').length;
    const missing = total - uploaded;
    return { 
      total, 
      uploaded, 
      missing,
      percent: total > 0 ? Math.round((uploaded / total) * 100) : 0 
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.nama_eviden.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.format_req.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleQuickAction = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3000);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF': return <FileText size={20} />;
      case 'JPG': return <ImageIcon size={20} />;
      case 'EXCEL': return <FileSpreadsheet size={20} />;
      case 'MP4': return <Film size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'PDF': return 'bg-rose-50 text-rose-500';
      case 'JPG': return 'bg-blue-50 text-blue-500';
      case 'EXCEL': return 'bg-emerald-50 text-emerald-600';
      case 'MP4': return 'bg-purple-50 text-purple-600';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#1E3A8A]/20" size={64} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative pb-20">
      {/* Notifikasi Toast */}
      {showNotification && (
        <div className="fixed top-24 right-6 lg:right-10 bg-[#1E3A8A] text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-slide-up">
           <Info size={20} />
           <span className="text-sm font-black uppercase tracking-widest">{showNotification}</span>
        </div>
      )}

      {/* Modal Tambah Dokumen */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#1A1C1E]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-[#1E3A8A]">Tambah Item Eviden</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors">
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={handleAddDocument} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Dokumen Eviden</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newDoc.nama}
                  onChange={(e) => setNewDoc({...newDoc, nama: e.target.value})}
                  placeholder="Contoh: Surat Perintah Tugas (SPT)..."
                  className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Format File yang Dibutuhkan</label>
                <div className="grid grid-cols-4 gap-2">
                  {['PDF', 'JPG', 'EXCEL', 'MP4'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setNewDoc({...newDoc, format: fmt})}
                      className={clsx(
                        "py-3 rounded-xl text-[11px] font-black border transition-all",
                        newDoc.format === fmt ? "bg-[#1E3A8A] text-white border-[#1E3A8A]" : "bg-white text-slate-400 border-[#E9ECEF] hover:bg-slate-50"
                      )}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSaving || !newDoc.nama}
                className="w-full bg-[#1E3A8A] text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Simpan ke Inventaris
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-[#1E3A8A] tracking-tight">
            {unitId === 'UP' ? 'Unit Pengolah' : 'Unit Kearsipan'}
          </h1>
          <p className="text-base font-medium text-slate-400 mt-1">Kelola dan upload dokumen eviden audit.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#1E3A8A] text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-[#1E3A8A]/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} strokeWidth={3} /> Tambah Item
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-[2rem] border border-[#E9ECEF] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Progress Kelengkapan</span>
            <span className="text-lg font-black text-[#1E3A8A]">{stats.percent}%</span>
          </div>
          <div className="flex gap-3">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg uppercase">Lengkap: {stats.uploaded}</span>
            <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg uppercase">Belum: {stats.missing}</span>
            <span className="px-3 py-1 bg-[#F8F9FB] text-slate-400 text-[10px] font-black rounded-lg uppercase border border-[#E9ECEF]">Total: {stats.total}</span>
          </div>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div className="h-full bg-[#1E3A8A] rounded-full transition-all duration-1000" style={{ width: `${stats.percent}%` }} />
        </div>
      </div>

      {/* Layout: Tabel + Panel Samping */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabel Inventaris Eviden */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="bg-white rounded-[2rem] border border-[#E9ECEF] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#E9ECEF] flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-lg font-black text-[#1A1C1E]">Daftar Item Eviden</h3>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari nama atau format..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F8F9FB] rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold border-none focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              {filteredItems.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#E9ECEF]">
                      <th className="px-6 py-4">NAMA DOKUMEN</th>
                      <th className="px-6 py-4">FORMAT</th>
                      <th className="px-6 py-4">STATUS</th>
                      <th className="px-6 py-4 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF]">
                    {filteredItems.map((item) => (
                      <tr 
                        key={item.id} 
                        className={clsx(
                          "hover:bg-[#F8F9FB] transition-colors cursor-pointer group",
                          selectedItem?.id === item.id && "bg-[#EEF2FF]"
                        )}
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                              "w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 flex-shrink-0",
                              getFormatColor(item.format_req)
                            )}>
                              {getFormatIcon(item.format_req)}
                            </div>
                            <span className="text-sm font-bold text-[#1A1C1E] break-words">{item.nama_eviden}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 bg-[#F8F9FB] text-slate-400 text-[9px] font-black rounded-md uppercase border border-[#E9ECEF]">{item.format_req}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={item.status} isUploaded={item.is_uploaded} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3 text-slate-200 group-hover:text-slate-400 transition-colors">
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }} title="Upload / Preview">
                              <Eye size={18} className="hover:text-[#1E3A8A] transition-colors" />
                            </button>
                            <button onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id);
                            }} title="Hapus Item">
                              <Trash2 size={18} className="hover:text-rose-500 transition-colors" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center flex flex-col items-center gap-4 opacity-30">
                  <FileText size={48} strokeWidth={1} />
                  <p className="text-xs font-black text-slate-600 uppercase tracking-widest">
                    {items.length === 0 ? 'Belum ada item — klik \"Tambah Item\" untuk mulai' : 'Tidak ada hasil pencarian'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel Samping: Upload + Memory Map */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {selectedItem ? (
            <FileUpload 
              documentId={selectedItem.id}
              itemName={selectedItem.nama_eviden}
              requiredFormat={selectedItem.format_req}
              unitId={String(unitId)}
              status={selectedItem.status as any}
              existingFileUrl={selectedItem.is_uploaded ? selectedItem.file_url : null}
              onComplete={fetchData}
            />
          ) : (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-[#E9ECEF] p-14 text-center opacity-30 flex flex-col items-center gap-3">
              <FileText size={48} strokeWidth={1} className="text-slate-300" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pilih item dari tabel untuk upload</p>
            </div>
          )}

          <div className="bg-white rounded-[2rem] border border-[#E9ECEF] p-6 shadow-sm">
            <h4 className="text-base font-black text-[#1A1C1E] mb-4">Peta Visual Eviden</h4>
            <MemoryMap 
              items={items} 
              onSelect={(item) => setSelectedItem(item)}
              selectedId={selectedItem?.id}
            />
          </div>

          <button 
            onClick={fetchData}
            className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 py-3 border border-[#E9ECEF] rounded-2xl hover:bg-[#F8F9FB] transition-all"
          >
            <RefreshCcw size={14} /> Sinkronisasi Data
          </button>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#1E3A8A]/40 hover:scale-110 active:scale-95 transition-all z-[60] lg:hidden"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
    </div>
  );
}

function StatusPill({ status, isUploaded }: { status?: string; isUploaded: boolean }) {
  if (status === 'revision') return (
    <div className="flex items-center gap-2 text-amber-500 animate-pulse">
      <div className="w-2 h-2 bg-amber-500 rounded-full" />
      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 font-black">Revisi</span>
    </div>
  );
  if (!isUploaded) return (
    <div className="flex items-center gap-2 text-slate-300">
      <div className="w-2 h-2 bg-slate-200 rounded-full" />
      <span className="text-[10px] font-black uppercase tracking-widest">Belum Ada</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 text-emerald-500">
      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
      <span className="text-[10px] font-black uppercase tracking-widest">Tersedia</span>
    </div>
  );
}
