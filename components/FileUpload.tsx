'use client';

import { useState, useRef } from 'react';
import { 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Trash2, 
  FileText,
  ShieldCheck,
  Eye,
  Maximize2,
  Film,
  Image as ImageIcon,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase';

interface Props {
  documentId: number;
  itemName: string;
  requiredFormat: string;
  unitId: string;
  status?: 'completed' | 'missing' | 'revision';
  existingFileUrl?: string | null;
  onComplete: () => void;
}

export default function FileUpload({ 
  documentId, 
  itemName, 
  requiredFormat, 
  unitId,
  status, 
  existingFileUrl, 
  onComplete 
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const strictReq = requiredFormat.toUpperCase();
  const isRevision = status === 'revision';
  const isUploaded = !!existingFileUrl && status !== 'missing' && !isRevision;
  const previewUrl = existingFileUrl ? `/api/files/${existingFileUrl}` : null;

  const getAcceptString = () => {
    switch (strictReq) {
      case 'PDF': return '.pdf';
      case 'JPG': return '.jpg,.jpeg,.png';
      case 'EXCEL': return '.xlsx,.xls,.csv';
      case 'MP4': return '.mp4';
      default: return '*';
    }
  };

  const getFormatIcon = () => {
    switch (strictReq) {
      case 'PDF': return <FileText size={32} />;
      case 'JPG': return <ImageIcon size={32} />;
      case 'EXCEL': return <FileSpreadsheet size={32} />;
      case 'MP4': return <Film size={32} />;
      default: return <FileText size={32} />;
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentId', String(documentId));
      formData.append('unit', unitId);
      formData.append('formatReq', strictReq);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Gagal mengunggah file.');
      }

      window.dispatchEvent(new CustomEvent('sidoku-document-changed', {
        detail: {
          eventType: 'UPDATE',
          doc: {
            id: documentId,
            nama_eviden: itemName,
            format_req: strictReq,
            unit: unitId,
            is_uploaded: true,
            status: 'completed'
          }
        }
      }));

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengunggah.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Hapus dokumen ini? File akan dihapus dari server.')) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Gagal menghapus file.');
      }

      window.dispatchEvent(new CustomEvent('sidoku-document-changed', {
        detail: {
          eventType: 'UPDATE',
          doc: {
            id: documentId,
            nama_eviden: itemName,
            format_req: strictReq,
            unit: unitId,
            is_uploaded: false,
            status: 'missing'
          }
        }
      }));

      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkRevision = async () => {
    if (!confirm('Tandai berkas ini perlu revisi?')) return;
    setUpdatingStatus(true);
    setError(null);
    try {
      const { error: dbError } = await supabase
        .from('audit_documents')
        .update({ status: 'revision' })
        .eq('id', documentId);

      if (dbError) throw dbError;

      window.dispatchEvent(new CustomEvent('sidoku-document-changed', {
        detail: {
          eventType: 'UPDATE',
          doc: {
            id: documentId,
            nama_eviden: itemName,
            format_req: strictReq,
            unit: unitId,
            is_uploaded: true,
            status: 'revision'
          }
        }
      }));

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Gagal menandai revisi.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResolveRevision = async () => {
    if (!confirm('Batalkan status revisi dan setujui berkas yang ada?')) return;
    setUpdatingStatus(true);
    setError(null);
    try {
      const { error: dbError } = await supabase
        .from('audit_documents')
        .update({ status: 'completed' })
        .eq('id', documentId);

      if (dbError) throw dbError;

      window.dispatchEvent(new CustomEvent('sidoku-document-changed', {
        detail: {
          eventType: 'UPDATE',
          doc: {
            id: documentId,
            nama_eviden: itemName,
            format_req: strictReq,
            unit: unitId,
            is_uploaded: true,
            status: 'completed'
          }
        }
      }));

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Gagal membatalkan revisi.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  // Extract filename from path for display
  const displayFileName = existingFileUrl ? existingFileUrl.split('/').pop() : null;

  return (
    <div className="bg-white rounded-[2.5rem] border border-[#E9ECEF] p-8 lg:p-10 shadow-sm flex flex-col gap-6 relative overflow-hidden">
      {/* Document Preview Overlay */}
      {showPreview && previewUrl && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col animate-fade-in">
          <div className="p-5 border-b flex justify-between items-center bg-slate-50">
            <span className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Pratinjau Dokumen</span>
            <button onClick={() => setShowPreview(false)} className="bg-rose-500 text-white p-2 rounded-xl hover:scale-110 transition-all">
              <Maximize2 size={18} className="rotate-45" />
            </button>
          </div>
          <div className="flex-1 bg-slate-100 overflow-hidden relative">
            {strictReq === 'PDF' ? (
              <iframe src={previewUrl} className="w-full h-full border-none" />
            ) : strictReq === 'JPG' ? (
              <div className="w-full h-full flex items-center justify-center p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
              </div>
            ) : strictReq === 'MP4' ? (
              <div className="w-full h-full flex items-center justify-center p-8">
                <video src={previewUrl} controls className="max-w-full max-h-full rounded-lg shadow-2xl" />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                <FileText size={64} />
                <p className="text-sm font-black uppercase tracking-widest">Format {strictReq} tidak mendukung pratinjau langsung</p>
                <a href={previewUrl} target="_blank" rel="noreferrer" className="text-[#1E3A8A] font-black underline text-sm">Unduh File</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header: Nama Item & Status */}
      <div className="flex items-start gap-4">
        <div className={clsx(
          "w-14 h-14 rounded-2xl flex items-center justify-center border flex-shrink-0",
          isRevision ? "bg-amber-50 text-amber-500 border-amber-200 animate-pulse" :
          isUploaded ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                     : "bg-[#F8F9FB] text-slate-300 border-[#E9ECEF]"
        )}>
          {getFormatIcon()}
        </div>
        <div className="min-w-0">
          <h4 className="text-lg font-black text-[#1A1C1E] tracking-tight leading-tight break-words">{itemName}</h4>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-2.5 py-0.5 bg-[#F8F9FB] text-slate-400 text-[9px] font-black rounded-md uppercase border border-[#E9ECEF]">
              {strictReq}
            </span>
            <span className={clsx(
              "text-[10px] font-black uppercase tracking-widest",
              isRevision ? "text-amber-500 animate-pulse" :
              isUploaded ? "text-emerald-500" : "text-slate-300"
            )}>
              {isRevision ? 'Perlu Revisi' : isUploaded ? 'Tersedia' : 'Belum Ada'}
            </span>
          </div>
        </div>
      </div>

      {/* Warning banner jika statusnya adalah revisi */}
      {isRevision && existingFileUrl && (
        <div className="space-y-3">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="text-amber-500 flex-shrink-0" size={18} />
              <div className="min-w-0">
                <span className="text-[10px] font-black text-amber-800 block">DOKUMEN DITOLAK (REVISI)</span>
                <span className="text-[9px] font-bold text-amber-600 block mt-0.5 truncate">Unggah berkas baru untuk memperbaiki</span>
              </div>
            </div>
            <button 
              onClick={() => setShowPreview(true)}
              className="bg-white border border-amber-200 text-amber-600 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-amber-100 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <Eye size={12} /> Berkas Lama
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleResolveRevision}
              className="py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-1"
              disabled={updatingStatus}
            >
              Setujui Berkas Lama
            </button>
            <button 
              onClick={handleDelete}
              className="py-3 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-1"
              disabled={updatingStatus}
            >
              Hapus Berkas
            </button>
          </div>
        </div>
      )}

      {/* Konten: Upload atau Info File */}
      {isUploaded ? (
        <div className="space-y-4">
          {/* Info file yang sudah ada */}
          <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-[#1A1C1E] block">Berkas Tersimpan</span>
                <span className="text-[9px] font-bold text-slate-400 block truncate mt-0.5">{displayFileName}</span>
              </div>
            </div>
            <button 
              onClick={() => setShowPreview(true)}
              className="bg-white border border-[#E9ECEF] p-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm flex-shrink-0"
              title="Lihat Dokumen"
            >
              <Eye size={18} />
            </button>
          </div>

          {/* Tombol Ganti, Hapus & Tandai Revisi */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="py-3.5 bg-[#1E3A8A] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#1E3A8A]/20"
                disabled={uploading || deleting || updatingStatus}
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Ganti File
              </button>
              <button 
                onClick={handleDelete}
                className="py-3.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all"
                disabled={uploading || deleting || updatingStatus}
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Hapus
              </button>
            </div>
            <button 
              onClick={handleMarkRevision}
              className="w-full py-3.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-100 transition-all"
              disabled={uploading || deleting || updatingStatus}
            >
              {updatingStatus ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />} Tandai Butuh Revisi
            </button>
          </div>
        </div>
      ) : (
        /* Drop Zone untuk Upload */
        <div 
          className={clsx(
            "cursor-pointer border-2 border-dashed rounded-[1.5rem] p-10 lg:p-14 transition-all flex flex-col items-center justify-center text-center group",
            dragActive ? "border-[#1E3A8A] bg-blue-50/50" : "border-[#E9ECEF] hover:border-[#1E3A8A]/30 hover:bg-[#F8F9FB]",
            error && "border-rose-300 bg-rose-50/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-[#1E3A8A]" size={48} />
              <p className="text-xs font-black uppercase tracking-widest text-[#1E3A8A]">Menyimpan ke server...</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4 text-slate-300 border border-[#E9ECEF] group-hover:scale-110 transition-transform shadow-sm">
                <Upload size={24} />
              </div>
              <p className="text-base font-black text-[#1A1C1E] mb-1">Unggah Dokumen</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                Seret file atau klik &mdash; Format wajib: <span className="text-[#1E3A8A] font-black">{strictReq}</span>
              </p>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-rose-600 text-white text-[11px] font-black rounded-xl flex items-center gap-3 shadow-lg">
          <XCircle size={18} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Hidden file input */}
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef}
        accept={getAcceptString()}
        onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
        disabled={uploading}
      />

      {/* Footer */}
      <div className="pt-6 border-t border-[#F1F3F5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-slate-300" />
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Penyimpanan Lokal</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-500">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest">Server Aktif</span>
        </div>
      </div>
    </div>
  );
}
