import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

interface NavigationItem {
  href: string;
  label: string;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { href: '/', label: '생성' },
  { href: '/drafts', label: '초안' },
  { href: '/settings', label: '설정' },
];

export function AppShell({ children }: AppShellProps): ReactElement {
  return (
    <div className="min-h-screen bg-primary text-white">
      <header className="sticky top-0 z-20 border-b border-accent/70 bg-[#103973]/90 text-white shadow-[0_12px_36px_rgba(16,57,115,0.55)] backdrop-blur">
        <nav aria-label="메인 내비게이션" className="container mx-auto px-4 py-4">
          <ul className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2">
            {NAVIGATION_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-10">{children}</main>
    </div>
  );
}
