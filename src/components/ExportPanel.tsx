'use client';

import { useState } from 'react';
import type { DraftState } from '@/types/pipeline';
import { useDraftStore } from '@/store/draftStore';

interface ExportPanelProps {
  draft: DraftState;
}

const SETTINGS_KEY = 'blog-autopilot-settings';

export function ExportPanel({ draft }: ExportPanelProps) {
  const { updateDraft } = useDraftStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<
    'idle' | 'publishing' | 'success' | 'error'
  >('idle');
  const [publishError, setPublishError] = useState<string | null>(null);

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

  const handleNaverPublish = async () => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      setPublishStatus('error');
      setPublishError('설정에서 네이버 계정을 먼저 입력해주세요.');
      return;
    }

    const settings = JSON.parse(stored);
    if (!settings.naverId || !settings.naverPw) {
      setPublishStatus('error');
      setPublishError('설정에서 네이버 ID와 비밀번호를 입력해주세요.');
      return;
    }

    if (!htmlResult) {
      setPublishStatus('error');
      setPublishError('발행할 HTML 콘텐츠가 없습니다.');
      return;
    }

    setPublishStatus('publishing');
    setPublishError(null);
    updateDraft(draft.id, { publishStatus: 'publishing', publishError: undefined });

    try {
      // Collect image URLs from draft
      const imageUrls = (draft.imagesResult?.images || [])
        .map((img) => img.url)
        .filter(Boolean);

      const response = await fetch('/api/publish/naver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.titlePickResult?.selectedTitle || draft.keyword,
          htmlContent: htmlResult,
          tags: draft.hashtagsResult?.hashtags,
          imageUrls,
          naverId: settings.naverId,
          naverPw: settings.naverPw,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '발행에 실패했습니다.');
      }

      setPublishStatus('success');
      updateDraft(draft.id, {
        publishStatus: 'success',
        publishedUrl: result.postUrl,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setPublishStatus('error');
      setPublishError(msg);
      updateDraft(draft.id, { publishStatus: 'error', publishError: msg });
    }
  };

  const publishButtonText = (): string => {
    switch (publishStatus) {
      case 'publishing':
        return '발행 중...';
      case 'success':
        return '발행 완료!';
      case 'error':
        return '다시 시도';
      default:
        return '네이버 발행';
    }
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

      {htmlResult && (
        <div className="border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={handleNaverPublish}
            disabled={publishStatus === 'publishing'}
            className="w-full rounded-lg bg-[#03C75A] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#02b351] disabled:opacity-50"
          >
            {publishButtonText()}
          </button>
          {publishStatus === 'error' && publishError && (
            <p className="mt-2 text-sm text-red-400">{publishError}</p>
          )}
          {publishStatus === 'success' && (
            <p className="mt-2 text-sm text-green-400">
              네이버 블로그에 성공적으로 발행되었습니다!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
