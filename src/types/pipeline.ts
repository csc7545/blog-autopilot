export type StepId =
  | 'intent'
  | 'persona'
  | 'titles'
  | 'titlePick'
  | 'outline'
  | 'sections'
  | 'faq'
  | 'summary'
  | 'meta'
  | 'hashtags'
  | 'imagePlan'
  | 'images'
  | 'naverTone'
  | 'validator'
  | 'exportHtml'
  | 'exportMd';

export interface StepDefinition {
  id: StepId;
  name: string;
  description: string;
  inputType: unknown;
  outputType: unknown;
}

export type PersonaId =
  | 'it-beginner'
  | 'office-worker'
  | 'college-student'
  | 'blogger-beginner'
  | 'smartphone-user';

export interface Persona {
  id: PersonaId;
  name: string;
  description: string;
  characteristics: string[];
}

export interface DraftState {
  id: string;
  keyword: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  currentStep: StepId | null;
  intentResult?: IntentResult;
  personaResult?: PersonaResult;
  titlesResult?: TitlesResult;
  titlePickResult?: TitlePickResult;
  outlineResult?: OutlineResult;
  sectionsResult?: SectionsResult;
  faqResult?: FaqResult;
  summaryResult?: SummaryResult;
  metaResult?: MetaResult;
  hashtagsResult?: HashtagsResult;
  imagePlanResult?: ImagePlanResult;
  imagesResult?: ImagesResult;
  naverToneResult?: NaverToneResult;
  validatorResult?: ValidatorResult;
  exportHtmlResult?: string;
  exportMdResult?: string;
}

export interface IntentResult {
  searchIntent: string;
  targetAudience: string;
  contentGoal: string;
}

export interface PersonaResult {
  selectedPersona: Persona;
}

export interface TitlesResult {
  titles: string[];
}

export interface TitlePickResult {
  selectedTitle: string;
  reason: string;
}

export interface OutlineResult {
  outline: {
    h2: string;
    h3s: string[];
  }[];
}

export interface SectionsResult {
  sections: {
    heading: string;
    content: string;
  }[];
}

export interface FaqResult {
  faqs: { question: string; answer: string }[];
}

export interface SummaryResult {
  summary: string;
}

export interface MetaResult {
  metaDescription: string;
}

export interface HashtagsResult {
  hashtags: string[];
}

export interface ImagePlanResult {
  images: {
    position: 'cover' | 'section1' | 'section2';
    description: string;
    alt: string;
  }[];
}

export interface ImagesResult {
  images: {
    position: string;
    url: string;
    filename: string;
    alt: string;
  }[];
}

export interface NaverToneResult {
  adjustedContent: string;
}

export interface ValidatorResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
