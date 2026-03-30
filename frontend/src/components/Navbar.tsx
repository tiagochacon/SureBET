'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useStore } from '@/store/useStore';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/history', label: 'Histórico' },
  { href: '/settings', label: 'Configurações' },
];

export function Navbar() {
  const pathname = usePathname();
  const { wsConnected, opportunities } = useStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-ds-border glass">
      <div className="flex items-center h-full px-6 max-w-7xl mx-auto gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-ds-blue to-ds-blue-dark flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-heading text-[16px] text-ds-white">SureBet</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'px-3 py-1.5 rounded-btn-sm font-body text-[13px] transition-all duration-200',
                pathname === href
                  ? 'bg-ds-surface-4 text-ds-white border border-ds-border'
                  : 'text-ds-white-40 hover:text-ds-white hover:bg-ds-surface-3',
              )}
            >
              {label}
              {href === '/' && opportunities.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-ds-blue text-[10px] text-white">
                  {opportunities.length}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Status dot */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={clsx(
              'w-1.5 h-1.5 rounded-full',
              wsConnected ? 'bg-ds-green animate-pulse' : 'bg-ds-red',
            )}
          />
          <span className="font-body text-[12px] text-ds-white-40">
            {wsConnected ? 'Ao vivo' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
