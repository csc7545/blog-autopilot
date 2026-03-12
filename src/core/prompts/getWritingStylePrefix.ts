import type { DraftState } from '@/types/pipeline';
import { getPrompt } from './getPrompt';

/**
 * Returns the top-level writing style prompt, contextualized with the
 * selected persona from the draft. Prepend this to any content-generating step.
 */
export async function getWritingStylePrefix(draft: DraftState): Promise<string> {
  const base = await getPrompt('writingStyle');
  if (!base) return '';

  const persona = draft.personaResult?.selectedPersona ?? '';
  if (!persona) return base;

  return `${base}\n\n[현재 선택된 페르소나: ${persona}]\n위 페르소나에 맞는 어투와 스타일을 반드시 적용하세요.\n\n---\n`;
}
