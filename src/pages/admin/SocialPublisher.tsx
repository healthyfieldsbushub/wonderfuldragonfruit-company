import { useState } from "react";
import { AlertCircle, CheckCircle2, Facebook, Instagram, Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { appClient } from "@/integrations/manus/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FACEBOOK_PAGES, whatsappLink } from "@/config/social";

type ProviderStatus = {
  ok: boolean;
  error?: string;
  account?: { id?: string; name?: string; username?: string };
};

type SocialStatus = {
  configured: boolean;
  facebook: ProviderStatus;
  instagram: ProviderStatus;
};

function publicUrl(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("/")) return new URL(trimmed, window.location.origin).toString();
  return trimmed;
}

export default function SocialPublisher() {
  const [facebookMessage, setFacebookMessage] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [facebookImage, setFacebookImage] = useState("");
  const [instagramCaption, setInstagramCaption] = useState("");
  const [instagramImage, setInstagramImage] = useState("");
  const [instagramAltText, setInstagramAltText] = useState("");
  const [status, setStatus] = useState<SocialStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [publishing, setPublishing] = useState<"facebook" | "instagram" | null>(null);

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await appClient.functions.invoke<SocialStatus>("social-status");
      if (response.error) throw new Error(response.error.message);
      setStatus(response.data);
      toast.success("Meta connection status refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not check Meta connection");
    } finally {
      setCheckingStatus(false);
    }
  };

  const publishFacebook = async () => {
    if (!facebookMessage.trim() && !facebookLink.trim() && !facebookImage.trim()) {
      toast.error("Add a message, link, or image first");
      return;
    }
    setPublishing("facebook");
    try {
      const response = await appClient.functions.invoke<{ postId?: string }>("facebook-publish", {
        body: {
          message: facebookMessage,
          link: facebookLink ? publicUrl(facebookLink) : undefined,
          imageUrl: facebookImage ? publicUrl(facebookImage) : undefined,
        },
      });
      if (response.error) throw new Error(response.error.message);
      setFacebookMessage("");
      setFacebookLink("");
      setFacebookImage("");
      toast.success(`Facebook post published${response.data?.postId ? ` (${response.data.postId})` : ""}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Facebook publishing failed");
    } finally {
      setPublishing(null);
    }
  };

  const publishInstagram = async () => {
    if (!instagramImage.trim()) {
      toast.error("Instagram requires a public JPEG image URL");
      return;
    }
    setPublishing("instagram");
    try {
      const response = await appClient.functions.invoke<{ mediaId?: string }>("instagram-publish", {
        body: {
          caption: instagramCaption,
          imageUrl: publicUrl(instagramImage),
          altText: instagramAltText,
        },
      });
      if (response.error) throw new Error(response.error.message);
      setInstagramCaption("");
      setInstagramImage("");
      setInstagramAltText("");
      toast.success(`Instagram post published${response.data?.mediaId ? ` (${response.data.mediaId})` : ""}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Instagram publishing failed");
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Social Publisher</h1>
        <p className="text-muted-foreground">Publish approved content to the Wonderful Dragon Fruit South Africa Facebook Page and Instagram Business account.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Meta connection</CardTitle>
            <CardDescription>Credentials stay server-side in Manus Admin. No token is sent to the browser.</CardDescription>
          </div>
          <Button variant="outline" onClick={checkStatus} disabled={checkingStatus}>
            {checkingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Check connection
          </Button>
        </CardHeader>
        <CardContent>
          {!status ? (
            <p className="text-sm text-muted-foreground">Run a connection check before publishing to confirm the Page and Instagram account are reachable.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {[{ label: "Facebook Page", value: status.facebook }, { label: "Instagram Business", value: status.instagram }].map((item) => (
                <div key={item.label} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 font-medium">
                    {item.value.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
                    {item.label}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.value.ok ? (item.value.account?.username || item.value.account?.name || item.value.account?.id || "Connected") : item.value.error}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="facebook" className="space-y-4">
        <TabsList>
          <TabsTrigger value="facebook"><Facebook className="mr-2 h-4 w-4" />Facebook Page</TabsTrigger>
          <TabsTrigger value="instagram"><Instagram className="mr-2 h-4 w-4" />Instagram</TabsTrigger>
          <TabsTrigger value="pages-network">Pages Network</TabsTrigger>
        </TabsList>

        <TabsContent value="facebook">
          <Card>
            <CardHeader>
              <CardTitle>Publish to Facebook</CardTitle>
              <CardDescription>Publish text, a link preview, or a public image to the configured Facebook Page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook-message">Message</Label>
                <Textarea id="facebook-message" value={facebookMessage} onChange={(event) => setFacebookMessage(event.target.value)} placeholder="Share a farm update, product announcement, or helpful growing tip…" rows={5} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="facebook-link">Link (optional)</Label>
                  <Input id="facebook-link" type="url" value={facebookLink} onChange={(event) => setFacebookLink(event.target.value)} placeholder="https://www.wonderfuldragonfruit.company/products" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook-image">Image URL (optional)</Label>
                  <Input id="facebook-image" type="url" value={facebookImage} onChange={(event) => setFacebookImage(event.target.value)} placeholder="https://… or /manus-storage/product-images/…" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Use a public HTTPS image URL when adding an image. A Manus Storage path beginning with <code>/manus-storage/</code> is converted to the current site origin.</p>
              <Button onClick={publishFacebook} disabled={publishing !== null}>
                {publishing === "facebook" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publish to Facebook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instagram">
          <Card>
            <CardHeader>
              <CardTitle>Publish to Instagram</CardTitle>
              <CardDescription>Publish a single-image post to the configured Instagram professional account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagram-image">Public JPEG image URL</Label>
                <Input id="instagram-image" type="url" value={instagramImage} onChange={(event) => setInstagramImage(event.target.value)} placeholder="https://… or /manus-storage/product-images/…jpg" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram-caption">Caption (optional)</Label>
                <Textarea id="instagram-caption" value={instagramCaption} onChange={(event) => setInstagramCaption(event.target.value)} placeholder="Write a clear caption with relevant hashtags…" rows={5} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram-alt-text">Alt text (optional)</Label>
                <Input id="instagram-alt-text" value={instagramAltText} onChange={(event) => setInstagramAltText(event.target.value)} placeholder="Describe the image for accessibility" />
              </div>
              <p className="text-xs text-muted-foreground">Instagram’s Content Publishing API requires a publicly reachable JPEG. The server creates the media container and publishes it without exposing the access token.</p>
              <Button onClick={publishInstagram} disabled={publishing !== null || !instagramImage.trim()}>
                {publishing === "instagram" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publish to Instagram
              </Button>
            </CardContent>
          </Card>
      </TabsContent>
      <TabsContent value="pages-network">
        <Card>
          <CardHeader>
            <CardTitle>Facebook Pages Network</CardTitle>
            <CardDescription>Quick access to every DFSA / ProAgriSA Facebook page for posting products, catalogues and farm updates. Copy a link to share, or use WhatsApp for direct customer contact.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border divide-y">
              {FACEBOOK_PAGES.map((page) => (
                <div key={page.url} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{page.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{page.username}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Open
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(page.url);
                        toast.success("Page link copied");
                      }}
                    >
                      Copy link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(whatsappLink("Hi! Check out our latest dragon fruit products and catalogues: https://www.wonderfuldragonfruit.company/products"), "_blank")}
              >
                Share Products on WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(whatsappLink("Hi! Here is our full dragon fruit catalogue: https://www.wonderfuldragonfruit.company/products"), "_blank")}
              >
                Share Catalogue on WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(window.location.origin + "/products"), "_blank")}
              >
                Share Products on Facebook
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </div>
  );
}
