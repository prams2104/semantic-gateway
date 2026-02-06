interface ExtractionResult {
  markdown: string;
  structured: {
    title?: string;
    description?: string;
  };
  pdfs: string[];
  tokensOriginal: number;
  tokensExtracted: number;
}

export async function extractContent(url: string, includePdfs: boolean = true): Promise<ExtractionResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SemanticGatewayBot/1.0'
      }
    });
    
    const html = await response.text();
    const markdown = htmlToMarkdown(html);
    const structured = parseStructuredData(html);
    
    return {
      markdown,
      structured,
      pdfs: [],
      tokensOriginal: Math.ceil(html.length / 4),
      tokensExtracted: Math.ceil(markdown.length / 4)
    };
  } catch (error: any) {
    throw new Error(`Extraction failed: ${error.message}`);
  }
}

function htmlToMarkdown(html: string): string {
  let markdown = html;
  
  markdown = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  markdown = markdown.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
  
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  markdown = markdown.replace(/<[^>]+>/g, '');
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
  
  return markdown;
}

function parseStructuredData(html: string): ExtractionResult['structured'] {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : undefined;
  
  const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
  const description = descriptionMatch ? descriptionMatch[1] : undefined;
  
  return {
    title,
    description,
  };
}

export function estimateStandardTokens(url: string): number {
  return 12500;
}