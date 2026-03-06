import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, PersonaResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

const step: PipelineStep = {
	id: "persona",
	name: "페르소나 선택",
	description: "검색 의도에 맞는 페르소나를 선택합니다",
	dependsOn: ["intent"],

	shouldRun: (draft: DraftState) => !draft.personaResult,

	async execute(context: StepContext): Promise<StepResult<PersonaResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const prompt = await getPrompt("persona");
		const fullPrompt = `${prompt}\n\n키워드: ${draft.keyword}\n의도 분석: ${JSON.stringify(draft.intentResult)}`;

		try {
			const result = await gemini.generateContent<PersonaResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						selectedPersona: {
							type: "OBJECT",
							properties: {
								id: { type: "STRING" },
								name: { type: "STRING" },
								description: { type: "STRING" },
								characteristics: {
									type: "ARRAY",
									items: { type: "STRING" },
								},
							},
							required: ["id", "name", "description", "characteristics"],
						},
					},
					required: ["selectedPersona"],
				},
			});

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "페르소나 선택 실패",
			};
		}
	},
};

export default step;
