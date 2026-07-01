// Maps 5sim country slugs to ISO-3166-1 alpha-2 codes for flag rendering.
// 5sim returns internal slugs (e.g., "kazakhstan", "united_kingdom") that don't
// match ISO codes when sliced. This mapping ensures the correct flag is shown.
export const FIVESIM_COUNTRY_ISO: Record<string, string> = {
  afghanistan: 'af', albania: 'al', algeria: 'dz', angola: 'ao', anguilla: 'ai',
  antiguaandbarbuda: 'ag', argentina: 'ar', armenia: 'am', aruba: 'aw',
  australia: 'au', austria: 'at', azerbaijan: 'az', bahamas: 'bs', bahrain: 'bh',
  bangladesh: 'bd', barbados: 'bb', belarus: 'by', belgium: 'be', belize: 'bz',
  benin: 'bj', bermuda: 'bm', bhutan: 'bt', bih: 'ba', bosnia: 'ba',
  bosniaandherzegovina: 'ba', bolivia: 'bo', botswana: 'bw', brazil: 'br',
  britishvirginislands: 'vg', brunei: 'bn', bulgaria: 'bg', burkinafaso: 'bf',
  burundi: 'bi', cambodia: 'kh', cameroon: 'cm', canada: 'ca', capeverde: 'cv',
  caymanislands: 'ky', centralafricanrepublic: 'cf', chad: 'td', chile: 'cl',
  china: 'cn', colombia: 'co', comoros: 'km', congo: 'cg', costarica: 'cr',
  cotedivoire: 'ci', ivorycoast: 'ci', croatia: 'hr', cuba: 'cu', cyprus: 'cy',
  czech: 'cz', czechrepublic: 'cz', denmark: 'dk', djibouti: 'dj', dominica: 'dm',
  dominicanrepublic: 'do', dr_congo: 'cd', drc: 'cd', ecuador: 'ec', egypt: 'eg',
  elsalvador: 'sv', england: 'gb', equatorialguinea: 'gq', eritrea: 'er',
  estonia: 'ee', eswatini: 'sz', ethiopia: 'et', faroeislands: 'fo', fiji: 'fj',
  finland: 'fi', france: 'fr', frenchguiana: 'gf', gabon: 'ga', gambia: 'gm',
  georgia: 'ge', germany: 'de', ghana: 'gh', gibraltar: 'gi', greece: 'gr',
  greenland: 'gl', grenada: 'gd', guadeloupe: 'gp', guam: 'gu', guatemala: 'gt',
  guinea: 'gn', guineabissau: 'gw', guyana: 'gy', haiti: 'ht', honduras: 'hn',
  hongkong: 'hk', hungary: 'hu', iceland: 'is', india: 'in', indonesia: 'id',
  iran: 'ir', iraq: 'iq', ireland: 'ie', israel: 'il', italy: 'it',
  jamaica: 'jm', japan: 'jp', jordan: 'jo', kazakhstan: 'kz', kenya: 'ke',
  kingdomofbahrain: 'bh', kiribati: 'ki', kosovo: 'xk', kuwait: 'kw',
  kyrgyzstan: 'kg', laos: 'la', latvia: 'lv', lebanon: 'lb', lesotho: 'ls',
  liberia: 'lr', libya: 'ly', liechtenstein: 'li', lithuania: 'lt',
  luxembourg: 'lu', macau: 'mo', macao: 'mo', madagascar: 'mg', malawi: 'mw',
  malaysia: 'my', maldives: 'mv', mali: 'ml', malta: 'mt', martinique: 'mq',
  mauritania: 'mr', mauritius: 'mu', mexico: 'mx', moldova: 'md', monaco: 'mc',
  mongolia: 'mn', montenegro: 'me', montserrat: 'ms', morocco: 'ma',
  mozambique: 'mz', myanmar: 'mm', namibia: 'na', nauru: 'nr', nepal: 'np',
  netherlands: 'nl', newcaledonia: 'nc', newzealand: 'nz', nicaragua: 'ni',
  niger: 'ne', nigeria: 'ng', northernmarianaislands: 'mp', northmacedonia: 'mk',
  macedonia: 'mk', northkorea: 'kp', norway: 'no', oman: 'om', pakistan: 'pk',
  palau: 'pw', palestine: 'ps', panama: 'pa', papuanewguinea: 'pg', paraguay: 'py',
  peru: 'pe', philippines: 'ph', poland: 'pl', portugal: 'pt', puertorico: 'pr',
  qatar: 'qa', reunion: 're', romania: 'ro', russia: 'ru', rwanda: 'rw',
  saintbarthelemy: 'bl', saintkittsandnevis: 'kn', saintlucia: 'lc',
  saintpierreandmiquelon: 'pm', saintvincentandgrenadines: 'vc', samoa: 'ws',
  sanmarino: 'sm', saotomeandprincipe: 'st', saudiarabia: 'sa', senegal: 'sn',
  serbia: 'rs', seychelles: 'sc', sierraleone: 'sl', singapore: 'sg',
  sintmaarten: 'sx', slovakia: 'sk', slovenia: 'si', solomonislands: 'sb',
  somalia: 'so', southafrica: 'za', southkorea: 'kr', southsudan: 'ss',
  spain: 'es', srilanka: 'lk', sudan: 'sd', suriname: 'sr', swaziland: 'sz',
  sweden: 'se', switzerland: 'ch', syria: 'sy', taiwan: 'tw', tajikistan: 'tj',
  tanzania: 'tz', thailand: 'th', timorleste: 'tl', togo: 'tg', tonga: 'to',
  trinidadtobago: 'tt', tunisia: 'tn', turkey: 'tr', turkmenistan: 'tm',
  turksandcaicos: 'tc', uganda: 'ug', ukraine: 'ua', uae: 'ae',
  unitedarabemirates: 'ae', uk: 'gb', unitedkingdom: 'gb', usa: 'us',
  unitedstates: 'us', uruguay: 'uy', usvirginislands: 'vi', uzbekistan: 'uz',
  vanuatu: 'vu', vaticancity: 'va', venezuela: 've', vietnam: 'vn', yemen: 'ye',
  zambia: 'zm', zimbabwe: 'zw',
};

/** Resolve a 5sim country slug (or ISO code) to a lowercase alpha-2 ISO code
 *  suitable for `https://flagcdn.com/w80/<iso>.png`. Falls back to first-two
 *  chars only when nothing else matches. */
export function isoForCountry(input?: string | null): string {
  if (!input) return '';
  const raw = String(input).toLowerCase().trim();
  const key = raw.replace(/[^a-z]/g, '');
  if (FIVESIM_COUNTRY_ISO[key]) return FIVESIM_COUNTRY_ISO[key];
  // Some slugs use hyphens/underscores (e.g., "united_kingdom"). Try that too.
  const alt = raw.replace(/[-_\s]/g, '');
  if (FIVESIM_COUNTRY_ISO[alt]) return FIVESIM_COUNTRY_ISO[alt];
  // Last resort: 2-letter fallback (works for many ISO-2 short slugs).
  return key.slice(0, 2);
}
