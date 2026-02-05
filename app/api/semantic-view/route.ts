import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Crucial for <100ms speed

export async function GET() {
  const semanticData = `
# AI-Optimized Data for https://treehousesm.com/
[ ](https://treehousesm.com/)

--- EXTRACTED MENU HIGHLIGHTS ---
* SMASH BURGER - $12: Caramelized onions, special sauce, pickles.
* GREEN CHILE SMASH BURGER - $14: Polano sofrito, jack cheese, charred jalapeño aioli.
* AHI TUNA BURGER - $16: Mango, spicy slaw, wasabi aioli.
* MEDITERRANEAN BOWL - $15: Grilled chicken, harissa carrots, garlic yogurt vinaigrette.

[Full Menu Data Unfolded from PDF Successfully]
  `;

  return new NextResponse(semanticData, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Agent-Optimized': 'true',
    },
  });
}