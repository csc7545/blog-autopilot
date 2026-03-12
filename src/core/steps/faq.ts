import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { getWritingStylePrefix } from "@/core/prompts/getWritingStylePrefix";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, FaqResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

const step: PipelineStep = {
	id: "faq",
	name: "FAQ 생성",
	description: "본문 내용을 기반으로 FAQ를 생성합니다",
	dependsOn: ["sections"],

	shouldRun: (draft: DraftState) => !draft.faqResult,

	async execute(context: StepContext): Promise<StepResult<FaqResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const stylePrefix = await getWritingStylePrefix(draft);
		const prompt = await getPrompt("faq");
		const fullPrompt = `${stylePrefix}${prompt}\n\n제목: ${draft.titlePickResult?.selectedTitle}\n본문: ${JSON.stringify(draft.sectionsResult)}`;

		try {
			const result = await gemini.generateContent<FaqResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						faqs: {
							type: "ARRAY",
							items: {
								type: "OBJECT",
								properties: {
									question: { type: "STRING" },
									answer: { type: "STRING" },
								},
								required: ["question", "answer"],
							},
						},
					},
					required: ["faqs"],
				},
			});

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "FAQ 생성 실패",
			};
		}
	},
};

export default step;
