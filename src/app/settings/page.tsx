'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/AppShell';

interface Settings {
  geminiApiKey: string;
  imageProvider: 'gemini' | 'stub' | 'dalle' | 'stability';
}

const STORAGE_KEY = 'blog-autopilot-settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    geminiApiKey: '',
    imageProvider: 'gemini',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSettings(JSON.parse(stored));
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
