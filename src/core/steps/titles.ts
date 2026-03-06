import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, TitlesResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

const step: PipelineStep = {
	id: "titles",
	name: "제목 생성",
	description: "키워드와 페르소나를 바탕으로 후보 제목을 생성합니다",
	dependsOn: ["intent", "persona"],

	shouldRun: (draft: DraftState) => !draft.titlesResult,

	async execute(context: StepContext): Promise<StepResult<TitlesResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const prompt = await getPrompt("titles");
		const fullPrompt = `${prompt}\n\n키워드: ${draft.keyword}\n페르소나: ${JSON.stringify(draft.personaResult)}`;

		try {
			const result = await gemini.generateContent<TitlesResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						titles: {
							type: "ARRAY",
							items: { type: "STRING" },
						},
					},
					required: ["titles"],
				},
			});

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "제목 생성 실패",
			};
		}
	},
};

export default step;
