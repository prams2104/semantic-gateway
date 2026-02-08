import { NextRequest, NextResponse } from 'next/server';
import { extractContent } from '@/lib/extract';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Simple in-memory rate limiter (resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {

    const startTime = Date.now()
    // Rate limit by IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: 'Rate limited',
          message: 'Free calculator is limited to 20 requests per hour. Get an API key for unlimited access.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const extracted = await extractContent(url, true);

    const tokensSaved = extracted.tokensOriginal - extracted.tokensExtracted;
    const costSaved = (tokensSaved / 1000) * 0.03;

    return NextResponse.json({
      url,
      markdown: extracted.markdown,
      structured_data: extracted.structured,
      pdfs_extracted: extracted.pdfs,
      meta: {
        processing_time_ms: Date.now() - startTime, // will be overwritten below
        tokens_original: extracted.tokensOriginal,
        tokens_extracted: extracted.tokensExtracted,
        tokens_saved: tokensSaved,
        tokens_saved_percent:
          extracted.tokensOriginal > 0
            ? Math.round((tokensSaved / extracted.tokensOriginal) * 100)
            : 0,
        cost_saved_usd: parseFloat(costSaved.toFixed(4)),
      },
      quality: extracted.quality,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Extraction failed';
    return NextResponse.json(
      { error: 'Extraction failed', message },
      { status: 500 }
    );
  }
}