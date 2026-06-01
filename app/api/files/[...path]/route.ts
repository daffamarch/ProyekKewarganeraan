import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  csv: 'text/csv',
  mp4: 'video/mp4',
};

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const relativePath = params.path.join('/');

    // Download from Supabase Storage
    const { data, error } = await supabase.storage
      .from('dokumen-sidoku')
      .download(relativePath);

    if (error || !data) {
      throw new Error(error?.message || 'File tidak ditemukan');
    }

    const ext = relativePath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const fileArrayBuffer = await data.arrayBuffer();

    return new NextResponse(Buffer.from(fileArrayBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${relativePath.split('/').pop()}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 404 });
  }
}
