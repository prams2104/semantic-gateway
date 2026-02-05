import { NextRequest, NextResponse, userAgent } from 'next/server';

export const config = {
  // Matches everything except static assets like images and CSS
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'], 
};

export default function middleware(request: NextRequest) {
  const { isBot } = userAgent(request);
  const ua = request.headers.get('user-agent') || '';
  
  // Specific check for AI agents that might not be in the standard 'isBot' list
  const isAICrawler = /GPTBot|ChatGPT-User|PerplexityBot|ClaudeBot/i.test(ua);

  if (isBot || isAICrawler) {
    // INTERNAL REWRITE: The AI stays on the same URL but sees your clean Markdown
    // This is the "Bilingual" magic.
    return NextResponse.rewrite(new URL('/api/semantic-view', request.url));
  }

  // Humans proceed to the standard visual website
  return NextResponse.next();
}