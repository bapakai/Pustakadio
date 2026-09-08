import Link from 'next/link';

const TABS = [
  { href: '/', label: 'Beranda', icon: 'home' },
  { href: '/cari', label: 'Cari', icon: 'search' },
  { href: '/koleksi', label: 'Koleksi', icon: 'bookmark' },
  { href: '/profil', label: 'Profil', icon: 'user' },
];

const ICONS = {
  home: <path d="M4 11.5L12 5l8 6.5V19a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-7.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  search: <><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
  bookmark: <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  user: <><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
};

export default function BottomTabBar({ active }) {
  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} className={active === tab.href ? 'active' : ''}>
          <span className="dot">
            <svg viewBox="0 0 24 24">{ICONS[tab.icon]}</svg>
          </span>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
