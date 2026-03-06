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
  { href: '/', label: '홈' },
  { href: '/generate', label: '생성' },
  { href: '/drafts', label: '초안' },
  { href: '/settings', label: '설정' },
];

export function AppShell({ children }: AppShellProps): ReactElement {
  return (
    <div>
      <header>
        <nav aria-label='메인 내비게이션'>
          <ul>
            {NAVIGATION_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
