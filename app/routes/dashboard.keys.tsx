import { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { api } from "~/lib/api";

export function meta() {
  return [{ title: "API Keys — ExtractVibe" }];
}

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const data = await api.get<{ keys: ApiKey[] }>("/api/keys");
      setKeys(data.keys || []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }

  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    setCreateError(null);
    try {
      const result = await api.post<{ id: string; name: string; key: string }>(
        "/api/keys",
        { name: newKeyName.trim() }
      );
      setNewKeyValue(result.key);
      setKeys((prev) => [
        {
          id: result.id,
          name: result.name,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
        },
        ...prev,
      ]);
      setNewKeyName("");
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create API key"
      );
    } finally {
      setCreating(false);
    }
  }

  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleteError(null);
    try {
      await api.delete(`/api/keys/${id}`);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete API key"
      );
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">API Keys</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            Manage API keys for programmatic access
          </p>
        </div>
        {!showCreateForm && !newKeyValue && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create API Key
          </Button>
        )}
      </div>

      {/* Error Messages */}
      {(createError || deleteError) && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-red-600">
              {createError || deleteError}
            </p>
          </CardContent>
        </Card>
      )}

      {/* New Key Display */}
      {newKeyValue && (
        <Card className="border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-[hsl(var(--primary))]" />
              Your new API key
            </CardTitle>
            <CardDescription>
              Copy this key now. You won&apos;t be able to see it again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3 font-mono text-sm">
                {newKeyValue}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(newKeyValue)}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setNewKeyValue(null);
                setShowCreateForm(false);
              }}
            >
              Done
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && !newKeyValue && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create API Key</CardTitle>
            <CardDescription>
              Give your key a name to help you identify it later
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex gap-3">
              <Input
                placeholder="e.g., Production, Development, CI/CD"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                required
                autoFocus
              />
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewKeyName("");
                }}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Keys List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your API Keys</CardTitle>
          <CardDescription>
            Use these keys to authenticate API requests
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
                <Key className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
              </div>
              <h3 className="mt-4 font-medium">No API keys yet</h3>
              <p className="mt-1 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
                Create an API key to start using the ExtractVibe API
                programmatically.
              </p>
              {!showCreateForm && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Create your first key
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[hsl(var(--muted))]">
                      <Key className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{key.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                        <code>ev_****...</code>
                        <span>
                          Created{" "}
                          {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                        {key.lastUsedAt && (
                          <span>
                            Last used{" "}
                            {new Date(key.lastUsedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
                    onClick={() => handleDelete(key.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Usage Note */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            <div>
              <p className="text-sm font-medium">API Usage</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Include your API key in the{" "}
                <code className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-xs">
                  x-api-key
                </code>{" "}
                header of your requests. Keep your keys secure and never share
                them publicly.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-md bg-[hsl(var(--muted))] px-4 py-3 font-mono text-xs">
{`curl -X POST https://extractvibe.com/api/extract \\
  -H "x-api-key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
