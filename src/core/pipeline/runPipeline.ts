import { PipelineError } from '@/core/errors';
import type { ImageProviderType } from '@/infra/images';
import type { DraftState, StepId } from '@/types/pipeline';
import exportHtmlStep from '../steps/exportHtml';
import exportMdStep from '../steps/exportMd';
import faqStep from '../steps/faq';
import hashtagsStep from '../steps/hashtags';
import imagePlanStep from '../steps/imagePlan';
import imagesStep from '../steps/images';
import intentStep from '../steps/intent';
import metaStep from '../steps/meta';
import naverToneStep from '../steps/naverTone';
import outlineStep from '../steps/outline';
import personaStep from '../steps/persona';
import sectionsStep from '../steps/sections';
import summaryStep from '../steps/summary';
import titlePickStep from '../steps/titlePick';
import titlesStep from '../steps/titles';
import validatorStep from '../steps/validator';
import { type PipelineStep, STEP_ORDER, type StepContext, type StepResult } from './steps';

const STEPS_MAP: Record<StepId, PipelineStep | null> = {
  intent: intentStep,
  persona: personaStep,
  titles: titlesStep,
  titlePick: titlePickStep,
  outline: outlineStep,
  sections: sectionsStep,
  faq: faqStep,
  summary: summaryStep,
  meta: metaStep,
  hashtags: hashtagsStep,
  imagePlan: imagePlanStep,
  images: imagesStep,
  naverTone: naverToneStep,
  validator: validatorStep,
  exportHtml: exportHtmlStep,
  exportMd: exportMdStep,
};

export interface PipelineOptions {
  apiKey: string;
  imageProviderType?: ImageProviderType;
  onStepStart?: (step: StepId) => void;
  onStepComplete?: (step: StepId, result: StepResult<unknown>) => void;
}

export async function runPipeline(
  draft: DraftState,
  options: PipelineOptions
): Promise<DraftState> {
  const { apiKey, imageProviderType = 'gemini', onStepStart, onStepComplete } = options;

  let currentDraft = { ...draft };

  for (const stepId of STEP_ORDER) {
    onStepStart?.(stepId);

    try {
      const context: StepContext = {
        draft: currentDraft,
        apiKey,
        imageProviderType,
      };

      const stepInstance = STEPS_MAP[stepId];

      if (!stepInstance) {
        continue;
      }

      if (!stepInstance.shouldRun(currentDraft)) {
        continue;
      }

      const result = await stepInstance.execute(context);

      if (!result.success) {
        throw new PipelineError(result.error || `Step ${stepId} failed`, stepId, 'STEP_FAILED');
      }

      currentDraft = {
        ...currentDraft,
        [`${stepId}Result`]: result.data,
        currentStep: stepId,
        updatedAt: new Date(),
      } as DraftState;

      onStepComplete?.(stepId, result);
    } catch (error) {
      throw new PipelineError(
        error instanceof Error ? error.message : `Step ${stepId} failed`,
        stepId,
        'STEP_ERROR'
      );
    }
  }

  return currentDraft;
}
