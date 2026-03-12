export const promptManifest = {
  writingStyle: '00_writingStyle.md',
  intent: '01_intent.md',
  persona: '02_persona.md',
  titles: '03_titles.md',
  titlePick: '04_titlePick.md',
  outline: '05_outline.md',
  sections: '06_sections.md',
  faq: '07_faq.md',
  summary: '08_summary.md',
  meta: '09_meta.md',
  hashtags: '10_hashtags.md',
  imagePlan: '11_imagePlan.md',
  images: '12_images.md',
  naverTone: '13_naverTone.md',
} as const;

export type PromptName = keyof typeof promptManifest;
