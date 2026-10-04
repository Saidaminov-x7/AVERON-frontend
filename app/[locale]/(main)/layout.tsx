interface MainLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  return <div className="averon-site-shell min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">{children}</div>;
}