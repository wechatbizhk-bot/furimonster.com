/* =========================================================================
 * tools/forms.js — form fragments for the FURI MONSTER build.
 *
 * One definition per enquiry type from the brief (§12.3): the fields differ
 * per audience, so a licensing enquiry never asks for a "Media outlet" and a
 * media request never asks for a "Budget range".
 *
 * Every form validates on the client, reports a success or error state, and
 * posts to forms.endpoint in site.config.js once it is set. Until then it says
 * so plainly instead of pretending to deliver.
 * ========================================================================= */
'use strict';

const FM = globalThis.FM;
const I = FM.i18n;
const D = FM.data;
const LOCALES = FM.config.locales;   // single source of truth

function esc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* The Thai and Japanese slots come from the shared table in tools/mt.js, not
 * from an English fallback. This file used to carry its own copy of the emitter
 * that never consulted the table, which is how the licensing and newsletter
 * forms shipped English under Thai and Japanese labels while the build
 * reported nothing outstanding. */
const MT = require('./mt.js');

function T(field) {
  const filled = MT.fill(field);
  return LOCALES.map(l =>
    `<span class="t t-inline" data-l="${l}">${esc(filled[l] || filled.en)}</span>`
  ).join('');
}

function label(key) {
  return T({ en: I.t(key, 'en'), 'zh-Hant': I.t(key, 'zh-Hant'), 'zh-Hans': I.t(key, 'zh-Hans') });
}

/* one control */
function input(name, key, type, required, placeholder) {
  const id = 'f-' + name;
  return `        <div class="field">
          <label for="${id}">${label(key)}${required ? ' *' : ''}</label>
          <input id="${id}" name="${name}" type="${type}"${required ? ' required' : ''}${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}>
          <span class="err" aria-live="polite"></span>
        </div>`;
}

function textarea(name, key, required) {
  const id = 'f-' + name;
  return `        <div class="field">
          <label for="${id}">${label(key)}${required ? ' *' : ''}</label>
          <textarea id="${id}" name="${name}"${required ? ' required' : ''}></textarea>
          <span class="err" aria-live="polite"></span>
        </div>`;
}

function selectField(name, key, options, required) {
  const id = 'f-' + name;
  return `        <div class="field">
          <label for="${id}">${label(key)}${required ? ' *' : ''}</label>
          <select id="${id}" name="${name}"${required ? ' required' : ''}>
            <option value="">—</option>
            ${options.map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')}
          </select>
          <span class="err" aria-live="polite"></span>
        </div>`;
}

function consent() {
  return `        <label class="check">
          <input type="checkbox" name="consent" required>
          <span>${label('form.consent')}</span>
        </label>`;
}

function form(kind, rows, submitKey) {
  /* Three forms share one page (licensing + distribution + media), so every
   * field id and label `for` is namespaced by the form kind. Without this the
   * page ships duplicate ids and the labels point at the wrong control. */
  const body = rows.join('\n')
    .replace(/id="f-/g, `id="f-${kind}-`)
    .replace(/for="f-/g, `for="f-${kind}-`);

  return `      <form class="form" data-form="${kind}" novalidate>
${body}
${consent()}
        <div class="btn-row">
          <button class="btn btn--primary" type="submit">${T({ en: I.t(submitKey, 'en'), 'zh-Hant': I.t(submitKey, 'zh-Hant'), 'zh-Hans': I.t(submitKey, 'zh-Hans') })}</button>
        </div>
        <div class="form-status" data-status role="status"></div>
        <p class="tiny muted">${T({ en: I.t('note.deck', 'en'), 'zh-Hant': I.t('note.deck', 'zh-Hant'), 'zh-Hans': I.t('note.deck', 'zh-Hans') })}</p>
      </form>`;
}

/* ---- per-audience forms ------------------------------------------------ */

function contactForm() {
  return form('contact', [
    input('name', 'form.name', 'text', true),
    input('email', 'form.email', 'email', true),
    textarea('message', 'form.message', true)
  ], 'cta.send');
}

function licensingForm() {
  const cats = D.licensing.categories.map(c => ({ value: c.id, label: c.title.en }));
  return form('licensing', [
    input('company', 'form.company', 'text', true),
    input('contact_name', 'form.name', 'text', true),
    input('email', 'form.email', 'email', true),
    input('territory', 'form.territory', 'text', true),
    selectField('category', 'form.category', cats, true),
    selectField('budget', 'form.budget', [
      { value: 'undisclosed', label: 'Prefer not to say' },
      { value: '<50k', label: '< HKD 50k' },
      { value: '50-200k', label: 'HKD 50k – 200k' },
      { value: '200-500k', label: 'HKD 200k – 500k' },
      { value: '500k+', label: 'HKD 500k+' }
    ], false),
    textarea('message', 'form.message', true)
  ], 'cta.requestLicensing');
}

function collabForm() {
  const types = D.partnershipTypes.map(p => ({ value: p.id, label: p.title.en }));
  return form('collaboration', [
    input('company', 'form.company', 'text', true),
    input('contact_name', 'form.name', 'text', true),
    input('email', 'form.email', 'email', true),
    selectField('type', 'form.type', types, true),
    input('territory', 'form.territory', 'text', false),
    textarea('message', 'form.message', true)
  ], 'cta.requestCollaboration');
}

function mediaForm() {
  return form('media', [
    input('outlet', 'form.outlet', 'text', true),
    input('contact_name', 'form.name', 'text', true),
    input('email', 'form.email', 'email', true),
    textarea('request', 'form.request', true)
  ], 'cta.send');
}

function distributionForm() {
  return form('distribution', [
    input('company', 'form.company', 'text', true),
    input('contact_name', 'form.name', 'text', true),
    input('email', 'form.email', 'email', true),
    input('market', 'form.market', 'text', true),
    input('channel', 'form.channel', 'text', true),
    input('territory', 'form.territory', 'text', true),
    textarea('message', 'form.message', false)
  ], 'cta.becomeDistributor');
}

function newsletterForm() {
  return `      <form class="newsletter-form" data-form="newsletter" novalidate>
        <div class="field">
          <label for="f-nl-email">${label('footer.newsletter')}</label>
          <input id="f-nl-email" name="email" type="email" required placeholder="you@example.com">
          <span class="err" aria-live="polite"></span>
        </div>
        <div class="btn-row">
          <button class="btn btn--primary" type="submit">${T({ en: I.t('footer.subscribe', 'en'), 'zh-Hant': I.t('footer.subscribe', 'zh-Hant'), 'zh-Hans': I.t('footer.subscribe', 'zh-Hans') })}</button>
        </div>
        <div class="form-status" data-status role="status"></div>
      </form>`;
}

module.exports = { contactForm, licensingForm, collabForm, mediaForm, distributionForm, newsletterForm };
