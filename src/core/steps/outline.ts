import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, OutlineResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

const step: PipelineStep = {
	id: "outline",
	name: "아웃라인 생성",
	description: "선택된 제목을 기준으로 H2/H3 아웃라인을 생성합니다",
	dependsOn: ["titlePick"],

	shouldRun: (draft: DraftState) => !draft.outlineResult,

	async execute(context: StepContext): Promise<StepResult<OutlineResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const prompt = await getPrompt("outline");
		const fullPrompt = `${prompt}\n\n제목: ${draft.titlePickResult?.selectedTitle}\n키워드: ${draft.keyword}`;

		try {
			const result = await gemini.generateContent<OutlineResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						outline: {
							type: "ARRAY",
							items: {
								type: "OBJECT",
								properties: {
									h2: { type: "STRING" },
									h3s: {
										type: "ARRAY",
										items: { type: "STRING" },
									},
								},
								required: ["h2", "h3s"],
							},
						},
					},
					required: ["outline"],
				},
			});

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "아웃라인 생성 실패",
			};
		}
	},
};

export default step;
