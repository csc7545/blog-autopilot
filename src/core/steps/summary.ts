import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, SummaryResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

const step: PipelineStep = {
	id: "summary",
	name: "요약 생성",
	description: "생성된 본문과 FAQ를 기반으로 요약을 생성합니다",
	dependsOn: ["sections", "faq"],

	shouldRun: (draft: DraftState) => !draft.summaryResult,

	async execute(context: StepContext): Promise<StepResult<SummaryResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const prompt = await getPrompt("summary");
		const fullPrompt = `${prompt}\n\n제목: ${draft.titlePickResult?.selectedTitle}\n본문: ${JSON.stringify(draft.sectionsResult)}\nFAQ: ${JSON.stringify(draft.faqResult)}`;

		try {
			const result = await gemini.generateContent<SummaryResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						summary: { type: "STRING" },
					},
					required: ["summary"],
				},
			});

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "요약 생성 실패",
			};
		}
	},
};

export default step;
