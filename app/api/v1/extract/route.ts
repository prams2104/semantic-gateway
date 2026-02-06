import { NextRequest, NextResponse } from 'next/server';
import { getUserByApiKey, trackUsage, checkQuotaLimit } from '@/lib/db';
import { extractContent, estimateStandardTokens } from '@/lib/extract';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ExtractRequest {
  url: string;
  format?: 'markdown' | 'json' | 'both';
  include_pdfs?: boolean;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Validate API Key
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required. Include it in X-API-Key header or Authorization: Bearer header' },
        { status: 401 }
      );
    }

    const keyData = await getUserByApiKey(apiKey);
    
    if (!keyData) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // 2. Check quota
    const hasQuota = await checkQuotaLimit(keyData.userId);
    
    if (!hasQuota) {
      return NextResponse.json(
        { 
          error: 'Quota exceeded',
          message: 'You have reached your monthly query limit. Please upgrade your plan.',
          upgrade_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
        },
        { status: 429 }
      );
    }

    // 3. Parse request body
    const body: ExtractRequest = await request.json();
    const { url, format = 'both', include_pdfs = true } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // 4. Extract content
    const extracted = await extractContent(url, include_pdfs);

    // 5. Calculate metrics
    const processingTime = Date.now() - startTime;
    const tokensSaved = extracted.tokensOriginal - extracted.tokensExtracted;
    const costSaved = (tokensSaved / 1000) * 0.03;

    // 6. Track usage
    await trackUsage(
      keyData.userId,
      url,
      extracted.tokensExtracted,
      processingTime,
      true
    );

    // 7. Format response
    const response = {
      url,
      ...(format === 'markdown' || format === 'both' ? { markdown: extracted.markdown } : {}),
      ...(format === 'json' || format === 'both' ? { structured_data: extracted.structured } : {}),
      pdfs_extracted: extracted.pdfs,
      meta: {
        processing_time_ms: processingTime,
        tokens_original: extracted.tokensOriginal,
        tokens_extracted: extracted.tokensExtracted,
        tokens_saved: tokensSaved,
        tokens_saved_percent: Math.round((tokensSaved / extracted.tokensOriginal) * 100),
        cost_saved_usd: parseFloat(costSaved.toFixed(4))
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Processing-Time-Ms': processingTime.toString(),
        'X-Tokens-Saved': tokensSaved.toString(),
        'X-RateLimit-Remaining': (keyData.user.subscription?.queriesLimit - keyData.user.subscription?.queriesUsed - 1).toString()
      }
    });

  } catch (error) {
    console.error('Extraction API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Extraction failed',
        message: error.message,
        docs: `${process.env.NEXT_PUBLIC_APP_URL}/docs`
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: 'Semantic Gateway API',
    version: '1.0',
    endpoints: {
      extract: 'POST /api/v1/extract',
    },
    documentation: `${process.env.NEXT_PUBLIC_APP_URL}/docs`,
    status: 'operational'
  });
}