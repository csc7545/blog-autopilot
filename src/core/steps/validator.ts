import type { StepContext, StepResult } from "@/core/pipeline/steps";
import type {
	DraftState,
	ImagePlanResult,
	ValidatorResult,
} from "@/types/pipeline";
import type { PipelineStep } from "../steps";

function countParagraphLines(content: string): number[] {
	return content
		.split("\n\n")
		.map((paragraph) => paragraph.trim())
		.filter((paragraph) => paragraph.length > 0)
		.map((paragraph) => paragraph.split("\n").length);
}

function validateSeoStructure(draft: DraftState, errors: string[]): void {
	if (!draft.titlePickResult?.selectedTitle) {
		errors.push("제목이 없습니다");
	}

	if (!draft.outlineResult?.outline.length) {
		errors.push("H2/H3 아웃라인이 없습니다");
	}
}

function validateImagePlacement(draft: DraftState, errors: string[]): void {
	const plannedPositions = new Set(
		draft.imagePlanResult?.images.map((image) => image.position) ?? [],
	);
	const generatedPositions = new Set(
		draft.imagesResult?.images.map((image) => image.position) ?? [],
	);
	const positions: ImagePlanResult["images"][number]["position"][] = [
		"cover",
		"section1",
		"section2",
	];

	for (const position of positions) {
		if (!plannedPositions.has(position)) {
			errors.push(`${position} 이미지 배치 계획이 없습니다`);
		}

		if (!generatedPositions.has(position)) {
			errors.push(`${position} 이미지가 생성되지 않았습니다`);
		}
	}
}

function validateFaqAndMeta(draft: DraftState, errors: string[]): void {
	if (!draft.faqResult?.faqs.length) {
		errors.push("FAQ가 없습니다");
	}

	const metaDescription = draft.metaResult?.metaDescription?.trim() ?? "";
	if (!metaDescription) {
		errors.push("메타 설명이 없습니다");
	}
}

function validateParagraphLength(draft: DraftState, warnings: string[]): void {
	const sections = draft.sectionsResult?.sections ?? [];

	for (const section of sections) {
		const lineCounts = countParagraphLines(section.content);
		if (lineCounts.some((lineCount) => lineCount > 4)) {
			warnings.push(`섹션 "${section.heading}"에 4줄을 초과한 문단이 있습니다`);
		}
	}
}

function validateTone(draft: DraftState, warnings: string[]): void {
	const adjustedContent = draft.naverToneResult?.adjustedContent ?? "";
	if (!adjustedContent) {
		warnings.push("네이버 톤 보정 결과가 비어 있습니다");
		return;
	}

	if (!adjustedContent.includes("?")) {
		warnings.push("독자 질문 문장이 부족할 수 있습니다");
	}

	if (!adjustedContent.includes("경험")) {
		warnings.push("경험 기반 표현이 부족할 수 있습니다");
	}
}

const step: PipelineStep = {
	id: "validator",
	name: "최종 검증",
	description: "SEO 구조 및 품질 기준을 최종 검증합니다",
	dependsOn: ["meta", "images", "naverTone"],

	shouldRun: (draft: DraftState): boolean => !draft.validatorResult,

	async execute(context: StepContext): Promise<StepResult<ValidatorResult>> {
		const { draft } = context;

		const errors: string[] = [];
		const warnings: string[] = [];

		validateSeoStructure(draft, errors);
		validateImagePlacement(draft, errors);
		validateFaqAndMeta(draft, errors);
		validateParagraphLength(draft, warnings);
		validateTone(draft, warnings);

		return {
			success: true,
			data: {
				isValid: errors.length === 0,
				errors,
				warnings,
			},
		};
	},
};

export default step;
