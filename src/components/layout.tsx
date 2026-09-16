import { Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-soft">
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          <path d="M3 12h3l2-5 4 10 2-5h7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="font-display font-bold text-xl tracking-tight">LifeLine</span>
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="w-9 h-9 grid place-items-center rounded-lg border border-border hover:bg-muted transition-colors"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round"/></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinejoin="round"/></svg>
      )}
    </button>
  );
}

function UserMenu() {
  const { user, logout, isAdmin, canCreateCampaign } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  if (!user) {
    return (
      <Link to="/login" className="hidden sm:inline-flex items-center h-9 px-3 rounded-lg text-sm font-medium hover:bg-muted transition">
        Sign in
      </Link>
    );
  }
  const initials = (user.firstName[0] ?? "") + (user.lastName[0] ?? "");
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="w-9 h-9 grid place-items-center rounded-full bg-primary/10 text-primary font-semibold text-sm border border-border hover:bg-primary/15 transition">
        {initials.toUpperCase() || "U"}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-card shadow-soft p-2 z-50">
          <div className="px-3 py-2">
            <div className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            <div className="mt-1 inline-block text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{user.role}</div>
          </div>
          <div className="h-px bg-border my-1" />
          {canCreateCampaign() && (
            <Link to="/dashboard" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-muted">My dashboard</Link>
          )}
          {isAdmin() && (
            <Link to="/admin" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-muted text-trust font-medium">Admin dashboard</Link>
          )}
          <Link to="/change-password" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-muted">Change password</Link>
          <button onClick={() => { logout(); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted text-destructive">Sign out</button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { canCreateCampaign } = useAuth();
  const linkCls = "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors";
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container-page flex items-center justify-between h-16">
        <Logo />
        <nav className="hidden md:flex items-center gap-7">
          <Link to="/privacy" className={linkCls} activeProps={{ className: "text-foreground" }}>Privacy</Link>
          <Link to="/" className={linkCls} activeProps={{ className: "text-foreground" }}>Home</Link>
          <Link to="/faq" className={linkCls} activeProps={{ className: "text-foreground" }}>FAQ</Link>
          <Link to="/about" className={linkCls} activeProps={{ className: "text-foreground" }}>About</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
          {canCreateCampaign() && (
            <Link
              to="/create"
              className="hidden sm:inline-flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-soft transition"
            >
              Start a fundraiser
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-24">
      <div className="container-page py-12 grid gap-8 md:grid-cols-4">
        <div>
          <Logo />
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">
            A trusted infrastructure for critical medical moments.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/campaigns">Browse campaigns</Link></li>
            <li><Link to="/create">Start a fundraiser</Link></li>
            <li><Link to="/about">How verification works</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Trust & safety</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/about">Verification policy</Link></li>
            <li><a href="#">Report a campaign</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>med.lifeline.supports@gmail.com</li>
            <li>Lagos · Kano · Africa</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page py-5 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>© 2026 LifeLine. All rights reserved.</span>
          <span>For emergency moments.</span>
        </div>
      </div>
    </footer>
  );
}
