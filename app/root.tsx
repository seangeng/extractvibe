import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { LinksFunction } from "react-router";
import "./styles/app.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap",
  },
  { rel: "icon", type: "image/svg+xml", href: "/extract-vibe-logo.svg" },
  {
    rel: "alternate",
    type: "text/plain",
    href: "https://extractvibe.com/llms.txt",
    title: "LLM-friendly site summary",
  },
  {
    rel: "alternate",
    type: "text/plain",
    href: "https://extractvibe.com/llms-full.txt",
    title: "Complete API documentation",
  },
  {
    rel: "alternate",
    type: "application/json",
    href: "https://extractvibe.com/api/openapi.json",
    title: "OpenAPI specification",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-[hsl(var(--background))] font-sans text-[hsl(var(--foreground))]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-[hsl(var(--foreground))] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[hsl(var(--background))]"
        >
          Skip to content
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div id="main-content">
      <Outlet />
    </div>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again later.";
  let status = 500;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (status === 404) {
      title = "Page not found";
      message = "The page you're looking for doesn't exist or has been moved.";
    } else if (status === 401) {
      title = "Unauthorized";
      message = "You need to sign in to access this page.";
    } else if (status === 403) {
      title = "Forbidden";
      message = "You don't have permission to access this page.";
    } else {
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-md px-6 text-center">
        <p className="font-display text-8xl font-bold text-[hsl(var(--foreground))]">{status}</p>
        <h1 className="mt-6 text-xl font-medium text-[hsl(var(--foreground))]">
          {title}
        </h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">{message}</p>
        <a
          href="/"
          className="mt-8 inline-flex items-center rounded-full bg-[hsl(var(--foreground))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--background))] transition-all duration-200 hover:opacity-85"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}
