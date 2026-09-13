import { NextRequest, NextResponse } from 'next/server';
import { searchInternalMusic } from '@/src/lib/musicServer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchInternalMusic(query);
    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('Search error:', err);
    return NextResponse.json({ error: 'Failed to search songs', message: err?.message }, { status: 500 });
  }
}
