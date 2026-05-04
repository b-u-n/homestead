/**
 * Country-aware crisis lifeline lookup.
 *
 * Returns the user's regional crisis hotline / text line / fallback URL based on a country
 * code (ISO-3166 alpha-2). When no code is given, best-effort auto-detects from
 * navigator.language → Intl locale → 'US' default.
 *
 * Numbers are point-in-time (early 2026); maintain alongside the Crisis Resources store
 * (PLATFORM_TASKS #63) when that lands.
 */

const LIFELINES = {
  US: { name: '988 Suicide & Crisis Lifeline', tel: '988', sms: '988', sms_label: 'Text 988' },
  CA: { name: '988 Suicide Crisis Helpline (Canada)', tel: '988', sms: '988', sms_label: 'Text 988' },
  GB: { name: 'Samaritans (UK)', tel: '116 123', sms: '85258', sms_label: 'Text SHOUT to 85258' },
  UK: { name: 'Samaritans (UK)', tel: '116 123', sms: '85258', sms_label: 'Text SHOUT to 85258' },
  IE: { name: 'Samaritans Ireland', tel: '116 123', sms: '50808', sms_label: 'Text HELLO to 50808' },
  AU: { name: 'Lifeline Australia', tel: '13 11 14', sms: '0477 13 11 14', sms_label: 'Text 0477 13 11 14' },
  NZ: { name: '1737 — Need to talk?', tel: '1737', sms: '1737', sms_label: 'Text 1737' },
  DE: { name: 'Telefonseelsorge', tel: '0800 111 0 111', sms: null },
  AT: { name: 'Telefonseelsorge Österreich', tel: '142', sms: null },
  CH: { name: 'Die Dargebotene Hand', tel: '143', sms: null },
  FR: { name: 'Suicide Écoute', tel: '01 45 39 40 00', sms: null },
  BE: { name: 'Centre de Prévention du Suicide', tel: '0800 32 123', sms: null },
  ES: { name: 'Teléfono de la Esperanza', tel: '717 003 717', sms: null },
  IT: { name: 'Telefono Amico', tel: '02 2327 2327', sms: null },
  NL: { name: '113 Zelfmoordpreventie', tel: '113', sms: null },
  PT: { name: 'SOS Voz Amiga', tel: '213 544 545', sms: null },
  PL: { name: 'Antydepresyjny Telefon Forum', tel: '22 594 91 00', sms: null },
  SE: { name: 'Mind Självmordslinjen', tel: '901 01', sms: null },
  NO: { name: 'Mental Helse Hjelpetelefonen', tel: '116 123', sms: null },
  DK: { name: 'Livslinien', tel: '70 201 201', sms: null },
  FI: { name: 'MIELI Kriisipuhelin', tel: '09 2525 0111', sms: null },
  IN: { name: 'iCall', tel: '9152987821', sms: null },
  JP: { name: 'TELL Lifeline (English)', tel: '03-5774-0992', sms: null },
  KR: { name: 'Korea Lifeline', tel: '1588-9191', sms: null },
  CN: { name: 'Beijing Suicide Research and Prevention Center', tel: '010-82951332', sms: null },
  HK: { name: 'The Samaritans Hong Kong', tel: '2896 0000', sms: null },
  SG: { name: 'Samaritans of Singapore', tel: '1767', sms: null },
  ZA: { name: 'SADAG', tel: '0800 567 567', sms: '31393', sms_label: 'Text 31393' },
  BR: { name: 'CVV', tel: '188', sms: null },
  AR: { name: 'Centro de Asistencia al Suicida', tel: '135', sms: null },
  MX: { name: 'SAPTEL', tel: '55 5259-8121', sms: null },
};

const FALLBACK = {
  name: 'International — findahelpline.com',
  tel: null,
  sms: null,
  url: 'https://findahelpline.com/',
};

export function detectCountryCode() {
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const parts = navigator.language.split('-');
      if (parts.length > 1) return parts[1].toUpperCase();
    }
  } catch {}
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      const parts = locale.split('-');
      if (parts.length > 1) return parts[1].toUpperCase();
    }
  } catch {}
  return 'US';
}

export function getCrisisLifeline(countryCode) {
  const code = (countryCode || detectCountryCode()).toUpperCase();
  return { ...LIFELINES[code], code, fallback: !LIFELINES[code] } || { ...FALLBACK, code, fallback: true };
}

export default getCrisisLifeline;
