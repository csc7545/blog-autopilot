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
    <div className="space-y-4 rounded-2xl border border-white/15 bg-gradient-to-br from-[#103973]/35 via-white/5 to-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
      <h3 className="text-lg font-semibold text-accent">내보내기</h3>

      <div className="space-y-3">
        {htmlResult && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(htmlResult, 'html')}
              className="flex-1 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
            >
              {copied === 'html' ? '복사됨!' : 'HTML 복사'}
            </button>
            <button
              type="button"
              onClick={() => downloadFile(htmlResult, `${draft.keyword}.html`)}
              className="flex-1 rounded-lg bg-secondary px-4 py-2 font-semibold text-white shadow-[0_8px_20px_rgba(82,139,230,0.35)] transition-colors hover:bg-[#3f78d3]"
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
              className="flex-1 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
            >
              {copied === 'md' ? '복사됨!' : 'Markdown 복사'}
            </button>
            <button
              type="button"
              onClick={() => downloadFile(mdResult, `${draft.keyword}.md`)}
              className="flex-1 rounded-lg bg-secondary px-4 py-2 font-semibold text-white shadow-[0_8px_20px_rgba(82,139,230,0.35)] transition-colors hover:bg-[#3f78d3]"
            >
              Markdown 다운로드
            </button>
          </div>
        )}

        {!htmlResult && !mdResult && (
          <p className="text-sm text-white/70">
            내보내기 기능은 파이프라인 완료 후 사용 가능합니다.
          </p>
        )}
      </div>
    </div>
  );
}
