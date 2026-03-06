import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PromptName } from './promptManifest';
import { promptManifest } from './promptManifest';

const promptCache = new Map<PromptName, string>();
const PROMPTS_DIR = path.join(process.cwd(), 'src', 'prompts');

function getPromptFilePath(name: PromptName): string {
  return path.join(PROMPTS_DIR, promptManifest[name]);
}

export async function getPrompt(name: PromptName): Promise<string> {
  const cachedPrompt = promptCache.get(name);
  if (cachedPrompt !== undefined) {
    return cachedPrompt;
  }

  const filePath = getPromptFilePath(name);

  try {
    const prompt = await fs.promises.readFile(filePath, 'utf-8');
    promptCache.set(name, prompt);
    return prompt;
  } catch (error) {
    console.error(`[PromptLoader] Failed to load prompt "${name}" from "${filePath}"`, error);
    return '';
  }
}

export function getPromptSync(name: PromptName): string {
  const cachedPrompt = promptCache.get(name);
  if (cachedPrompt !== undefined) {
    return cachedPrompt;
  }

  const filePath = getPromptFilePath(name);

  try {
    const prompt = fs.readFileSync(filePath, 'utf-8');
    promptCache.set(name, prompt);
    return prompt;
  } catch (error) {
    console.error(`[PromptLoader] Failed to load prompt "${name}" from "${filePath}"`, error);
    return '';
  }
}
