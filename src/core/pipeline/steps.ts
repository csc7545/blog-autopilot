import type { DraftState, StepId } from '@/types/pipeline';
import type { ImageProviderType } from '@/infra/images';

export interface StepContext {
  draft: DraftState;
  apiKey: string;
  imageProviderType: ImageProviderType;
}

export interface StepResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PipelineStep {
  id: StepId;
  name: string;
  description: string;

  execute(context: StepContext): Promise<StepResult<unknown>>;
  shouldRun(draft: DraftState): boolean;
  dependsOn: StepId[];
}

export const STEP_ORDER: StepId[] = [
  'intent',
  'persona',
  'titles',
  'titlePick',
  'outline',
  'sections',
  'faq',
  'summary',
  'meta',
  'hashtags',
  'imagePlan',
  'images',
  'naverTone',
  'validator',
  'exportHtml',
  'exportMd',
];

export const STEP_REGISTRY: Record<StepId, PipelineStep> = {} as Record<StepId, PipelineStep>;
