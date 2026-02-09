/**
 * Semantic Gateway — Heuristic Content Parser
 *
 * Extracts menu items, operating hours, and addresses from raw HTML
 * when no JSON-LD structured data is available. All results are
 * lower-confidence suggestions that require operator verification.
 *
 * Dependencies: cheerio (already in the project)
 */

import * as cheerio from 'cheerio';

// ── Types ────────────────────────────────────────────────────────────────────

export interface HeuristicMenuItem {
  name: string;
  description: string | null;
  price: number | null;
  section: string;
  confidence: number;
}

export interface HeuristicHours {
  dayOfWeek: string;
  opens: string;
  closes: string;
  confidence: number;
}

export interface HeuristicAddress {
  streetAddress: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  confidence: number;
}

export interface HeuristicResults {
  menuItems: HeuristicMenuItem[];
  hours: HeuristicHours[];
  addresses: HeuristicAddress[];
  phones: { value: string; confidence: number }[];
}

// ── Main entry ───────────────────────────────────────────────────────────────

export function parseHeuristics(html: string, url: string): HeuristicResults {
  const $ = cheerio.load(html);

  return {
    menuItems: extractMenuItems($),
    hours: extractHours($),
    addresses: extractAddresses($),
    phones: extractPhones($),
  };
}

// ── Menu item extraction ─────────────────────────────────────────────────────

const PRICE_REGEX = /\$\s?(\d{1,4}(?:\.\d{1,2})?)/;

function extractMenuItems($: cheerio.CheerioAPI): HeuristicMenuItem[] {
  const items: HeuristicMenuItem[] = [];
  const seen = new Set<string>();

  // Strategy 1: Elements with menu-related classes containing prices
  const menuSelectors = [
    '[class*="menu-item"]',
    '[class*="menu_item"]',
    '[class*="menuitem"]',
    '[class*="dish"]',
    '[class*="food-item"]',
    '[class*="food_item"]',
    '[class*="menu"] li',
    '[class*="menu"] [class*="item"]',
    '.menu-section li',
    '.menu-category li',
  ];

  for (const selector of menuSelectors) {
    $(selector).each((_, el) => {
      const item = parseMenuElement($, el, 'css-selector');
      if (item && !seen.has(item.name.toLowerCase())) {
        seen.add(item.name.toLowerCase());
        items.push(item);
      }
    });
    if (items.length >= 5) break; // found a good selector, stop trying others
  }

  // Strategy 2: Find price patterns and work backwards to find item names
  if (items.length === 0) {
    // Get all text nodes containing prices
    $('*').each((_, el) => {
      if (items.length >= 80) return; // cap to avoid runaway parsing
      const $el = $(el);
      const children = $el.children().length;

      // Only look at leaf-ish elements (few children) containing a price
      if (children > 3) return;
      const text = $el.text().trim();
      const priceMatch = text.match(PRICE_REGEX);
      if (!priceMatch) return;

      const price = parseFloat(priceMatch[1]);
      // Filter out unreasonable prices (too low or too high for food)
      if (price < 1 || price > 500) return;

      // Try to find the item name: text before the price, or a nearby heading/sibling
      const item = parseContextualMenuItem($, el, price);
      if (item && !seen.has(item.name.toLowerCase())) {
        seen.add(item.name.toLowerCase());
        items.push(item);
      }
    });
  }

  // Strategy 3: Look inside elements with "menu" in their id/class
  if (items.length === 0) {
    $('[id*="menu" i], [class*="menu" i]').each((_, container) => {
      const $container = $(container);
      // Skip navigation menus
      if ($container.is('nav') || $container.closest('nav').length) return;
      if ($container.find('a').length > $container.find('p, li, div').length) return; // nav-like

      $container.find('h3, h4, h5, dt, [class*="title"], [class*="name"]').each((_, el) => {
        if (items.length >= 80) return;
        const name = clean($(el).text());
        if (name.length < 2 || name.length > 80) return;
        // Skip if it looks like a section heading with no price nearby
        if (isBoilerplate(name)) return;

        // Look for a price in the next sibling or parent container
        const parent = $(el).parent();
        const parentText = parent.text();
        const priceMatch = parentText.match(PRICE_REGEX);
        const price = priceMatch ? parseFloat(priceMatch[1]) : null;

        // Look for a description
        const desc = $(el).next('p, span, [class*="desc"]').text().trim();

        const key = name.toLowerCase();
        if (!seen.has(key) && !isBoilerplate(name)) {
          seen.add(key);
          items.push({
            name,
            description: desc.length > 5 && desc.length < 300 ? desc : null,
            price: price && price >= 1 && price <= 500 ? price : null,
            section: findSectionHeading($, el),
            confidence: price ? 0.6 : 0.4,
          });
        }
      });
    });
  }

  return items;
}

function parseMenuElement(
  $: cheerio.CheerioAPI,
  el: any,
  source: string
): HeuristicMenuItem | null {
  const $el = $(el);
  const fullText = $el.text().trim();
  if (fullText.length < 3 || fullText.length > 500) return null;

  const priceMatch = fullText.match(PRICE_REGEX);
  const price = priceMatch ? parseFloat(priceMatch[1]) : null;

  // Try to find the item name from a heading or prominent child
  let name =
    $el.find('h3, h4, h5, [class*="title"], [class*="name"], dt').first().text().trim() ||
    $el.find('strong, b').first().text().trim();

  // Fallback: use the first line of text
  if (!name) {
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 1);
    name = lines[0] || '';
  }

  // Strip price from name
  name = name.replace(PRICE_REGEX, '').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 100) return null;
  if (isBoilerplate(name)) return null;

  // Description: text that isn't the name or price
  const desc = $el.find('p, [class*="desc"], [class*="description"], dd').first().text().trim();

  return {
    name,
    description: desc.length > 5 && desc !== name ? desc : null,
    price: price && price >= 1 && price <= 500 ? price : null,
    section: findSectionHeading($, el),
    confidence: price ? 0.65 : 0.45,
  };
}

function parseContextualMenuItem(
  $: cheerio.CheerioAPI,
  el: any,
  price: number
): HeuristicMenuItem | null {
  const $el = $(el);
  const fullText = clean($el.text());

  // Get text before the price
  const beforePrice = fullText.split(PRICE_REGEX)[0].trim();

  // Try heading/name child first
  let name =
    $el.find('h3, h4, h5, [class*="title"], [class*="name"], strong, b').first().text().trim();

  if (!name && beforePrice.length > 2 && beforePrice.length < 100) {
    name = beforePrice;
  }

  // Try previous sibling
  if (!name) {
    const prev = $el.prev('h3, h4, h5, dt, strong').text().trim();
    if (prev.length > 2 && prev.length < 100) name = prev;
  }

  if (!name || name.length < 2 || isBoilerplate(name)) return null;

  // Strip price from name
  name = name.replace(PRICE_REGEX, '').replace(/\s+/g, ' ').trim();

  // Description
  const descEl = $el.find('p, [class*="desc"], span:not(:has(*))').first();
  const desc = descEl.length ? clean(descEl.text()) : null;

  return {
    name,
    description: desc && desc !== name && desc.length > 5 ? desc : null,
    price,
    section: findSectionHeading($, el),
    confidence: 0.55,
  };
}

function findSectionHeading($: cheerio.CheerioAPI, el: any): string {
  // Walk up and backwards to find the nearest h2/h3 heading
  let current = $(el);
  for (let i = 0; i < 5; i++) {
    const prev = current.prevAll('h2, h3').first();
    if (prev.length) {
      const text = clean(prev.text());
      if (text.length > 1 && text.length < 50) return text;
    }
    const parent = current.parent();
    if (!parent.length || parent.is('body')) break;
    current = parent;
  }
  return 'Menu';
}

// ── Hours extraction ─────────────────────────────────────────────────────────

const DAY_NAMES: Record<string, string> = {
  'mon': 'Monday', 'monday': 'Monday',
  'tue': 'Tuesday', 'tues': 'Tuesday', 'tuesday': 'Tuesday',
  'wed': 'Wednesday', 'wednesday': 'Wednesday',
  'thu': 'Thursday', 'thur': 'Thursday', 'thurs': 'Thursday', 'thursday': 'Thursday',
  'fri': 'Friday', 'friday': 'Friday',
  'sat': 'Saturday', 'saturday': 'Saturday',
  'sun': 'Sunday', 'sunday': 'Sunday',
};

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Time pattern: 11am, 11:00am, 11:00 AM, 11:00, 23:00
const TIME_PATTERN = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/;

// Full hours line: "Monday - Friday: 11am - 10pm" or "Mon: 11:00-22:00"
const HOURS_LINE_REGEX = new RegExp(
  `(${Object.keys(DAY_NAMES).join('|')})(?:\\s*[-–—&,]\\s*(${Object.keys(DAY_NAMES).join('|')}))?` +
  `\\s*[:.]?\\s*` +
  `(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|AM|PM)?)\\s*[-–—to]+\\s*(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|AM|PM)?)`,
  'gi'
);

function extractHours($: cheerio.CheerioAPI): HeuristicHours[] {
  const results: HeuristicHours[] = [];
  const seen = new Set<string>();

  // Look in elements likely to contain hours
  const hoursSelectors = [
    '[class*="hour" i]', '[id*="hour" i]',
    '[class*="schedule" i]', '[id*="schedule" i]',
    '[class*="time" i]', '[id*="time" i]',
    '[class*="opening" i]',
  ];

  let hoursText = '';

  // First try targeted selectors
  for (const sel of hoursSelectors) {
    $(sel).each((_, el) => {
      hoursText += ' ' + $(el).text();
    });
  }

  // Fallback: search the entire body
  if (!hoursText.trim()) {
    hoursText = $('body').text();
  }

  // Parse hours lines
  let match;
  HOURS_LINE_REGEX.lastIndex = 0;
  while ((match = HOURS_LINE_REGEX.exec(hoursText)) !== null) {
    const startDay = DAY_NAMES[match[1].toLowerCase()];
    const endDay = match[2] ? DAY_NAMES[match[2].toLowerCase()] : null;
    const opens = normalizeTime(match[3]);
    const closes = normalizeTime(match[4]);

    if (!startDay || !opens || !closes) continue;

    // Expand day ranges
    const days = endDay ? expandDayRange(startDay, endDay) : [startDay];

    for (const day of days) {
      if (!seen.has(day)) {
        seen.add(day);
        results.push({
          dayOfWeek: day,
          opens,
          closes,
          confidence: hoursSelectors.some(sel => $(sel).length > 0) ? 0.7 : 0.5,
        });
      }
    }
  }

  return results;
}

function normalizeTime(raw: string): string {
  const m = raw.trim().match(TIME_PATTERN);
  if (!m) return '';

  let hours = parseInt(m[1]);
  const minutes = m[2] || '00';
  const ampm = (m[3] || '').toLowerCase();

  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function expandDayRange(start: string, end: string): string[] {
  const si = ALL_DAYS.indexOf(start);
  const ei = ALL_DAYS.indexOf(end);
  if (si < 0 || ei < 0) return [start];

  const days: string[] = [];
  let i = si;
  while (true) {
    days.push(ALL_DAYS[i]);
    if (i === ei) break;
    i = (i + 1) % 7;
    if (days.length > 7) break; // safety
  }
  return days;
}

// ── Address extraction ───────────────────────────────────────────────────────

const US_STATES: Record<string, string> = {
  'AL': 'AL', 'AK': 'AK', 'AZ': 'AZ', 'AR': 'AR', 'CA': 'CA', 'CO': 'CO', 'CT': 'CT',
  'DE': 'DE', 'FL': 'FL', 'GA': 'GA', 'HI': 'HI', 'ID': 'ID', 'IL': 'IL', 'IN': 'IN',
  'IA': 'IA', 'KS': 'KS', 'KY': 'KY', 'LA': 'LA', 'ME': 'ME', 'MD': 'MD', 'MA': 'MA',
  'MI': 'MI', 'MN': 'MN', 'MS': 'MS', 'MO': 'MO', 'MT': 'MT', 'NE': 'NE', 'NV': 'NV',
  'NH': 'NH', 'NJ': 'NJ', 'NM': 'NM', 'NY': 'NY', 'NC': 'NC', 'ND': 'ND', 'OH': 'OH',
  'OK': 'OK', 'OR': 'OR', 'PA': 'PA', 'RI': 'RI', 'SC': 'SC', 'SD': 'SD', 'TN': 'TN',
  'TX': 'TX', 'UT': 'UT', 'VT': 'VT', 'VA': 'VA', 'WA': 'WA', 'WV': 'WV', 'WI': 'WI',
  'WY': 'WY', 'DC': 'DC',
};

// Pattern: "1234 Main St, San Diego, CA 92101"
const ADDRESS_REGEX = /(\d{1,6}\s+[A-Za-z0-9\s.]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Way|Ln|Lane|Ct|Court|Pl|Place|Pkwy|Parkway|Cir|Circle|Hwy|Highway)\.?)\s*,?\s*([A-Za-z\s]+?)\s*,?\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?/g;

function extractAddresses($: cheerio.CheerioAPI): HeuristicAddress[] {
  const results: HeuristicAddress[] = [];
  const seen = new Set<string>();

  // First look in address-likely elements
  const addressSelectors = [
    '[class*="address" i]', '[id*="address" i]',
    '[class*="location" i]', '[id*="location" i]',
    '[itemprop="address"]',
    'address',
    'footer',
  ];

  let searchText = '';

  for (const sel of addressSelectors) {
    $(sel).each((_, el) => {
      searchText += ' ' + $(el).text();
    });
  }

  // Also search body as fallback
  searchText += ' ' + $('body').text();

  let match;
  ADDRESS_REGEX.lastIndex = 0;
  while ((match = ADDRESS_REGEX.exec(searchText)) !== null) {
    const street = match[1].trim();
    const city = match[2].trim();
    const state = match[3].trim();
    const zip = match[4]?.trim() || null;

    if (!US_STATES[state]) continue;
    if (street.length < 5) continue;

    const key = `${street}|${city}|${state}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push({
        streetAddress: street,
        city,
        state,
        postalCode: zip,
        confidence: zip ? 0.7 : 0.55,
      });
    }
  }

  return results;
}

// ── Phone extraction (enhanced) ──────────────────────────────────────────────

function extractPhones($: cheerio.CheerioAPI): { value: string; confidence: number }[] {
  const results: { value: string; confidence: number }[] = [];
  const seen = new Set<string>();

  // High confidence: tel: links
  $('a[href^="tel:"]').each((_, el) => {
    const href = $(el).attr('href')?.replace('tel:', '').trim();
    if (href && href.length >= 10 && !seen.has(href)) {
      seen.add(href);
      results.push({ value: href, confidence: 0.9 });
    }
  });

  // Medium confidence: phone in contact-like elements
  const contactSelectors = [
    '[class*="phone" i]', '[class*="tel" i]', '[class*="contact" i]',
    '[id*="phone" i]', '[id*="contact" i]',
    '[itemprop="telephone"]',
    'footer',
  ];

  const phoneRegex = /(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

  for (const sel of contactSelectors) {
    $(sel).each((_, el) => {
      const text = $(el).text();
      let match;
      phoneRegex.lastIndex = 0;
      while ((match = phoneRegex.exec(text)) !== null) {
        const phone = match[0].trim();
        if (!seen.has(phone) && !/^\d{10,}$/.test(phone.replace(/\D/g, ''))) {
          seen.add(phone);
          results.push({ value: phone, confidence: 0.75 });
        }
      }
    });
  }

  return results;
}

// ── Utilities ────────────────────────────────────────────────────────────────

function clean(t: string): string {
  return t.replace(/\s+/g, ' ').trim();
}

const BOILERPLATE_WORDS = new Set([
  'home', 'about', 'contact', 'menu', 'gallery', 'events', 'press',
  'careers', 'privacy', 'terms', 'login', 'sign in', 'sign up',
  'subscribe', 'newsletter', 'follow us', 'read more', 'learn more',
  'view all', 'see all', 'back to top', 'copyright', 'all rights reserved',
]);

function isBoilerplate(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (BOILERPLATE_WORDS.has(lower)) return true;
  if (lower.length < 2) return true;
  // All caps short strings are often nav items
  if (text === text.toUpperCase() && text.length < 4 && !/\d/.test(text)) return true;
  return false;
}
