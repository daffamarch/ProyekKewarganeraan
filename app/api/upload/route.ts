import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentId = formData.get('documentId') as string;
    const unit = formData.get('unit') as string;
    const formatReq = formData.get('formatReq') as string;

    if (!file || !documentId || !unit || !formatReq) {
      return NextResponse.json(
        { error: 'Field wajib tidak lengkap (file, documentId, unit, formatReq).' },
        { status: 400 }
      );
    }

    // --- Validasi ukuran file (maksimal 5MB) ---
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File terlalu besar. Ukuran maksimal adalah 5MB.` },
        { status: 400 }
      );
    }

    // --- Validasi format file ---
    const ext = file.name.split('.').pop()?.toUpperCase() || '';
    const req = formatReq.toUpperCase();
    let isValid = false;
    if (req === 'PDF' && ext === 'PDF') isValid = true;
    else if (req === 'JPG' && ['JPG', 'JPEG', 'PNG'].includes(ext)) isValid = true;
    else if (req === 'EXCEL' && ['XLSX', 'XLS', 'CSV'].includes(ext)) isValid = true;
    else if (req === 'MP4' && ext === 'MP4') isValid = true;

    if (!isValid) {
      return NextResponse.json(
        { error: `Format salah. Dokumen ini wajib berformat ${req}, bukan .${ext}.` },
        { status: 400 }
      );
    }

    const safeFileName = `${documentId}_${Date.now()}.${ext.toLowerCase()}`;
    const relativePath = `${unit}/${safeFileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // --- Simpan file ke Supabase Storage ---
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('dokumen-sidoku')
      .upload(relativePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Gagal mengunggah ke Supabase Storage: ${uploadError.message}`);
    }

    // --- Update metadata di Supabase ---
    const { error: dbError } = await supabase
      .from('audit_documents')
      .update({
        file_url: relativePath,
        is_uploaded: true,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(documentId));

    if (dbError) throw dbError;

    return NextResponse.json({
      status: 'ok',
      message: 'File berhasil disimpan.',
      path: relativePath,
      fileName: safeFileName,
    });
  } catch (err: any) {
    console.error('Upload gagal:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal menyimpan file.' },
      { status: 500 }
    );
  }
}
