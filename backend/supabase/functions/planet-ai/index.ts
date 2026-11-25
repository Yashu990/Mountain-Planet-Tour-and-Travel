// planet-ai — the in-app travel assistant, powered by Claude.
//
// POST { messages: [{ role: 'user' | 'assistant', content: string }, ...] }
//   → 200 { reply, tours: string[], guides: string[], link: { label, to } | null, chips: string[] }
//   → 503 { fallback: true }  when no API key is set or Claude can't answer; the app then uses
//                             its built-in rule-based assistant, so chat never breaks.
//
// Secret: ANTHROPIC_API_KEY (console.anthropic.com → API keys)
import '@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { adminClient, cors, json } from '../_shared/supabase.ts';

const MAX_TURNS = 12;
const MAX_CHARS = 1500;

// Screens the assistant may link to (anything else is dropped).
const LINKS: Record<string, string> = {
  '/plan': 'Free trip quote form',
  '/stays': 'Hotels & homestays',
  '/stays?kind=homestay': 'Homestays',
  '/stays?kind=hotel': 'Hotels',
  '/book/flight': 'Domestic flight booking',
  '/book/cab': 'Cab / airport transfer booking',
  '/book/ticket': 'Activity tickets (paragliding, rafting, safari…)',
  '/bookings': 'My bookings',
  '/tools': 'Trek tools: weather, altitude check, packing list, emergency numbers',
  '/destinations': 'All destinations',
  '/explore': 'Search all journeys',
};

const Reply = z.object({
  reply: z.string().describe('Answer for the traveller. Plain text; **bold** allowed; short paragraphs or "•" bullets; under 120 words.'),
  tours: z.array(z.string()).describe('Up to 3 tour slugs from the catalogue that fit the request; empty if none.'),
  guides: z.array(z.string()).describe('Up to 2 guide slugs from the catalogue if relevant; usually empty.'),
  link: z.object({ label: z.string(), to: z.string() }).nullable().describe('One helpful screen link from the allowed list, or null.'),
  chips: z.array(z.string()).describe('2–4 short follow-up suggestions the traveller might tap next (max 5 words each).'),
});

let client: Anthropic | null = null;

async function catalogue() {
  const admin = adminClient();
  const [t, g, s] = await Promise.all([
    admin.from('tours').select('slug, title, region, category, days, price_usd, difficulty, max_alt_m, season, summary').eq('published', true).order('sort_order'),
    admin.from('guides').select('slug, title, kicker').eq('published', true).order('sort_order'),
    admin.from('stays').select('kind, name, city, price_usd_night, is_sample').eq('published', true).order('sort_order'),
  ]);
  return { tours: t.data ?? [], guides: g.data ?? [], stays: s.data ?? [] };
}

function systemPrompt(c: Awaited<ReturnType<typeof catalogue>>) {
  const tours = c.tours
    .map((t) => `- ${t.slug} | ${t.title} | ${t.category} | ${t.region} | ${t.days} days | from $${t.price_usd} pp | ${t.difficulty} | max ${t.max_alt_m} m | best ${t.season} | ${t.summary}`)
    .join('\n');
  const guides = c.guides.map((g) => `- ${g.slug} | ${g.title} (${g.kicker})`).join('\n');
  const stays = c.stays.map((s) => `- ${s.kind}: ${s.name}, ${s.city}${s.is_sample ? ' (sample listing)' : ''}${s.price_usd_night != null ? `, from $${s.price_usd_night}/night` : ', price on request'}`).join('\n');
  const links = Object.entries(LINKS).map(([to, what]) => `- ${to} — ${what}`).join('\n');
  return `You are Planet AI, the travel assistant inside the Mountain Planet Nepal app. Mountain Planet is a Kathmandu-based company that runs treks, peak climbs, tours, safaris and adventures in Nepal, and also books hotels, homestays, domestic flights, cabs/airport transfers and activity tickets. One local team handles the whole trip, airport to airport.

How to help:
- Be warm, concise and practical, like a knowledgeable Nepali guide. Use "Namaste" only when greeting.
- Recommend trips only from the catalogue below and refer to them by their exact slug in "tours". Match the traveller's days, budget, fitness and interests; say briefly why each fits.
- Prices are "from" prices per person in USD; final prices come from the team's quote. Never invent prices, dates, availability, permits costs or discounts that are not in the catalogue.
- For bookings, quotes or anything needing a human, point to the right screen in "link" (allowed list below) — the team replies within 24 hours.
- Safety: for altitude sickness symptoms advise stopping the ascent, telling the guide, and descending if worse; emergencies: Tourist Police 1144. Do not give medical diagnoses.
- If asked about something unrelated to travel in Nepal or this app, say briefly that you help with Nepal travel and offer a related suggestion.

Catalogue — tours (slug | title | category | region | length | price | difficulty | altitude | season | summary):
${tours}

Guides (slug | title):
${guides}

Stays:
${stays}

Allowed screen links:
${links}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ fallback: true, reason: 'not configured' }, 503);

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Send JSON.' }, 400);
  }
  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages: Anthropic.MessageParam[] = raw
    .filter((m): m is { role: 'user' | 'assistant'; content: string } => !!m && typeof m === 'object' && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim() !== '')
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'The last message must be from the traveller.' }, 400);

  try {
    const cat = await catalogue();
    client ??= new Anthropic();
    const response = await client.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      output_config: { effort: 'low', format: zodOutputFormat(Reply) },
      // Stable system prompt first, cached between requests.
      system: [{ type: 'text', text: systemPrompt(cat), cache_control: { type: 'ephemeral' } }],
      messages,
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) return json({ fallback: true, reason: response.stop_reason }, 503);

    // Keep only real catalogue entries and allowed links.
    const out = response.parsed_output;
    const tourSlugs = new Set(cat.tours.map((t) => t.slug));
    const guideSlugs = new Set(cat.guides.map((g) => g.slug));
    return json({
      reply: out.reply,
      tours: out.tours.filter((s) => tourSlugs.has(s)).slice(0, 3),
      guides: out.guides.filter((s) => guideSlugs.has(s)).slice(0, 2),
      link: out.link && LINKS[out.link.to] ? { label: out.link.label.slice(0, 40), to: out.link.to } : null,
      chips: out.chips.map((c) => c.slice(0, 40)).slice(0, 4),
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) console.error('planet-ai rate limited');
    else if (e instanceof Anthropic.APIError) console.error('planet-ai api error', e.status, e.message);
    else console.error('planet-ai error', e);
    return json({ fallback: true, reason: 'error' }, 503);
  }
});
