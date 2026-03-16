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
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
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
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
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
        <p className="text-7xl font-bold text-brand-primary">{status}</p>
        <h1 className="mt-4 text-2xl font-semibold text-[hsl(var(--foreground))]">
          {title}
        </h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">{message}</p>
        <a
          href="/"
          className="mt-8 inline-flex items-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}
