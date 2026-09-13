import { NextRequest, NextResponse } from 'next/server';
import { fetchYtTracks, fetchSongsDirectly } from '@/src/lib/musicServer';

export const dynamic = 'force-dynamic';

const genreDataCache: Record<string, { data: any; timestamp: number }> = {};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const genre = ((searchParams.get('genre') || searchParams.get('name') || 'Chill') as string).trim();
  const cacheKey = genre.toLowerCase();
  const now = Date.now();

  if (genreDataCache[cacheKey] && now - genreDataCache[cacheKey].timestamp < 600000) {
    return NextResponse.json(genreDataCache[cacheKey].data);
  }

  try {
    const feelingQuery = `feeling ${genre} music`;
    const hitsQuery = `${genre} hits songs`;
    const popQuery = `best of ${genre} playlist`;

    let [feelingTracks, hitTracks, moreTracks] = await Promise.all([
      fetchYtTracks(feelingQuery),
      fetchYtTracks(hitsQuery),
      fetchYtTracks(popQuery),
    ]);

    if (feelingTracks.length === 0) feelingTracks = await fetchSongsDirectly(feelingQuery);
    if (hitTracks.length === 0) hitTracks = await fetchSongsDirectly(hitsQuery);
    if (moreTracks.length === 0) moreTracks = await fetchSongsDirectly(popQuery);

    const result = {
      genre,
      feelingTitle: `Feeling ${genre.toLowerCase()}`,
      hitsTitle: `${genre} hits`,
      feelingTracks: feelingTracks.slice(0, 15),
      hitTracks: hitTracks.slice(0, 15),
      moreTracks: moreTracks.slice(0, 15),
    };

    genreDataCache[cacheKey] = { data: result, timestamp: now };
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error in /api/genre:', err);
    return NextResponse.json({ error: 'Failed to fetch genre data' }, { status: 500 });
  }
}
