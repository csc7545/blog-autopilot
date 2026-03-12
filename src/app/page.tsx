'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { useDraftStore } from '@/store/draftStore';
import type { PersonaId } from '@/types/pipeline';

const STORAGE_KEY = 'blog-autopilot-settings';

const PERSONA_OPTIONS: { value: PersonaId; label: string; description: string }[] = [
  {
    value: 'female-20s-student-jobseeker',
    label: '20대 여성 대학생/취준생',
    description: '맛집·여행·패션 탐색과 블로그/카페 활동이 활발한 사용자',
  },
  {
    value: 'male-20s-student-junior-worker',
    label: '20대 남성 대학생/직장 초년생',
    description: 'IT 정보, 게임/취미 카페, 뉴스 소비 성향이 강한 사용자',
  },
  {
    value: 'female-30s-office-worker',
    label: '30대 여성 직장인',
    description: '쇼핑·육아 정보와 여행/맛집 탐색 비중이 높은 사용자',
  },
  {
    value: 'female-30s-homemaker',
    label: '30대 여성 주부',
    description: '네이버 쇼핑과 육아/생활 정보, 지역 카페 활용이 높은 핵심 소비층',
  },
  {
    value: 'male-40s-office-worker',
    label: '40대 남성 직장인',
    description: '뉴스·금융·부동산 검색과 시사/정치 관심이 높은 사용자',
  },
  {
    value: 'female-40s-homemaker',
    label: '40대 여성 주부',
    description: '쇼핑·육아·건강 정보와 지역 커뮤니티 활동 비중이 높은 사용자',
  },
  {
    value: 'male-50plus-current-affairs',
    label: '50대 이상 남성',
    description: '뉴스·정치·시사 검색과 댓글 참여 성향이 높은 사용자',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { createDraft } = useDraftStore();
  const [keyword, setKeyword] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('female-30s-homemaker');
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

    let draftId: string | null = null;

    try {
      const draft = createDraft(keyword);
      draftId = draft.id;
      draft.selectedPersona = selectedPersona;

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
      // 생성 실패 시 초안 삭제
      if (draftId) {
        useDraftStore.getState().deleteDraft(draftId);
      }
      setError(err instanceof Error ? err.message : '생성 중 오류 발생');
      setIsGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-2xl border border-secondary/40 bg-gradient-to-br from-[#103973]/35 via-[#101010] to-[#101010] p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <p className="mb-3 inline-flex rounded-full border border-accent/60 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            PENGUIN MODE
          </p>
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-white">Blog Autopilot</h1>
          <p className="text-sm text-white/75">
            키워드만 입력하면 네이버 최적화 블로그 포스트를 자동으로 생성해줘요.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="블로그 키워드를 입력하세요..."
            className="w-full rounded-xl border border-secondary/45 bg-[#101010] px-4 py-3 text-lg text-white placeholder:text-white/45 focus:border-accent focus:outline-none"
            disabled={isGenerating}
          />

          <div className="text-left">
            <label
              htmlFor="persona-select"
              className="mb-2 block text-sm font-medium text-white/85"
            >
              타겟 페르소나
            </label>
            <select
              id="persona-select"
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value as PersonaId)}
              disabled={isGenerating}
              className="w-full rounded-xl border border-secondary/45 bg-[#101010] px-3 py-2 text-white focus:border-accent focus:outline-none"
            >
              {PERSONA_OPTIONS.map((persona) => (
                <option key={persona.value} value={persona.value}>
                  {persona.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-white/65">
              {PERSONA_OPTIONS.find((p) => p.value === selectedPersona)?.description}
            </p>
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full rounded-xl bg-secondary px-6 py-3 text-lg font-semibold text-white shadow-[0_8px_24px_rgba(82,139,230,0.35)] transition-colors hover:bg-[#3f78d3] disabled:cursor-not-allowed disabled:bg-white/30"
          >
            {isGenerating ? '생성 중...' : '생성하기'}
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-accent/35 bg-[#103973]/30 p-6 text-left">
          <h2 className="mb-4 font-semibold text-accent">제공되는 기능</h2>
          <ul className="space-y-2 text-sm text-white/85">
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
