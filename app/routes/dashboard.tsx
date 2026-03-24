import { useState } from "react";
import { Outlet, Link, useLocation, useLoaderData, redirect } from "react-router";
import {
  Wand2,
  History,
  Key,
  Settings,
  LogOut,
  Menu,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { signOut } from "~/lib/auth-client";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/dashboard";

export async function loader({ context, request }: Route.LoaderArgs) {
  const { createAuth } = await import("../../server/lib/auth");
  const auth = createAuth(context.cloudflare.env as any);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect("/sign-in");
  return { user: session.user };
}

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Extract", href: "/dashboard/extract", icon: Wand2 },
  { name: "History", href: "/dashboard/history", icon: History },
  { name: "API Keys", href: "/dashboard/keys", icon: Key },
  { name: "Usage", href: "/dashboard/usage", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  function NavLink({
    item,
    onClick,
  }: {
    item: (typeof navigation)[0];
    onClick?: () => void;
  }) {
    const isActive =
      item.href === "/dashboard"
        ? location.pathname === "/dashboard"
        : location.pathname.startsWith(item.href);

    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm min-h-[44px] transition-colors",
          isActive
            ? "border-l-2 border-[hsl(var(--foreground))] bg-[hsl(var(--muted))] font-medium text-[hsl(var(--foreground))]"
            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.name}
      </Link>
    );
  }

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b border-[hsl(var(--border))] px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/extract-vibe-logo.svg" className="h-6 w-6" alt="ExtractVibe" />
          <span className="text-base font-semibold">ExtractVibe</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            item={item}
            onClick={() => setSidebarOpen(false)}
          />
        ))}
      </nav>
      <div className="border-t border-[hsl(var(--border))] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-sm font-medium text-[hsl(var(--foreground))]">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">{user.name || "User"}</p>
            <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 flex w-64 flex-col bg-[hsl(var(--card))]"
            role="dialog"
            aria-modal={true}
            aria-label="Navigation"
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm font-semibold lg:hidden">ExtractVibe</span>
          </div>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {user.name || user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-[hsl(var(--muted-foreground))]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
