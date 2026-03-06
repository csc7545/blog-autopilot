import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, ImagePlanResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

const step: PipelineStep = {
	id: "imagePlan",
	name: "이미지 배치 계획",
	description: "커버/본문 이미지 배치 계획을 생성합니다",
	dependsOn: ["sections"],

	shouldRun: (draft: DraftState): boolean => !draft.imagePlanResult,

	async execute(context: StepContext): Promise<StepResult<ImagePlanResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const prompt = await getPrompt("imagePlan");
		const fullPrompt = `${prompt}\n\n제목: ${draft.titlePickResult?.selectedTitle}\n본문: ${JSON.stringify(draft.sectionsResult)}`;

		try {
			const result = await gemini.generateContent<ImagePlanResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						images: {
							type: "ARRAY",
							items: {
								type: "OBJECT",
								properties: {
									position: { type: "STRING" },
									description: { type: "STRING" },
									alt: { type: "STRING" },
								},
								required: ["position", "description", "alt"],
							},
						},
					},
					required: ["images"],
				},
			});

			const imageByPosition = new Map(
				result.images.map((image) => [image.position, image]),
			);
			const positions: ImagePlanResult["images"][number]["position"][] = [
				"cover",
				"section1",
				"section2",
			];
			const normalizedImages: ImagePlanResult["images"] = positions.map(
				(position) => {
					const current = imageByPosition.get(position);
					return {
						position,
						description: current?.description ?? `${position} 이미지`,
						alt: current?.alt ?? `${position} 이미지`,
					};
				},
			);

			return { success: true, data: { images: normalizedImages } };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "이미지 배치 계획 생성 실패",
			};
		}
	},
};

export default step;
