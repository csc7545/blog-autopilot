import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, MetaResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

const step: PipelineStep = {
	id: "meta",
	name: "메타 설명 생성",
	description: "블로그 글의 메타 설명을 생성합니다",
	dependsOn: ["summary"],

	shouldRun: (draft: DraftState): boolean => !draft.metaResult,

	async execute(context: StepContext): Promise<StepResult<MetaResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const prompt = await getPrompt("meta");
		const fullPrompt = `${prompt}\n\n제목: ${draft.titlePickResult?.selectedTitle}\n키워드: ${draft.keyword}\n요약: ${draft.summaryResult?.summary}`;

		try {
			const result = await gemini.generateContent<MetaResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						metaDescription: { type: "STRING" },
					},
					required: ["metaDescription"],
				},
			});

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "메타 설명 생성 실패",
			};
		}
	},
};

export default step;
