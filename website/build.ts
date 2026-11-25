// Builds the Mountain Planet website into website/dist from the app's own data.
//   node build.ts            (Node 22.18+ runs TypeScript directly)
// Pages: home, every tour / guide / destination / stay (the links the app shares),
// privacy, terms, 404, plus the app-link verification files in /.well-known.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tours, guides, CONTACT, type Tour } from '../mobile/src/data/tours.ts';
import { destinations, slug as destSlug } from '../mobile/src/data/destinations.ts';
import { stories as placeStories } from '../mobile/src/data/placeStories.ts';
import { stays } from '../mobile/src/data/stays.ts';
import { LEGAL_UPDATED, privacySections, termsSections } from '../mobile/src/data/legal.ts';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, 'dist');
const SITE = 'https://mountainplanetnepal.com';
// Fill in once the app is in the stores (leave empty to show "coming soon").
const PLAY_URL = '';
const APPSTORE_URL = '';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const imgUrl = (p: string) => (p.startsWith('http') ? p : p.replace(/^\/img\//, '/img/'));
const usd = (n: number) => '$' + n.toLocaleString('en-US');

function page(opts: { path: string; title: string; description: string; image?: string; body: string; appPath?: string }) {
  const url = SITE + opts.path;
  const image = SITE + (opts.image ? imgUrl(opts.image) : '/img/hero.jpg');
  const deep = opts.appPath ? `mountainplanet://${opts.appPath.replace(/^\//, '')}` : 'mountainplanet://';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.title)}</title><meta name="description" content="${esc(opts.description)}"><link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(opts.title)}"><meta property="og:description" content="${esc(opts.description)}"><meta property="og:image" content="${image}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/brand/icon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=Inter:wght@400;500;600;700&display=swap"><link rel="stylesheet" href="/styles.css"></head>
<body><header class="top"><a class="brand" href="/"><img src="/brand/logo-mark.png" alt="" width="52" height="30"><span>Mountain Planet</span></a><a class="btn soft" href="${deep}">Open in app</a></header>
<main>${opts.body}</main>
<footer><div class="wrap"><p class="serif">Heaven is a myth, Himalayas are real</p><p>${esc(CONTACT.address)} · <a href="mailto:${CONTACT.email}">${CONTACT.email}</a></p><p><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p></div></footer></body></html>`;
}

const storeButtons = () =>
  PLAY_URL || APPSTORE_URL
    ? `<div class="row">${PLAY_URL ? `<a class="btn" href="${PLAY_URL}">Get it on Google Play</a>` : ''}${APPSTORE_URL ? `<a class="btn" href="${APPSTORE_URL}">Download on the App Store</a>` : ''}</div>`
    : `<p class="muted">The app is coming soon to Google Play and the App Store. Meanwhile, write to <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>.</p>`;

const tourCard = (t: Tour) => `<a class="card" href="/tour/${t.slug}/"><img src="${imgUrl(t.img)}" alt="${esc(t.title)}" loading="lazy"><div><span class="kicker">${esc(t.category)} · ${esc(t.region)}</span><h3>${esc(t.title)}</h3><p class="muted">${t.days === 1 ? '1 day' : `${t.days} days`} · ${esc(t.difficulty)} · from ${usd(t.price)}</p></div></a>`;

function write(path: string, html: string) {
  const file = join(OUT, path, path.endsWith('.html') ? '' : 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(here, '../mobile/assets/img'), join(OUT, 'img'), { recursive: true });
mkdirSync(join(OUT, 'brand'), { recursive: true });
for (const f of ['logo-mark.png', 'icon.png', 'logo-full.png']) cpSync(join(here, '../mobile/assets/brand', f), join(OUT, 'brand', f));
cpSync(join(here, 'styles.css'), join(OUT, 'styles.css'));

// Home
write('/', page({
  path: '/',
  title: 'Mountain Planet Nepal · Treks, Tours & Himalayan Adventures',
  description: 'Treks, peak climbs, hotels, homestays, flights and rides in Nepal — one Kathmandu team runs your whole trip.',
  body: `<section class="hero" style="background-image:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.15)),url(/img/hero.jpg)"><div class="wrap"><p class="kicker light">Mountain Planet Nepal</p><h1>Heaven is a myth.<br>The Himalayas are real.</h1><p class="lead">Treks, stays, rides and flights — one Kathmandu team, airport to airport.</p>${storeButtons()}</div></section>
<section class="wrap"><p class="kicker">Journeys</p><h2>Pin your Himalayan dreams</h2><div class="grid">${tours.map(tourCard).join('')}</div></section>
<section class="wrap"><p class="kicker">Destinations</p><h2>Real places, real heights</h2><div class="chips">${destinations.map((d) => `<a class="chip" href="/destinations/${destSlug(d.name)}/">${esc(d.name)} · ${esc(d.alt)}</a>`).join('')}</div></section>
<section class="wrap"><p class="kicker">Travel guides</p><h2>Before you go</h2><div class="grid">${guides.map((g) => `<a class="card" href="/guide/${g.slug}/"><img src="${imgUrl(g.img)}" alt="" loading="lazy"><div><span class="kicker">${esc(g.kicker)}</span><h3>${esc(g.title)}</h3><p class="muted">${g.minutes} min read</p></div></a>`).join('')}</div></section>`,
}));

// Tours
for (const t of tours) {
  write(`/tour/${t.slug}/`, page({
    path: `/tour/${t.slug}/`,
    title: `${t.title} · Mountain Planet Nepal`,
    description: t.summary,
    image: t.img,
    appPath: `/tour/${t.slug}`,
    body: `<section class="hero tall" style="background-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.55)),url(${imgUrl(t.img)})"><div class="wrap"><p class="kicker light">${esc(t.category)} · ${esc(t.region)}</p><h1>${esc(t.title)}</h1></div></section>
<article class="wrap narrow"><div class="stats">${[['Days', String(t.days)], ['Level', t.difficulty], ['Max alt', `${t.maxAlt.toLocaleString('en-US')} m`], ['From', usd(t.price)]].map(([k, v]) => `<div><span class="kicker">${k}</span><b>${esc(v)}</b></div>`).join('')}</div>
<p class="lead dark">${esc(t.summary)}</p><p class="muted">Best season: ${esc(t.season)} · ★ ${t.rating.toFixed(1)} (${t.reviews} reviews)</p>
<h2>Highlights</h2><ul>${t.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
<h2>Itinerary</h2><ol class="steps">${t.itinerary.map((d) => `<li><span class="kicker">${esc(d.day)}</span>${esc(d.title)}</li>`).join('')}</ol>
<h2>Included</h2><div class="chips">${t.includes.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>
<div class="cta"><a class="btn" href="mountainplanet://tour/${t.slug}">Open in the app to enquire</a><a class="btn soft" href="mailto:${CONTACT.email}?subject=${encodeURIComponent('Trip enquiry: ' + t.title)}">Email us</a></div></article>`,
  }));
}

// Guides
for (const g of guides) {
  write(`/guide/${g.slug}/`, page({
    path: `/guide/${g.slug}/`, title: `${g.title} · Mountain Planet Nepal`, description: g.intro, image: g.img, appPath: `/guide/${g.slug}`,
    body: `<section class="hero tall" style="background-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.55)),url(${imgUrl(g.img)})"><div class="wrap"><p class="kicker light">${esc(g.kicker)}</p><h1>${esc(g.title)}</h1></div></section>
<article class="wrap narrow"><p class="lead dark">${esc(g.intro)}</p>${g.sections.map((s, i) => `<h2><span class="num">${String(i + 1).padStart(2, '0')}</span> ${esc(s.h)}</h2><p>${esc(s.p)}</p>`).join('')}</article>`,
  }));
}

// Destinations
for (const d of destinations) {
  const info = placeStories[d.name];
  const s = destSlug(d.name);
  const here2 = tours.filter((t) => `${t.title} ${t.region} ${t.tags.join(' ')}`.toLowerCase().includes(d.q));
  write(`/destinations/${s}/`, page({
    path: `/destinations/${s}/`, title: `${d.name} · Mountain Planet Nepal`, description: d.fact, image: d.img, appPath: `/destinations/${s}`,
    body: `<section class="hero tall" style="background-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.55)),url(${imgUrl(d.img)})"><div class="wrap"><p class="kicker light">${esc(d.area)} · ${esc(d.alt)}</p><h1>${esc(d.name)}</h1></div></section>
<article class="wrap narrow"><p class="lead dark">${esc(info?.story ?? d.fact)}</p><p class="muted">Best time: ${esc(d.best)}</p>${info?.highlights?.length ? `<h2>Don’t miss</h2><ul>${info.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
${here2.length ? `<h2>Journeys in ${esc(d.name)}</h2><div class="grid">${here2.map(tourCard).join('')}</div>` : ''}</article>`,
  }));
}

// Stays
for (const st of stays) {
  write(`/stays/${st.slug}/`, page({
    path: `/stays/${st.slug}/`, title: `${st.name} · Mountain Planet Nepal`, description: st.description, image: st.images[0], appPath: `/stays/${st.slug}`,
    body: `<section class="hero tall" style="background-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.55)),url(${imgUrl(st.images[0])})"><div class="wrap"><p class="kicker light">${st.kind === 'homestay' ? 'Homestay' : 'Hotel'} · ${esc(st.city)}${st.isSample ? ' · Sample listing' : ''}</p><h1>${esc(st.name)}</h1></div></section>
<article class="wrap narrow"><p class="lead dark">${esc(st.description)}</p><p class="muted">Up to ${st.maxGuests} guests · ${st.bedrooms} bedroom(s) · ${st.priceUsdNight != null ? `from ${usd(st.priceUsdNight)}/night` : 'price on request'}</p>
<div class="chips">${st.amenities.map((a) => `<span class="chip">${esc(a)}</span>`).join('')}</div>
<div class="cta"><a class="btn" href="mountainplanet://stays/${st.slug}">Reserve in the app</a></div></article>`,
  }));
}

// Legal
const legal = (title: string, sections: [string, string][]) => `<article class="wrap narrow"><p class="kicker">Mountain Planet Nepal</p><h1 class="dark">${title}</h1><p class="muted">Last updated ${LEGAL_UPDATED}</p>${sections.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('')}</article>`;
write('/privacy/', page({ path: '/privacy/', title: 'Privacy policy · Mountain Planet Nepal', description: 'How Mountain Planet Nepal handles your data.', body: legal('Privacy policy', privacySections(CONTACT)) }));
write('/terms/', page({ path: '/terms/', title: 'Terms of use · Mountain Planet Nepal', description: 'Terms for booking with Mountain Planet Nepal.', body: legal('Terms of use', termsSections()) }));
write('/404.html', page({ path: '/404', title: 'Page not found · Mountain Planet Nepal', description: 'This path doesn’t exist.', body: `<article class="wrap narrow"><h1 class="dark">This path doesn’t exist</h1><p><a href="/">Back to home</a></p></article>` }));

// App-link verification (fill in the placeholders before launch — see website/README.md).
mkdirSync(join(OUT, '.well-known'), { recursive: true });
writeFileSync(join(OUT, '.well-known/assetlinks.json'), JSON.stringify([{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: 'com.mountainplanetnepal.app', sha256_cert_fingerprints: ['REPLACE_WITH_EAS_SHA256_FINGERPRINT'] } }], null, 2));
writeFileSync(join(OUT, '.well-known/apple-app-site-association'), JSON.stringify({ applinks: { details: [{ appIDs: ['REPLACE_TEAM_ID.com.mountainplanetnepal.app'], components: [{ '/': '/tour/*' }, { '/': '/guide/*' }, { '/': '/destinations/*' }, { '/': '/stays/*' }] }] } }, null, 2));

const count = 1 + tours.length + guides.length + destinations.length + stays.length + 3;
console.log(`Built ${count} pages into ${OUT}`);
