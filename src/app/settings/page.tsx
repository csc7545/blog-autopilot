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
        <h1 className="text-2xl font-bold mb-6">설정</h1>

        <div className="space-y-6">
          <div>
            <label htmlFor="gemini-api-key" className="block text-sm font-medium mb-2">
              Gemini API Key
            </label>
            <input
              id="gemini-api-key"
              type="password"
              value={settings.geminiApiKey}
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
              placeholder="AIza..."
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Google AI Studio에서 발급받은 API 키를 입력하세요.
            </p>
          </div>

          <div>
            <label htmlFor="image-provider" className="block text-sm font-medium mb-2">
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
              className="w-full px-3 py-2 border rounded-md"
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {saved ? '저장됨!' : '저장하기'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
