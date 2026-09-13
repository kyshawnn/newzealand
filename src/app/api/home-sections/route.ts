import { NextResponse } from 'next/server';
import { homeSectionsData } from '@/src/lib/homeData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(homeSectionsData);
  } catch (err) {
    console.error('Error serving /api/home-sections:', err);
    return NextResponse.json({ error: 'Failed to load home sections' }, { status: 500 });
  }
}
