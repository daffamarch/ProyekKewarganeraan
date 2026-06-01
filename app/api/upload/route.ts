import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const STORAGE_ROOT = process.env.LOCAL_STORAGE_PATH || 'C:/SIDOKU_FILES';

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

    // --- Buat direktori unit jika belum ada ---
    const unitDir = path.join(STORAGE_ROOT, unit);
    await mkdir(unitDir, { recursive: true });

    // --- Simpan file ke disk ---
    const safeFileName = `${documentId}_${Date.now()}.${ext.toLowerCase()}`;
    const absolutePath = path.join(unitDir, safeFileName);
    const relativePath = `${unit}/${safeFileName}`;

    const bytes = await file.arrayBuffer();
    await writeFile(absolutePath, Buffer.from(bytes));

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
