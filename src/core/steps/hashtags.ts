import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, HashtagsResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

const step: PipelineStep = {
	id: "hashtags",
	name: "해시태그 생성",
	description: "글에 사용할 해시태그를 생성합니다",
	dependsOn: ["meta"],

	shouldRun: (draft: DraftState): boolean => !draft.hashtagsResult,

	async execute(context: StepContext): Promise<StepResult<HashtagsResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const prompt = await getPrompt("hashtags");
		const fullPrompt = `${prompt}\n\n제목: ${draft.titlePickResult?.selectedTitle}\n키워드: ${draft.keyword}\n요약: ${draft.summaryResult?.summary}`;

		try {
			const result = await gemini.generateContent<HashtagsResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						hashtags: {
							type: "ARRAY",
							items: { type: "STRING" },
						},
					},
					required: ["hashtags"],
				},
			});

			return {
				success: true,
				data: {
					hashtags: Array.from(new Set(result.hashtags)).slice(0, 12),
				},
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "해시태그 생성 실패",
			};
		}
	},
};

export default step;
