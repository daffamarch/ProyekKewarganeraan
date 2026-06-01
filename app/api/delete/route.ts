import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const STORAGE_ROOT = process.env.LOCAL_STORAGE_PATH || 'C:/SIDOKU_FILES';

export async function POST(request: Request) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'documentId wajib diisi.' }, { status: 400 });
    }

    // --- Ambil path file saat ini dari DB ---
    const { data: doc, error: fetchError } = await supabase
      .from('audit_documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // --- Hapus file fisik dari disk ---
    if (doc?.file_url) {
      try {
        const absolutePath = path.join(STORAGE_ROOT, doc.file_url);
        // Pastikan path aman (di dalam STORAGE_ROOT)
        const resolved = path.resolve(absolutePath);
        const resolvedRoot = path.resolve(STORAGE_ROOT);
        if (resolved.startsWith(resolvedRoot)) {
          await unlink(resolved);
        }
      } catch (e: any) {
        // File mungkin sudah dihapus manual — tidak apa-apa
        console.warn('File tidak ditemukan di disk:', doc.file_url);
      }
    }

    // --- Reset status di Supabase ---
    const { error: dbError } = await supabase
      .from('audit_documents')
      .update({
        file_url: null,
        is_uploaded: false,
        status: 'missing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (dbError) throw dbError;

    return NextResponse.json({ status: 'ok', message: 'File berhasil dihapus.' });
  } catch (err: any) {
    console.error('Hapus gagal:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal menghapus file.' },
      { status: 500 }
    );
  }
}
