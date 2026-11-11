import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Facebook, Loader2, MessageSquare, Plus, RefreshCw, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FacebookPage = {
  page_id: string;
  name: string;
  is_primary: number | boolean;
  subscribed: number | boolean;
  updated_at?: string;
};

type FacebookComment = {
  comment_id: string;
  post_id: string | null;
  author_name: string | null;
  content: string | null;
  reply_content: string | null;
  status: string;
  created_at: string;
};

type MetaStatus = {
  facebookPageId: boolean;
  instagramId: boolean;
  graphToken: boolean;
  appSecret: boolean;
  whatsappDirect: boolean;
  whatsappBridgeFallback: boolean;
  webhookVerifyToken: boolean;
  whatsappWebhook: string;
  facebookWebhook: string;
};

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (payload as { error?: { message?: string } }).error?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return (payload as { data?: T }).data as T;
}

export default function FacebookPages() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [comments, setComments] = useState<FacebookComment[]>([]);
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [form, setForm] = useState({ name: "", pageId: "", accessToken: "", isPrimary: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pageList, commentList, metaStatus] = await Promise.all([
        adminFetch<FacebookPage[]>("/api/admin/facebook/pages"),
        adminFetch<FacebookComment[]>("/api/admin/facebook/comments?limit=50"),
        adminFetch<MetaStatus>("/api/admin/meta/status"),
      ]);
      setPages(pageList || []);
      setComments(commentList || []);
      setStatus(metaStatus);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Facebook settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addPage = async () => {
    if (!form.pageId.trim() || !form.name.trim() || !form.accessToken.trim()) {
      toast.error("Page name, Page ID and Page access token are all required");
      return;
    }
    setSaving(true);
    try {
      const result = await adminFetch<{ verified: boolean; verifyError?: string }>("/api/admin/facebook/pages", {
        method: "POST",
        body: JSON.stringify({
          pageId: form.pageId.trim(),
          name: form.name.trim(),
          accessToken: form.accessToken.trim(),
          isPrimary: form.isPrimary,
        }),
      });
      if (result?.verified) toast.success(`${form.name.trim()} connected and verified with Meta`);
      else toast.warning(`Saved, but Meta rejected the token: ${result?.verifyError || "unknown reason"}`);
      setForm({ name: "", pageId: "", accessToken: "", isPrimary: false });
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not connect the page");
    } finally {
      setSaving(false);
    }
  };

  const removePage = async (page: FacebookPage) => {
    try {
      await adminFetch("/api/admin/facebook/pages?pageId=" + encodeURIComponent(page.page_id), { method: "DELETE" });
      toast.success(`${page.name} disconnected`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not disconnect the page");
    }
  };

  const sendReply = async (commentId: string) => {
    if (!replyText.trim()) { toast.error("Write a reply first"); return; }
    setReplying(true);
    try {
      await adminFetch("/api/admin/facebook/comments/reply", {
        method: "POST",
        body: JSON.stringify({ commentId, message: replyText.trim() }),
      });
      toast.success("Reply posted to Facebook");
      setReplyTo(null);
      setReplyText("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reply failed");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Facebook className="h-6 w-6 text-[#1877F2]" /> Facebook Pages
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect every Page this website manages. Messages and comments are read and answered per Page, and posts can be published to any connected Page.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection status</CardTitle>
          <CardDescription>What the website can currently do with Meta.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          {status ? (
            [
              ["Graph API token", status.graphToken],
              ["Facebook Page ID", status.facebookPageId],
              ["App secret (webhook signing)", status.appSecret],
              ["Webhook verify token", status.webhookVerifyToken],
              ["WhatsApp direct sending", status.whatsappDirect],
              ["Cloudflare bridge fallback", status.whatsappBridgeFallback],
            ].map(([label, ok]) => (
              <div key={String(label)} className="flex items-center gap-2">
                {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                <span>{String(label)}</span>
                <span className={ok ? "text-emerald-600" : "text-amber-600"}>{ok ? "configured" : "missing"}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Loading…</p>
          )}
          {status && (
            <div className="sm:col-span-2 rounded-md bg-muted p-3 font-mono text-xs">
              <div>Facebook webhook: {status.facebookWebhook}</div>
              <div>WhatsApp webhook: {status.whatsappWebhook}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connect a Page</CardTitle>
          <CardDescription>
            Page ID comes from the Page's About section. The Page access token must be a Page token with messaging and content permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fb-page-name">Page name</Label>
            <Input id="fb-page-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Proagrisa DFSA Members Network" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-page-id">Page ID</Label>
            <Input id="fb-page-id" value={form.pageId} onChange={(e) => setForm({ ...form, pageId: e.target.value })} placeholder="1083158868214684" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fb-page-token">Page access token</Label>
            <Textarea id="fb-page-token" value={form.accessToken} onChange={(e) => setForm({ ...form, accessToken: e.target.value })} placeholder="EAA…" rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} />
            Make this the primary Page (used when no Page is chosen for a post)
          </label>
          <div className="md:col-span-2">
            <Button onClick={() => void addPage()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Connect Page
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected Pages ({pages.length})</CardTitle>
          <CardDescription>Every Page listed here receives and answers its own messages and comments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pages.length === 0 && !loading && <p className="text-sm text-muted-foreground">No Pages connected yet.</p>}
          {pages.map((page) => (
            <div key={page.page_id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <div className="flex items-center gap-2 font-medium">
                  {page.name}
                  {Boolean(page.is_primary) && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      <Star className="h-3 w-3" /> Primary
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-muted-foreground">Page ID {page.page_id}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => void removePage(page)}>
                <Trash2 className="mr-2 h-4 w-4" /> Disconnect
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5" /> Page comments ({comments.length})
          </CardTitle>
          <CardDescription>Comments on your Page posts, with the automatic reply the website posted.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {comments.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">
              No comments received yet. They appear here as soon as a Page is subscribed to the webhook and someone comments on a post.
            </p>
          )}
          {comments.map((comment) => (
            <div key={comment.comment_id} className="space-y-2 rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{comment.author_name || "Unknown"}</span>
                <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm">{comment.content}</p>
              {comment.reply_content && (
                <p className="rounded bg-muted p-2 text-sm">
                  <span className="font-medium">Website reply: </span>
                  {comment.reply_content}
                </p>
              )}
              {comment.status === "reply_failed" && (
                <p className="text-xs text-amber-600">Automatic reply failed — answer manually below.</p>
              )}
              {replyTo === comment.comment_id ? (
                <div className="space-y-2">
                  <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} placeholder="Write your reply…" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void sendReply(comment.comment_id)} disabled={replying}>
                      {replying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post reply
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setReplyTo(null); setReplyText(""); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { setReplyTo(comment.comment_id); setReplyText(comment.reply_content || ""); }}>
                  Reply
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
