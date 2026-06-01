import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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

    // --- Hapus file fisik dari Supabase Storage ---
    if (doc?.file_url) {
      try {
        const { error: deleteError } = await supabase.storage
          .from('dokumen-sidoku')
          .remove([doc.file_url]);

        if (deleteError) {
          console.warn('Gagal menghapus file dari Supabase Storage:', deleteError.message);
        }
      } catch (e: any) {
        console.warn('Kesalahan saat menghapus dari Supabase Storage:', e.message);
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
