import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Validate Vercel Cron authorization header
    const authHeader = request.headers.get('authorization');
    
    // In production, require CRON_SECRET validation.
    // If CRON_SECRET is defined, compare it.
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Perform a lightweight query on Supabase 'audit_documents' table to keep the connection alive
    const { data, error } = await supabase
      .from('audit_documents')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase ping successful, connection active.',
      timestamp: new Date().toISOString(),
      recordCount: data?.length || 0
    });
  } catch (err: any) {
    console.error('Keepalive ping failed:', err);
    return NextResponse.json({
      status: 'error',
      message: err.message || 'Database ping query failed'
    }, { status: 500 });
  }
}
