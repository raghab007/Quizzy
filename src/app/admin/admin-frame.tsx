"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/admin/dashboard", label: "Overview", icon: "◫" },
  { href: "/admin/quizzes", label: "Quizzes", icon: "▤" },
  { href: "/admin/question-bank", label: "Question bank", icon: "◈" },
  { href: "/admin/results", label: "Student results", icon: "↗" },
];

export default function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;

  const current = navigation.find((item) => item.href === pathname);
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand"><span className="admin-brand-mark">Q</span><span>quizzy<span className="admin-brand-dot">.</span><small>ASSESSMENT STUDIO</small></span></Link>
        <p className="admin-nav-label">WORKSPACE</p>
        <nav aria-label="Admin navigation" className="admin-nav">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`admin-nav-link${active ? " active" : ""}`}><span className="admin-nav-icon">{item.icon}</span>{item.label}{active && <span className="admin-nav-indicator" />}</Link>;
          })}
        </nav>
        <div className="admin-sidebar-bottom"><div className="admin-help-icon">?</div><div><strong>Need a hand?</strong><span>Manage your assessments with confidence.</span></div></div>
      </aside>
      <div className="admin-main-column">
        <header className="admin-topbar"><div className="admin-breadcrumb"><span>Workspace</span><span className="admin-crumb-sep">/</span><strong>{current?.label ?? "Admin"}</strong></div><div className="admin-topbar-user"><span className="admin-status-dot" />Admin workspace<span className="admin-avatar">Q</span></div></header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
