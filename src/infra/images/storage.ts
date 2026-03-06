import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const GENERATED_DIR = path.join(process.cwd(), 'public', 'generated');

function normalizeExtension(mimeType: string): string {
  if (mimeType === 'image/jpeg') {
    return 'jpg';
  }

  if (mimeType === 'image/webp') {
    return 'webp';
  }

  if (mimeType === 'image/svg+xml') {
    return 'svg';
  }

  return 'png';
}

export async function saveBase64Image(params: {
  base64Data: string;
  mimeType: string;
  prefix: string;
}): Promise<{ filename: string; url: string }> {
  const { base64Data, mimeType, prefix } = params;
  const extension = normalizeExtension(mimeType);
  const filename = `${prefix}-${Date.now()}.${extension}`;
  const filePath = path.join(GENERATED_DIR, filename);

  await mkdir(GENERATED_DIR, { recursive: true });
  await writeFile(filePath, Buffer.from(base64Data, 'base64'));

  return {
    filename,
    url: `/generated/${filename}`,
  };
}

export async function saveSvgImage(params: {
  svg: string;
  prefix: string;
}): Promise<{ filename: string; url: string }> {
  const { svg, prefix } = params;
  const filename = `${prefix}-${Date.now()}.svg`;
  const filePath = path.join(GENERATED_DIR, filename);

  await mkdir(GENERATED_DIR, { recursive: true });
  await writeFile(filePath, svg, 'utf-8');

  return {
    filename,
    url: `/generated/${filename}`,
  };
}
