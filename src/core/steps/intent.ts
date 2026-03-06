import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, IntentResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

const step: PipelineStep = {
	id: "intent",
	name: "검색 의도 분석",
	description: "키워드에 대한 검색 의도를 분석합니다",
	dependsOn: [],

	shouldRun: (draft: DraftState) => !draft.intentResult,

	async execute(context: StepContext): Promise<StepResult<IntentResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const prompt = await getPrompt("intent");
		const fullPrompt = `${prompt}\n\n키워드: ${draft.keyword}`;

		try {
			const result = await gemini.generateContent<IntentResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						searchIntent: { type: "STRING" },
						targetAudience: { type: "STRING" },
						contentGoal: { type: "STRING" },
					},
					required: ["searchIntent", "targetAudience", "contentGoal"],
				},
			});

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "의도 분석 실패",
			};
		}
	},
};

export default step;
