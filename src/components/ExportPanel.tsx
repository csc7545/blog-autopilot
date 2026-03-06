'use client';

import { useState } from 'react';
import type { DraftState } from '@/types/pipeline';

interface ExportPanelProps {
  draft: DraftState;
}

export function ExportPanel({ draft }: ExportPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const htmlResult = draft.exportHtmlResult;
  const mdResult = draft.exportMdResult;

  const copyToClipboard = async (content: string, type: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg border space-y-4">
      <h3 className="font-semibold text-lg">내보내기</h3>

      <div className="space-y-3">
        {htmlResult && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(htmlResult, 'html')}
              className="flex-1 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              {copied === 'html' ? '복사됨!' : 'HTML 복사'}
            </button>
            <button
              type="button"
              onClick={() => downloadFile(htmlResult, `${draft.keyword}.html`)}
              className="flex-1 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              HTML 다운로드
            </button>
          </div>
        )}

        {mdResult && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(mdResult, 'md')}
              className="flex-1 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              {copied === 'md' ? '복사됨!' : 'Markdown 복사'}
            </button>
            <button
              type="button"
              onClick={() => downloadFile(mdResult, `${draft.keyword}.md`)}
              className="flex-1 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Markdown 다운로드
            </button>
          </div>
        )}

        {!htmlResult && !mdResult && (
          <p className="text-gray-500 text-sm">
            내보내기 기능은 파이프라인 완료 후 사용 가능합니다.
          </p>
        )}
      </div>
    </div>
  );
}
