/**
 * ExtractVibe OpenAPI Spec Generator
 *
 * Generates an OpenAPI 3.1.0 specification from the Zod schemas.
 * Served at GET /api/openapi.json.
 */

import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod/v3";
import * as schemas from "../schema/api";

extendZodWithOpenApi(z);

export function generateOpenAPISpec() {
  const registry = new OpenAPIRegistry();

  // ─── Security Schemes ───────────────────────────────────────────────

  registry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "better-auth.session_token",
    description: "Session cookie set by Better Auth sign-in flow",
  });

  registry.registerComponent("securitySchemes", "apiKeyAuth", {
    type: "apiKey",
    in: "header",
    name: "x-api-key",
    description: "API key with `ev_` prefix, created via POST /api/keys",
  });

  // ─── Shared response definitions ───────────────────────────────────

  const unauthorizedResponse = {
    description: "Unauthorized — missing or invalid session/API key",
    content: {
      "application/json": { schema: schemas.ErrorResponse },
    },
  };

  const rateLimitResponse = {
    description: "Rate limit exceeded",
    content: {
      "application/json": { schema: schemas.RateLimitError },
    },
  };

  const notFoundResponse = {
    description: "Resource not found",
    content: {
      "application/json": { schema: schemas.ErrorResponse },
    },
  };

  // ─── GET /api ───────────────────────────────────────────────────────

  registry.registerPath({
    method: "get",
    path: "/api",
    summary: "API index",
    description: "Lists all available API endpoints.",
    tags: ["Meta"],
    responses: {
      200: {
        description: "API endpoint listing",
        content: {
          "application/json": { schema: schemas.ApiIndexResponse },
        },
      },
    },
  });

  // ─── GET /api/health ────────────────────────────────────────────────

  registry.registerPath({
    method: "get",
    path: "/api/health",
    summary: "Health check",
    description: "Returns API health status and version.",
    tags: ["Meta"],
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": { schema: schemas.HealthResponse },
        },
      },
    },
  });

  // ─── POST /api/extract ─────────────────────────────────────────────

  registry.registerPath({
    method: "post",
    path: "/api/extract",
    summary: "Start a new brand extraction",
    description:
      "Extracts brand identity from the given URL. Anonymous users get 3 free extractions per day. Authenticated users consume 1 credit per extraction.",
    tags: ["Extraction"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }, {}],
    request: {
      body: {
        required: true,
        content: {
          "application/json": { schema: schemas.ExtractRequest },
        },
      },
    },
    responses: {
      202: {
        description: "Extraction started",
        content: {
          "application/json": { schema: schemas.ExtractResponse },
        },
      },
      400: {
        description: "Invalid or missing URL",
        content: {
          "application/json": { schema: schemas.ErrorResponse },
        },
      },
      402: {
        description: "No credits remaining",
        content: {
          "application/json": { schema: schemas.ErrorResponse },
        },
      },
      429: rateLimitResponse,
    },
  });

  // ─── GET /api/extract/history ──────────────────────────────────────

  registry.registerPath({
    method: "get",
    path: "/api/extract/history",
    summary: "Get extraction history",
    description:
      "Returns the authenticated user's extraction history, most recent first (limit 50).",
    tags: ["Extraction"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    responses: {
      200: {
        description: "Extraction history",
        content: {
          "application/json": { schema: schemas.HistoryResponse },
        },
      },
      401: unauthorizedResponse,
      429: rateLimitResponse,
    },
  });

  // ─── GET /api/extract/:jobId ───────────────────────────────────────

  registry.registerPath({
    method: "get",
    path: "/api/extract/{jobId}",
    summary: "Poll job status",
    description:
      "Returns the current status of an extraction job. Open to anyone with the job ID.",
    tags: ["Extraction"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }, {}],
    request: {
      params: z.object({
        jobId: z.string().openapi({ description: "Extraction job UUID" }),
      }),
    },
    responses: {
      200: {
        description: "Job status",
        content: {
          "application/json": { schema: schemas.JobStatusResponse },
        },
      },
      404: notFoundResponse,
      429: rateLimitResponse,
    },
  });

  // ─── GET /api/extract/:jobId/result ────────────────────────────────

  registry.registerPath({
    method: "get",
    path: "/api/extract/{jobId}/result",
    summary: "Get extraction result",
    description:
      "Returns the cached brand kit result for a completed extraction job.",
    tags: ["Extraction"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }, {}],
    request: {
      params: z.object({
        jobId: z.string().openapi({ description: "Extraction job UUID" }),
      }),
    },
    responses: {
      200: {
        description: "Brand kit extraction result",
        content: {
          "application/json": {
            schema: schemas.ExtractVibeBrandKitSchema,
          },
        },
      },
      404: notFoundResponse,
      429: rateLimitResponse,
    },
  });

  // ─── GET /api/extract/:jobId/export/:format ───────────────────────

  registry.registerPath({
    method: "get",
    path: "/api/extract/{jobId}/export/{format}",
    summary: "Export brand kit in a specific format",
    description:
      "Downloads the brand kit in JSON, CSS variables, Tailwind theme, Markdown report, or design tokens format. Requires authentication.",
    tags: ["Extraction"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    request: {
      params: z.object({
        jobId: z.string().openapi({ description: "Extraction job UUID" }),
        format: schemas.ExportFormat.openapi({
          description: "Export format",
        }),
      }),
    },
    responses: {
      200: {
        description: "Exported brand kit file",
        content: {
          "application/json": {
            schema: z.any().openapi({
              description: "JSON brand kit (format=json) or design tokens (format=tokens)",
            }),
          },
          "text/css": {
            schema: z.string().openapi({
              description: "CSS variables (format=css) or Tailwind theme (format=tailwind)",
            }),
          },
          "text/markdown": {
            schema: z.string().openapi({
              description: "Markdown brand report (format=markdown)",
            }),
          },
        },
      },
      400: {
        description: "Invalid export format",
        content: {
          "application/json": { schema: schemas.ErrorResponse },
        },
      },
      401: unauthorizedResponse,
      404: notFoundResponse,
      429: rateLimitResponse,
    },
  });

  // ─── GET /api/brand/:domain ────────────────────────────────────────

  registry.registerPath({
    method: "get",
    path: "/api/brand/{domain}",
    summary: "Get brand kit by domain",
    description:
      "Returns the cached brand kit for a given domain. The domain must have been previously extracted.",
    tags: ["Brand"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }, {}],
    request: {
      params: z.object({
        domain: z
          .string()
          .openapi({ description: "Domain name, e.g. stripe.com" }),
      }),
    },
    responses: {
      200: {
        description: "Brand kit for the domain",
        content: {
          "application/json": {
            schema: schemas.ExtractVibeBrandKitSchema,
          },
        },
      },
      404: notFoundResponse,
      429: rateLimitResponse,
    },
  });

  // ─── GET /api/credits ──────────────────────────────────────────────

  registry.registerPath({
    method: "get",
    path: "/api/credits",
    summary: "Get credit balance",
    description:
      "Returns the authenticated user's current credit balance and plan.",
    tags: ["Account"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    responses: {
      200: {
        description: "Credit balance",
        content: {
          "application/json": { schema: schemas.CreditsResponse },
        },
      },
      401: unauthorizedResponse,
    },
  });

  // ─── POST /api/keys ────────────────────────────────────────────────

  registry.registerPath({
    method: "post",
    path: "/api/keys",
    summary: "Create a new API key",
    description:
      'Creates a new API key with the `ev_` prefix. The raw key is only returned once in the response — store it securely.',
    tags: ["API Keys"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    request: {
      body: {
        required: false,
        content: {
          "application/json": { schema: schemas.CreateKeyRequest },
        },
      },
    },
    responses: {
      201: {
        description: "API key created",
        content: {
          "application/json": { schema: schemas.CreateKeyResponse },
        },
      },
      401: unauthorizedResponse,
    },
  });

  // ─── GET /api/keys ─────────────────────────────────────────────────

  registry.registerPath({
    method: "get",
    path: "/api/keys",
    summary: "List API keys",
    description:
      "Returns all active (non-revoked) API keys for the authenticated user. Key values are not returned — only metadata.",
    tags: ["API Keys"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    responses: {
      200: {
        description: "List of API keys",
        content: {
          "application/json": { schema: schemas.ApiKeysList },
        },
      },
      401: unauthorizedResponse,
    },
  });

  // ─── DELETE /api/keys/:id ──────────────────────────────────────────

  registry.registerPath({
    method: "delete",
    path: "/api/keys/{id}",
    summary: "Revoke an API key",
    description: "Permanently deletes the specified API key.",
    tags: ["API Keys"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    request: {
      params: z.object({
        id: z.string().openapi({ description: "API key UUID" }),
      }),
    },
    responses: {
      200: {
        description: "Key revoked",
        content: {
          "application/json": { schema: schemas.DeleteKeyResponse },
        },
      },
      401: unauthorizedResponse,
      404: notFoundResponse,
    },
  });

  // ─── GET /api/openapi.json ─────────────────────────────────────────

  registry.registerPath({
    method: "get",
    path: "/api/openapi.json",
    summary: "OpenAPI specification",
    description:
      "Returns this OpenAPI 3.1.0 specification document as JSON.",
    tags: ["Meta"],
    responses: {
      200: {
        description: "OpenAPI spec",
        content: {
          "application/json": {
            schema: z.any().openapi({
              description: "OpenAPI 3.1.0 specification document",
            }),
          },
        },
      },
    },
  });

  // ─── Generate Document ─────────────────────────────────────────────

  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "ExtractVibe API",
      version: "0.1.0",
      description:
        "Open-source brand intelligence API. Extract colors, typography, voice, personality, and design system from any website.",
      contact: {
        url: "https://extractvibe.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      { url: "https://extractvibe.com", description: "Production" },
      { url: "http://localhost:5173", description: "Local development" },
    ],
    tags: [
      {
        name: "Meta",
        description: "Health checks and API metadata",
      },
      {
        name: "Extraction",
        description:
          "Start, poll, and retrieve brand extraction jobs",
      },
      {
        name: "Brand",
        description: "Look up previously extracted brand kits by domain",
      },
      {
        name: "Account",
        description: "Credit balance and account information",
      },
      {
        name: "API Keys",
        description: "Create, list, and revoke API keys",
      },
    ],
  });
}
