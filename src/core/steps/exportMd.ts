import type { StepContext, StepResult } from "@/core/pipeline/steps";
import type { DraftState } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

function renderMarkdownImage(draft: DraftState, position: string): string {
	const image = draft.imagesResult?.images.find(
		(item) => item.position === position,
	);
	if (!image) {
		return "";
	}

	return `![${image.alt}](${image.url})`;
}

const step: PipelineStep = {
	id: "exportMd",
	name: "Markdown 내보내기",
	description: "생성된 글을 이미지 포함 Markdown 문자열로 변환합니다",
	dependsOn: ["validator"],

	shouldRun: (draft: DraftState): boolean => !draft.exportMdResult,

	async execute(context: StepContext): Promise<StepResult<string>> {
		const { draft } = context;
		const title = draft.titlePickResult?.selectedTitle ?? "";
		const sections = draft.sectionsResult?.sections ?? [];
		const summary = draft.summaryResult?.summary ?? "";
		const faqs = draft.faqResult?.faqs ?? [];
		const hashtags = draft.hashtagsResult?.hashtags ?? [];

		const sectionMarkdown = sections
			.map((section, index) => {
				const imagePosition =
					index === 0 ? "section1" : index === 1 ? "section2" : "";
				const image = imagePosition
					? renderMarkdownImage(draft, imagePosition)
					: "";

				const parts = [`## ${section.heading}`, section.content];

				if (section.subsections && section.subsections.length > 0) {
					for (const sub of section.subsections) {
						parts.push(`### ${sub.subheading}`, sub.content);
					}
				}

				if (image) parts.push(image);

				return parts
					.filter((segment) => segment.trim().length > 0)
					.join("\n\n");
			})
			.join("\n\n");

		const faqMarkdown = faqs
			.map((faq) => `### ${faq.question}\n\n${faq.answer}`)
			.join("\n\n");

		const markdown = [
			`# ${title}`,
			renderMarkdownImage(draft, "cover"),
			sectionMarkdown,
			"## 요약",
			summary,
			"## FAQ",
			faqMarkdown,
			hashtags.length > 0
				? hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ")
				: "",
		]
			.filter((segment) => segment.trim().length > 0)
			.join("\n\n");

		return {
			success: true,
			data: markdown,
		};
	},
};

export default step;
