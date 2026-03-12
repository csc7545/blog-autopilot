'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/AppShell';

interface Settings {
  geminiApiKey: string;
  imageProvider: 'gemini' | 'stub' | 'dalle' | 'stability';
  naverId: string;
  naverPw: string;
}

const STORAGE_KEY = 'blog-autopilot-settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    geminiApiKey: '',
    imageProvider: 'gemini',
    naverId: '',
    naverPw: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSettings((prev) => ({ ...prev, ...parsed }));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="mb-6 text-2xl font-bold text-white">설정</h1>

        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
          <div>
            <label
              htmlFor="gemini-api-key"
              className="mb-2 block text-sm font-medium text-white/85"
            >
              Gemini API Key
            </label>
            <input
              id="gemini-api-key"
              type="password"
              value={settings.geminiApiKey}
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
              placeholder="AIza..."
              className="w-full rounded-xl border border-secondary/45 bg-[#101010] px-3 py-2 text-white placeholder:text-white/45 focus:border-accent focus:outline-none"
            />
            <p className="mt-1 text-xs text-white/65">
              Google AI Studio에서 발급받은 API 키를 입력하세요.
            </p>
          </div>

          <div>
            <label
              htmlFor="image-provider"
              className="mb-2 block text-sm font-medium text-white/85"
            >
              이미지 생성 제공자
            </label>
            <select
              id="image-provider"
              value={settings.imageProvider}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  imageProvider: e.target.value as Settings['imageProvider'],
                })
              }
              className="w-full rounded-xl border border-secondary/45 bg-[#101010] px-3 py-2 text-white focus:border-accent focus:outline-none"
            >
              <option value="gemini">Gemini Nano Banana</option>
              <option value="stub">Stub (테스트용)</option>
              <option value="dalle">DALL-E (준비중)</option>
              <option value="stability">Stability AI (준비중)</option>
            </select>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h2 className="mb-4 text-lg font-semibold text-accent">네이버 블로그 설정</h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="naver-id"
                  className="mb-2 block text-sm font-medium text-white/85"
                >
                  네이버 ID
                </label>
                <input
                  id="naver-id"
                  type="text"
                  value={settings.naverId}
                  onChange={(e) => setSettings({ ...settings, naverId: e.target.value })}
                  placeholder="네이버 아이디"
                  className="w-full rounded-xl border border-secondary/45 bg-[#101010] px-3 py-2 text-white placeholder:text-white/45 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="naver-pw"
                  className="mb-2 block text-sm font-medium text-white/85"
                >
                  네이버 비밀번호
                </label>
                <input
                  id="naver-pw"
                  type="password"
                  value={settings.naverPw}
                  onChange={(e) => setSettings({ ...settings, naverPw: e.target.value })}
                  placeholder="비밀번호"
                  className="w-full rounded-xl border border-secondary/45 bg-[#101010] px-3 py-2 text-white placeholder:text-white/45 focus:border-accent focus:outline-none"
                />
              </div>

              <p className="text-xs text-white/50">
                계정 정보는 브라우저 로컬스토리지에 저장됩니다. 공유 기기에서는 주의하세요.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-secondary px-4 py-2 font-semibold text-white shadow-[0_8px_20px_rgba(82,139,230,0.35)] transition-colors hover:bg-[#3f78d3]"
          >
            {saved ? '저장됨!' : '저장하기'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
