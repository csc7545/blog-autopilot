import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, TitlePickResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

const step: PipelineStep = {
	id: "titlePick",
	name: "최적 제목 선택",
	description: "생성된 제목 후보 중 가장 적합한 제목을 선택합니다",
	dependsOn: ["titles"],

	shouldRun: (draft: DraftState) => !draft.titlePickResult,

	async execute(context: StepContext): Promise<StepResult<TitlePickResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const prompt = await getPrompt("titlePick");
		const fullPrompt = `${prompt}\n\n키워드: ${draft.keyword}\n제목 후보: ${JSON.stringify(draft.titlesResult)}`;

		try {
			const result = await gemini.generateContent<TitlePickResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						selectedTitle: { type: "STRING" },
						reason: { type: "STRING" },
					},
					required: ["selectedTitle", "reason"],
				},
			});

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "제목 선택 실패",
			};
		}
	},
};

export default step;
