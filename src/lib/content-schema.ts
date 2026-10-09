// Definición de todo el contenido editable de la landing.
// Cada campo tiene una clave única, el tipo de editor que usa el admin y el
// valor por defecto (tomado del diseño). Lo guardado en `site_content` tiene
// prioridad sobre el valor por defecto.
//
// Este archivo no importa nada para que también lo puedan usar los scripts de
// Node (`scripts/*.ts`) sin pasar por Astro.

export type FieldType = 'text' | 'textarea' | 'url' | 'link' | 'image' | 'boolean';

/**
 * Enlaces generales reutilizables. Un campo de tipo `link` guarda `@clave`
 * (p. ej. `@scorecard`) para usar el enlace general, o una URL propia.
 */
export const SHARED_LINKS = {
  scorecard: 'Scorecard',
  playbook: 'Playbook',
  masterclass: 'Masterclass',
  audit: 'Perception Audit',
  jtmaison: 'JT Maison',
} as const;

export type SharedLink = keyof typeof SHARED_LINKS;

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  default: string;
  help?: string;
}

export interface Section {
  id: string;
  label: string;
  description?: string;
  fields: Field[];
}

const RICH_HELP = 'Leave a blank line between paragraphs. Single line breaks are kept. Use **text** for bold.';

const text = (key: string, label: string, value: string, help?: string): Field => ({ key, label, type: 'text', default: value, help });
const area = (key: string, label: string, value: string, help = RICH_HELP): Field => ({ key, label, type: 'textarea', default: value, help });
const url = (key: string, label: string, value: string, help?: string): Field => ({ key, label, type: 'url', default: value, help });
const link = (key: string, label: string, target: SharedLink): Field => ({
  key,
  label,
  type: 'link',
  default: '@' + target,
  help: 'Pick a shared link (changing its URL updates every button that uses it) or enter your own URL. Links to other domains open in a new tab.',
});
const image = (key: string, label: string, value: string, help?: string): Field => ({ key, label, type: 'image', default: value, help });
const bool = (key: string, label: string, value: boolean, help?: string): Field => ({ key, label, type: 'boolean', default: value ? '1' : '0', help });

export const SECTIONS: Section[] = [
  {
    id: 'general',
    label: 'General & links',
    description: 'SEO, header, shared links reusable by the buttons, and the floating CTA.',
    fields: [
      text('site.title', 'Page title (SEO)', 'SEEN. Business Perception, Brand Strategy and Business Development | JT Maison'),
      area('site.description', 'Meta description (SEO)', "SEEN. by JT Maison: brand perception tools, a Business Perception Playbook, the Seven Signals Masterclass and an independent Perception Audit. Brand strategy, brand positioning and business development for ambitious businesses that want to be noticed, understood, trusted and chosen.", 'Plain text, ~160 characters max recommended.'),
      text('og.title', 'Social share title', 'SEEN. | JT Maison. Brand Strategy and Business Perception'),
      area('og.description', 'Social share description', 'Attention gets you seen. Perception determines what happens next. Brand strategy, positioning and business development thinking from JT Maison.', 'Plain text.'),
      image('header.logo', 'Logo', '/images/jt-maison-logo.png'),
      link('header.logo.href', 'Logo link destination', 'jtmaison'),
      text('header.tagline', 'Header text', 'Branding · Brand Strategy · Business Development'),
      url('links.scorecard', 'Shared link · Scorecard', '#scorecard'),
      url('links.playbook', 'Shared link · Playbook', '#playbook'),
      url('links.masterclass', 'Shared link · Masterclass', '#masterclass'),
      url('links.audit', 'Shared link · Perception Audit', '#audit'),
      url('links.jtmaison', 'Shared link · JT Maison', '#jt-maison'),
      bool('sticky.enabled', 'Show floating CTA on scroll', true),
      text('sticky.label', 'Floating CTA text', 'Score your brand'),
      link('sticky.href', 'Floating CTA destination', 'scorecard'),
    ],
  },
  {
    id: 'hero',
    label: '01 · Hero',
    fields: [
      text('hero.wordmark', 'Large wordmark', 'SEEN'),
      area('hero.title', 'Heading', 'Attention gets you seen.\nPerception determines\nwhat happens next.'),
      area('hero.text', 'Text', "JT Maison's tools, thinking and strategic services for businesses that want to become easier to notice, understand, trust and choose."),
      text('hero.ctaPrimary', 'Primary button', 'Score your brand — Free'),
      link('hero.ctaPrimary.href', 'Primary button · Destination', 'scorecard'),
      text('hero.ctaSecondary', 'Secondary link', 'Discover the Perception Audit →'),
      link('hero.ctaSecondary.href', 'Secondary link · Destination', 'audit'),
      image('hero.image', 'Image', '/images/hero.webp'),
      text('hero.imageAlt', 'Image alt text', 'SEEN. campaign portrait'),
    ],
  },
  {
    id: 'idea',
    label: '02 · Central idea',
    fields: [
      text('idea.eyebrow', 'Eyebrow', 'The Business of Perception'),
      area('idea.title', 'Heading', "The market can't value what it can't see."),
      area('idea.body', 'Text', [
        'You know the business from the inside.',
        'You know the quality of the work.\nThe people behind it.\nThe history.\nThe effort.\nThe relationships.\nThe results.',
        'The market does not have that context.',
        '**It sees the signals.**',
        'Positioning.\nLanguage.\nReputation.\nVisibility.\nProof.\nExperience.\nThe people associated with the business.\nWhat appears next to you in the market.',
        'Those signals influence whether people notice the business, understand it, trust it and ultimately choose it.',
      ].join('\n\n')),
      image('idea.image', 'Image', '/images/idea.webp'),
      text('idea.imageAlt', 'Image alt text', 'SEEN. Does your business look as good as it is?'),
      area('idea.quote', 'Pull quote', 'The business you know and the business they see are not always the same thing.'),
      text('idea.ctaPrimary', 'Primary button', 'Score your brand — Free'),
      link('idea.ctaPrimary.href', 'Primary button · Destination', 'scorecard'),
      text('idea.ctaSecondary', 'Secondary link', 'Discover the Perception Audit →'),
      link('idea.ctaSecondary.href', 'Secondary link · Destination', 'audit'),
    ],
  },
  {
    id: 'standard',
    label: '03 · SEEN. Standard',
    fields: [
      text('standard.eyebrow', 'Eyebrow', 'What needs to happen in their mind'),
      ...([
        ['SEEN.', 'The right people encounter the business.'],
        ['UNDERSTOOD.', 'They can quickly understand what it does, who it is for and why it matters.'],
        ['TRUSTED.', 'The business gives them enough evidence and confidence to believe what it promises.'],
        ['CHOSEN.', 'The value is clear enough, relevant enough and credible enough for someone to act.'],
      ] as const).flatMap(([title, body], i) => [
        text(`standard.item${i + 1}.title`, `Step ${i + 1} · Word`, title),
        area(`standard.item${i + 1}.text`, `Step ${i + 1} · Text`, body),
      ]),
      area('standard.closing', 'Closing text', 'Visibility alone is not the objective.\n\nA business can be seen by thousands of people and still fail to be understood, trusted or chosen.\n\nThis is why JT Maison looks beyond attention alone.', RICH_HELP + ' The last paragraph is shown in grey.'),
      text('standard.cta', 'Button', 'Score your brand — Free'),
      link('standard.cta.href', 'Button · Destination', 'scorecard'),
    ],
  },
  {
    id: 'formula',
    label: '04 · SEEN. Formula',
    fields: [
      text('formula.eyebrow', 'Eyebrow', 'What the business can control'),
      area('formula.intro', 'Text', 'Together, these form the practical JT Maison framework behind the SEEN. ecosystem.'),
      ...([
        ['Signal', 'What is the business communicating before anyone explains it?'],
        ['Exposure', 'Are the right people encountering those signals often enough?'],
        ['Evidence', 'What makes the claims easier to believe?'],
        ['Next step', 'Can interest turn naturally into enquiry, purchase, subscription or another useful action?'],
      ] as const).flatMap(([word, body], i) => [
        text(`formula.item${i + 1}.word`, `Pillar ${i + 1} · Word`, word, 'The first letter is highlighted automatically.'),
        area(`formula.item${i + 1}.text`, `Pillar ${i + 1} · Text`, body),
      ]),
      text('formula.cta', 'Button', 'Learn the method: the Masterclass'),
      link('formula.cta.href', 'Button · Destination', 'masterclass'),
    ],
  },
  {
    id: 'signals',
    label: '05 · Seven Signals',
    fields: [
      area('signals.title', 'Heading', 'Seven signals shape how a business is read.'),
      ...([
        ['Presence', 'Can the right people encounter you?'],
        ['Clarity', 'Can they understand what you do quickly?'],
        ['Relevance', 'Can they recognise that it is for them?'],
        ['Distinction', 'Is there a reason to remember you?'],
        ['Authority', 'Do you appear credible before the conversation begins?'],
        ['Proof', 'Is there enough evidence to believe the promise?'],
        ['Choice', 'Is it clear why and how to choose you?'],
      ] as const).flatMap(([name, body], i) => [
        text(`signals.item${i + 1}.name`, `Signal ${i + 1} · Name`, name),
        text(`signals.item${i + 1}.text`, `Signal ${i + 1} · Question`, body),
      ]),
      text('signals.ctaPrimary', 'Primary button', 'Score your seven signals — Free'),
      link('signals.ctaPrimary.href', 'Primary button · Destination', 'scorecard'),
      text('signals.ctaSecondary', 'Secondary link', 'Explore the Playbook →'),
      link('signals.ctaSecondary.href', 'Secondary link · Destination', 'playbook'),
    ],
  },
  {
    id: 'ways',
    label: '06 · Four ways in',
    description: 'The four offers: Scorecard, Playbook, Masterclass and Audit.',
    fields: [
      text('ways.eyebrow', 'Eyebrow', 'Start where the business needs you to start'),
      area('ways.title', 'Heading', 'Four ways\nto look at perception.'),
      area('ways.intro', 'Text', 'You do not need to move through SEEN. in a fixed order.\n\nChoose the level of support that matches what you need now.'),

      text('offer1.tag', 'Offer 1 · Tag', 'Diagnose'),
      area('offer1.title', 'Offer 1 · Title', 'SCORE YOUR BRAND.'),
      text('offer1.subtitle', 'Offer 1 · Subtitle', ''),
      text('offer1.price', 'Offer 1 · Price', 'Free'),
      area('offer1.lead', 'Offer 1 · Highlighted line', 'Find out where a perception gap may exist.'),
      area('offer1.text', 'Offer 1 · Description', 'The JT Maison Perception Gap Scorecard gives you a quick outside-in view of seven signals influencing whether your business is being noticed, understood, trusted and chosen.'),
      text('offer1.cta', 'Offer 1 · Link', 'Take the free Scorecard →'),
      link('offer1.cta.href', 'Offer 1 · Link destination', 'scorecard'),

      text('offer2.tag', 'Offer 2 · Tag', 'Do it yourself'),
      area('offer2.title', 'Offer 2 · Title', 'SEEN.'),
      text('offer2.subtitle', 'Offer 2 · Subtitle', 'THE BUSINESS PERCEPTION PLAYBOOK'),
      text('offer2.price', 'Offer 2 · Price', '£29'),
      area('offer2.lead', 'Offer 2 · Highlighted line', 'Practical ways to strengthen how your business is seen.'),
      area('offer2.text', 'Offer 2 · Description', 'A hands-on JT Maison guide to messaging, content, email, proof, visibility, owned audience and customer journeys.\n\nDesigned for founders who want useful changes they can implement themselves.'),
      text('offer2.cta', 'Offer 2 · Link', 'Explore the Playbook →'),
      link('offer2.cta.href', 'Offer 2 · Link destination', 'playbook'),

      text('offer3.tag', 'Offer 3 · Tag', 'Learn the method'),
      area('offer3.title', 'Offer 3 · Title', 'SEEN.'),
      text('offer3.subtitle', 'Offer 3 · Subtitle', 'THE SEVEN SIGNALS'),
      text('offer3.price', 'Offer 3 · Price', '£125'),
      area('offer3.lead', 'Offer 3 · Highlighted line', 'Understand the methodology behind business perception.'),
      area('offer3.text', 'Offer 3 · Description', 'The JT Maison Business Perception Masterclass explains how the Seven Signals influence whether a business becomes seen, understood, trusted and chosen.'),
      bool('masterclass.live', 'Masterclass available now', false, 'When off, the release date and the reserve-access link are shown.'),
      text('masterclass.releaseDate', 'Release date', 'SOON', 'Shown as "AVAILABLE {date}" until the masterclass is live.'),
      text('masterclass.ctaPresale', 'Link (pre-sale)', 'Reserve access →'),
      text('masterclass.ctaLive', 'Link (available)', 'Explore the Masterclass →'),
      link('masterclass.cta.href', 'Offer 3 · Link destination', 'masterclass'),

      text('offer4.tag', 'Offer 4 · Tag', 'Get the outside view'),
      area('offer4.title', 'Offer 4 · Title', 'THE JT MAISON\nPERCEPTION AUDIT'),
      text('offer4.subtitle', 'Offer 4 · Subtitle', ''),
      text('offer4.price', 'Offer 4 · Price', '£1,200'),
      area('offer4.lead', 'Offer 4 · Highlighted line', 'Find out what JT Maison sees in your specific business.'),
      area('offer4.text', 'Offer 4 · Description', 'An independent outside-in assessment of how your business is perceived, where value may be getting lost, what competitors are signalling more effectively and where the strongest opportunities lie to improve positioning, visibility, trust and conversion.'),
      area('offer4.bullets', 'Offer 4 · Benefits list', 'Independent research\nCompetitor and peer context\nSWOT analysis\nTailored recommendations\nPrioritised 90-day action plan', 'One item per line.'),
      text('offer4.cta', 'Offer 4 · Button', 'Discover the Perception Audit →'),
      link('offer4.cta.href', 'Offer 4 · Button destination', 'audit'),
    ],
  },
  {
    id: 'guide',
    label: '07 · Where to start',
    fields: [
      area('guide.title', 'Heading', 'Not sure where\nto start?'),
      text('guide.item1.quote', 'Option 1 (Scorecard) · Quote', '“I want to know where the problem might be.”'),
      text('guide.item1.answer', 'Option 1 (Scorecard) · Answer', 'Score your brand.'),
      link('guide.item1.href', 'Option 1 · Destination', 'scorecard'),
      text('guide.item2.quote', 'Option 2 (Playbook) · Quote', '“I know I need to improve things myself.”'),
      text('guide.item2.answer', 'Option 2 (Playbook) · Answer', 'The Business Perception Playbook'),
      link('guide.item2.href', 'Option 2 · Destination', 'playbook'),
      text('guide.item3.quote', 'Option 3 (Masterclass) · Quote', '“I want to understand how perception works.”'),
      text('guide.item3.answer', 'Option 3 (Masterclass) · Answer', 'The Seven Signals Masterclass'),
      link('guide.item3.href', 'Option 3 · Destination', 'masterclass'),
      text('guide.item4.quote', 'Option 4 (Audit) · Quote', '“I want an independent strategist to tell me what the market sees and where the opportunities are.”'),
      text('guide.item4.answer', 'Option 4 (Audit) · Answer', 'The Perception Audit'),
      link('guide.item4.href', 'Option 4 · Destination', 'audit'),
    ],
  },
  {
    id: 'audit',
    label: '08 · Perception Audit',
    fields: [
      text('audit.eyebrow', 'Eyebrow', 'The independent view'),
      area('audit.title', 'Heading', 'See what the market sees.\nFind the gaps.\nBecome easier to choose.'),
      area('audit.text', 'Text', 'The Perception Audit goes beyond self-assessment.\n\nJT Maison reviews the business from the outside, compares what the market is being shown with the value that exists inside the company, examines relevant competitors and identifies what is working, what is weakening perception and where stronger opportunities may exist.'),
      area('audit.highlight', 'Highlighted line', 'WHAT IS WORKING.\nWHAT IS MISSING.\nWHAT MATTERS NEXT.'),
      text('audit.cta', 'Button', 'Discover the Perception Audit →'),
      link('audit.cta.href', 'Button · Destination', 'audit'),
      image('audit.image', 'Image', '/images/audit.webp'),
      text('audit.imageAlt', 'Image alt text', 'SEEN. The JT Maison Perception Audit'),
    ],
  },
  {
    id: 'reach',
    label: '09 · Borrowed reach',
    fields: [
      area('reach.title', 'Heading', 'BORROWED REACH.\nOWNED\nRELATIONSHIP.'),
      area('reach.text', 'Text', 'Being visible on social media is useful.\n\nBuilding the entire business on audiences controlled by someone else is not.\n\nSEEN. looks at how discovery, authority, email, CRM, website and customer journey work together so attention has somewhere useful to go.'),
      text('reach.ctaPrimary', 'Primary button', 'Score your brand — Free'),
      link('reach.ctaPrimary.href', 'Primary button · Destination', 'scorecard'),
      text('reach.ctaSecondary', 'Secondary link', 'Explore the Business Perception Playbook →'),
      link('reach.ctaSecondary.href', 'Secondary link · Destination', 'playbook'),
    ],
  },
  {
    id: 'about',
    label: '10 · JT Maison',
    fields: [
      area('about.title', 'Heading', 'The business\nof perception.'),
      area('about.text', 'Text', 'JT Maison helps ambitious businesses close the gap between what they are and how they are perceived.\n\nThrough positioning, brand architecture and strategic development, we help founders and leadership teams strengthen reputation, increase perceived value and create businesses that command attention for the right reasons.\n\nSEEN. is one expression of that work.'),
      area('about.small', 'Small print', 'Brand strategy, brand positioning, brand architecture and business development consultancy for founders and leadership teams.'),
      text('about.cta', 'Link', 'Discover JT Maison →'),
      link('about.cta.href', 'Link · Destination', 'jtmaison'),
    ],
  },
  {
    id: 'final',
    label: '11 · Final CTA',
    fields: [
      area('final.title', 'Heading', 'WHAT DOES\nTHE MARKET\nSEE?'),
      area('final.text', 'Text', 'Start with the free JT Maison Perception Gap Scorecard, or go directly to the Perception Audit if you want an independent view of your business.'),
      text('final.ctaPrimary', 'Primary button', 'Score your brand — Free'),
      link('final.ctaPrimary.href', 'Primary button · Destination', 'scorecard'),
      text('final.ctaSecondary', 'Secondary link', 'Discover the Perception Audit →'),
      link('final.ctaSecondary.href', 'Secondary link · Destination', 'audit'),
      image('final.image', 'Image', '/images/final.webp'),
      text('final.imageAlt', 'Image alt text', 'SEEN. See what they see.'),
    ],
  },
];

export const FIELDS: Map<string, Field> = new Map(
  SECTIONS.flatMap((s) => s.fields.map((f) => [f.key, f] as const)),
);

export function getSection(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id);
}

export function defaultContent(): Record<string, string> {
  return Object.fromEntries([...FIELDS.values()].map((f) => [f.key, f.default]));
}

/** Convierte el valor de un campo `link` en la URL final (`@clave` → enlace general). */
export function resolveHref(content: Record<string, string>, value: string | undefined): string {
  if (value?.startsWith('@')) return content[`links.${value.slice(1)}`] ?? '#';
  return value || '#';
}
