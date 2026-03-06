import type { StepContext, StepResult } from "@/core/pipeline/steps";
import type { DraftState } from "@/types/pipeline";
import type { PipelineStep } from "../steps";

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function toParagraphs(text: string): string {
	return text
		.split("\n\n")
		.map((paragraph) => paragraph.trim())
		.filter((paragraph) => paragraph.length > 0)
		.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
		.join("\n");
}

function renderImage(draft: DraftState, position: string): string {
	const image = draft.imagesResult?.images.find(
		(item) => item.position === position,
	);
	if (!image) {
		return "";
	}

	return `<img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt)}" data-filename="${escapeHtml(image.filename)}">`;
}

const step: PipelineStep = {
	id: "exportHtml",
	name: "HTML 내보내기",
	description: "생성된 글을 이미지 포함 HTML 문자열로 변환합니다",
	dependsOn: ["validator"],

	shouldRun: (draft: DraftState): boolean => !draft.exportHtmlResult,

	async execute(context: StepContext): Promise<StepResult<string>> {
		const { draft } = context;
		const title = draft.titlePickResult?.selectedTitle ?? "";
		const sections = draft.sectionsResult?.sections ?? [];
		const summary = draft.summaryResult?.summary ?? "";
		const faqs = draft.faqResult?.faqs ?? [];

		const htmlSections = sections
			.map((section, index) => {
				const imagePosition =
					index === 0 ? "section1" : index === 1 ? "section2" : "";
				const sectionImage = imagePosition
					? renderImage(draft, imagePosition)
					: "";
				return `<h2>${escapeHtml(section.heading)}</h2>\n${toParagraphs(section.content)}\n${sectionImage}`;
			})
			.join("\n\n");

		const faqHtml = faqs
			.map(
				(faq) =>
					`<h3>${escapeHtml(faq.question)}</h3>\n<p>${escapeHtml(faq.answer)}</p>`,
			)
			.join("\n");

		const html = [
			"<article>",
			`<h1>${escapeHtml(title)}</h1>`,
			renderImage(draft, "cover"),
			htmlSections,
			"<h2>요약</h2>",
			`<p>${escapeHtml(summary)}</p>`,
			"<h2>FAQ</h2>",
			faqHtml,
			"</article>",
		]
			.filter((segment) => segment.trim().length > 0)
			.join("\n\n");

		return {
			success: true,
			data: html,
		};
	},
};

export default step;
