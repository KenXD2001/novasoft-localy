import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, Bell, ChevronsUpDown, CreditCard, FolderKanban, Home, Layers, LayoutDashboard, LogOut,
  Moon, PanelLeft, Search, Settings, Sun, User, Waypoints, Zap,
} from "lucide-react";
import { cn } from "../lib/utils";
import { navSections } from "../lib/data";
import { Badge, Button } from "./primitives";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { Button as ShadcnButton } from "./ui/button";
import { Kbd } from "./ui/kbd";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import CommandPalette from "./CommandPalette";

const iconMap: Record<string, typeof Home> = {
  dashboard: LayoutDashboard, projects: FolderKanban, services: Layers,
  tunnels: Waypoints, activities: Activity, settings: Settings,
};

/* ---------- theme: default light, manual choice persists across hard refresh ---------- */
function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("locally-theme") === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("locally-theme", dark ? "dark" : "light");
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [dark]);
  return { dark, setDark };
}

/* ---------- auth shell ---------- */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full grid lg:grid-cols-2 bg-background">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {children}
        </motion.div>
      </div>
      {/* editorial brand panel — 2026 premium fintech feel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0b0d1a] p-12 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_20%,rgba(190,242,100,0.16),transparent),radial-gradient(50%_40%_at_20%_90%,rgba(101,163,13,0.18),transparent)]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary"><Zap className="h-4.5 w-4.5 text-primary-foreground" /></div>
          <span className="text-[17px] font-semibold tracking-tight">Locally</span>
        </div>
        <div className="relative">
          <Badge tone="default" className="mb-5">New · AI summaries for every metric</Badge>
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight">Clarity for every<br />number that matters.</h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/60">One calm dashboard for revenue, customers and operations — designed to answer, not overwhelm.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {[["$128k", "Revenue YTD"], ["8.5k", "Customers"], ["99.2%", "Uptime"]].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-xl font-semibold tabular-nums">{v}</div>
                <div className="mt-1 text-xs text-white/50">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center justify-between text-xs text-white/40">
          <span>© 2026 Locally Inc.</span><span>SOC 2 · GDPR ready</span>
        </div>
      </div>
    </div>
  );
}

function UserAvatar({ size = "default" }: { size?: "default" | "sm" }) {
  return (
    <Avatar size={size}>
      <AvatarImage src="https://github.com/shadcn.png" alt="Sarah Chen" />
      <AvatarFallback>SC</AvatarFallback>
      <AvatarBadge className="bg-emerald-500" />
    </Avatar>
  );
}

/* 2026 sidebar-footer pattern: identity trigger + upward account menu */
function UserMenu({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <UserAvatar />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium leading-tight">Sarah Chen</span>
              <span className="block truncate text-xs text-muted-foreground">sarah@company.com</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8}>
        <div className="flex items-center gap-2.5 px-1.5 py-1.5">
          <UserAvatar size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium leading-tight">Sarah Chen</p>
            <p className="truncate text-xs text-muted-foreground">sarah@company.com</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem><User />Account</DropdownMenuItem>
        <DropdownMenuItem><CreditCard />Billing</DropdownMenuItem>
        <DropdownMenuItem><Settings />Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => navigate("/login")}><LogOut />Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* 2026 header pattern: route-derived trail next to the toggle */
function HeaderBreadcrumbs() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/projects/overview")) {
    const tab = pathname.split("/").pop() || "details";
    const label = tab.charAt(0).toUpperCase() + tab.slice(1);
    return (
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/projects" />}>Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/projects/overview/details" />}>Overview</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }
  const current = navSections.flatMap((s) => s.items).find((i) => i.to === pathname)?.label ?? "Dashboard";
  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/* ---------- sidebar ---------- */
function Sidebar({ collapsed, mobileOpen, onCloseMobile }: { collapsed: boolean; mobileOpen: boolean; onCloseMobile: () => void }) {
  const loc = useLocation();
  const nav = (to: string, label: string, icon: string, badge?: string) => {
    const active = loc.pathname === to || (to !== "/" && loc.pathname.startsWith(`${to}/`));
    const Icon = iconMap[icon] ?? Home;
    return (
      <Link
        key={label} to={to} onClick={onCloseMobile}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors",
          active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
        {!collapsed && badge && (
          <span className={cn("rounded-full px-2 py-0.5 text-[11px]", active ? "bg-primary/20 text-foreground" : "bg-muted text-muted-foreground")}>{badge}</span>
        )}
        {active && <span className="absolute left-0 h-5 w-1 rounded-r-full bg-primary" />}
      </Link>
    );
  };

  const inner = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0"><Zap className="h-4 w-4 text-primary-foreground" /></div>
        {!collapsed && <span className="text-[15px] font-semibold tracking-tight">Locally</span>}
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {navSections.map((s) => (
          <div key={s.label}>
            {!collapsed && <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{s.label}</p>}
            <div className="relative space-y-0.5">{s.items.map((i) => nav(i.to, i.label, i.icon, i.badge))}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-3">
        <UserMenu collapsed={collapsed} />
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 border-r border-border bg-card transition-all lg:block", collapsed ? "w-[76px]" : "w-[264px]")}>{inner}</aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCloseMobile} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed left-0 top-0 z-50 h-full w-[264px] border-r border-border bg-card lg:hidden">
              {inner}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- main shell: sidebar left, header top-right, body below ---------- */
export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const { dark, setDark } = useTheme();

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((v) => !v); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // ponytail: one toggle — collapses the rail on desktop, opens the drawer on mobile
  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setCollapsed((v) => !v);
    else setMobileOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="rounded-lg p-2 hover:bg-muted" aria-label="Toggle sidebar"><PanelLeft className="h-5 w-5" /></button>
            <HeaderBreadcrumbs />
          </div>
          <div className="flex flex-1 justify-center px-2">
            <ShadcnButton variant="outline" onClick={() => setPalette(true)} className="hidden w-full max-w-md justify-start gap-2 font-normal text-muted-foreground sm:flex">
              <Search />Search…
              <Kbd className="ml-auto">⌘K</Kbd>
            </ShadcnButton>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Toggle theme">
              {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1200px]"><Outlet /></div>
        </main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
