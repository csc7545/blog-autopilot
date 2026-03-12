import type { StepContext, StepResult } from "@/core/pipeline/steps";
import { getPrompt } from "@/core/prompts/getPrompt";
import { getWritingStylePrefix } from "@/core/prompts/getWritingStylePrefix";
import { createGeminiClient } from "@/infra/gemini/client";
import type { DraftState, NaverToneResult } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

function composeArticleForToneAdjustment(draft: DraftState): string {
	const title = draft.titlePickResult?.selectedTitle ?? "";
	const sections = draft.sectionsResult?.sections ?? [];
	const summary = draft.summaryResult?.summary ?? "";
	const faqs = draft.faqResult?.faqs ?? [];

	const sectionText = sections
		.map((section) => `## ${section.heading}\n${section.content}`)
		.join("\n\n");
	const faqText = faqs
		.map((faq) => `- Q: ${faq.question}\n  A: ${faq.answer}`)
		.join("\n");

	return `# ${title}\n\n${sectionText}\n\n## 요약\n${summary}\n\n## FAQ\n${faqText}`;
}

const step: PipelineStep = {
	id: "naverTone",
	name: "네이버 톤 보정",
	description: "전체 콘텐츠를 네이버 블로그 스타일에 맞게 보정합니다",
	dependsOn: ["sections", "faq", "summary", "images"],

	shouldRun: (draft: DraftState): boolean => !draft.naverToneResult,

	async execute(context: StepContext): Promise<StepResult<NaverToneResult>> {
		const { draft, apiKey } = context;
		const gemini = createGeminiClient(apiKey);

		const stylePrefix = await getWritingStylePrefix(draft);
		const prompt = await getPrompt("naverTone");
		const article = composeArticleForToneAdjustment(draft);
		const fullPrompt = `${stylePrefix}${prompt}\n\n원본 콘텐츠:\n${article}`;

		try {
			const result = await gemini.generateContent<NaverToneResult>({
				prompt: fullPrompt,
				schema: {
					type: "OBJECT",
					properties: {
						adjustedContent: { type: "STRING" },
					},
					required: ["adjustedContent"],
				},
			});

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "네이버 톤 보정 실패",
			};
		}
	},
};

export default step;
