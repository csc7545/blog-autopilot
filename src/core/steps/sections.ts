import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { getWritingStylePrefix } from "@/core/prompts/getWritingStylePrefix";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, SectionsResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

const step: PipelineStep = {
	id: "sections",
	name: "본문 섹션 생성",
	description: "아웃라인을 기반으로 각 섹션 본문을 생성합니다",
	dependsOn: ["outline"],

	shouldRun: (draft: DraftState) => !draft.sectionsResult,

	async execute(context: StepContext): Promise<StepResult<SectionsResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const stylePrefix = await getWritingStylePrefix(draft);
		const prompt = await getPrompt("sections");
		const fullPrompt = `${stylePrefix}${prompt}\n\n제목: ${draft.titlePickResult?.selectedTitle}\n아웃라인: ${JSON.stringify(draft.outlineResult)}`;

		try {
			const result = await gemini.generateContent<SectionsResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						sections: {
							type: "ARRAY",
							items: {
								type: "OBJECT",
								properties: {
									heading: { type: "STRING" },
									content: { type: "STRING" },
									subsections: {
										type: "ARRAY",
										items: {
											type: "OBJECT",
											properties: {
												subheading: { type: "STRING" },
												content: { type: "STRING" },
											},
											required: ["subheading", "content"],
										},
									},
								},
								required: ["heading", "content"],
							},
						},
					},
					required: ["sections"],
				},
			});

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "본문 생성 실패",
			};
		}
	},
};

export default step;
