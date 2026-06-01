import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const STORAGE_ROOT = process.env.LOCAL_STORAGE_PATH || 'C:/SIDOKU_FILES';

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
    const filePath = path.join(STORAGE_ROOT, ...params.path);

    // Keamanan: pastikan path tidak keluar dari STORAGE_ROOT
    const resolvedPath = path.resolve(filePath);
    const resolvedRoot = path.resolve(STORAGE_ROOT);
    if (!resolvedPath.startsWith(resolvedRoot)) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    // Pastikan file ada
    await stat(resolvedPath);

    const ext = path.extname(resolvedPath).slice(1).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const fileBuffer = await readFile(resolvedPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(resolvedPath)}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 404 });
  }
}
