'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { useDraftStore } from '@/store/draftStore';

const STORAGE_KEY = 'blog-autopilot-settings';

export default function HomePage() {
  const router = useRouter();
  const { createDraft } = useDraftStore();
  const [keyword, setKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      setError('키워드를 입력해주세요.');
      return;
    }

    const settings = localStorage.getItem(STORAGE_KEY);
    if (!settings) {
      router.push('/settings');
      return;
    }

    const parsedSettings = JSON.parse(settings) as {
      geminiApiKey?: string;
      imageProvider?: 'gemini' | 'stub' | 'dalle' | 'stability';
    };
    const geminiApiKey = parsedSettings.geminiApiKey;
    const imageProvider = parsedSettings.imageProvider ?? 'gemini';
    if (!geminiApiKey) {
      router.push('/settings');
      return;
    }

    setError('');
    setIsGenerating(true);

    try {
      const draft = createDraft(keyword);

      const response = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft,
          apiKey: geminiApiKey,
          imageProviderType: imageProvider,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '생성 실패');
      }

      const { draft: updatedDraft } = await response.json();

      useDraftStore.getState().updateDraft(updatedDraft.id, updatedDraft);

      router.push(`/drafts/${updatedDraft.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 중 오류 발생');
      setIsGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2">Blog Autopilot</h1>
        <p className="text-gray-600 mb-8">
          키워드만 입력하면 네이버 최적화 블로그 포스트를 자동으로 생성해줘요.
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="블로그 키워드를 입력하세요..."
            className="w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={isGenerating}
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 px-6 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? '생성 중...' : '生成하기'}
          </button>
        </div>

        <div className="mt-12 text-left bg-gray-50 p-6 rounded-lg">
          <h2 className="font-semibold mb-4">제공되는 기능</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ SEO 최적화 제목 제안</li>
            <li>✓ 페르소나 기반 콘텐츠 생성</li>
            <li>✓ 이미지 자동 생성 및 배치</li>
            <li>✓ 네이버 블로그 톤 변환</li>
            <li>✓ HTML/Markdown 내보내기</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
