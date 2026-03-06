import type { StepContext, StepResult } from '@/core/pipeline/steps';
import { createImageProvider } from '@/infra/images';
import type { DraftState, ImagesResult } from '@/types/pipeline';
import type { PipelineStep } from '../steps';

const step: PipelineStep = {
  id: 'images',
  name: '이미지 생성',
  description: '이미지 배치 계획에 따라 실제 이미지를 생성합니다',
  dependsOn: ['imagePlan'],

  shouldRun: (draft: DraftState): boolean => !draft.imagesResult,

  async execute(context: StepContext): Promise<StepResult<ImagesResult>> {
    const { draft, apiKey, imageProviderType } = context;

    if (!draft.imagePlanResult?.images.length) {
      return {
        success: false,
        error: '이미지 계획이 없어 이미지를 생성할 수 없습니다',
      };
    }

    try {
      const imageProvider = createImageProvider(imageProviderType, { apiKey });
      const generatedImages: ImagesResult['images'] = [];

      for (const plannedImage of draft.imagePlanResult.images) {
        const generated = await imageProvider.generate({
          prompt: plannedImage.description,
        });

        generatedImages.push({
          position: plannedImage.position,
          url: generated.url,
          filename: generated.filename,
          alt: plannedImage.alt,
        });
      }

      return {
        success: true,
        data: {
          images: generatedImages,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '이미지 생성 실패',
      };
    }
  },
};

export default step;
