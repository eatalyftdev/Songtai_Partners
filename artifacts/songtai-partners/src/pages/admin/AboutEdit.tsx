import { useState, useEffect } from "react";
import {
  useGetAbout,
  useUpdateAbout,
  getGetAboutQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Upload, X, ImageOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@workspace/object-storage-web";

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/objects/")) return `/api/storage${url}`;
  return url;
}

const DEFAULT_FORM = {
  storyEn: "",
  storyFr: "",
  missionEn: "",
  missionFr: "",
  visionEn: "",
  visionFr: "",
  imageUrl: null as string | null,
};

export default function AboutEdit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: about, isLoading } = useGetAbout();
  const updateAbout = useUpdateAbout();
  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (about && !initialized) {
      setInitialized(true);
      setForm({
        storyEn: about.storyEn ?? "",
        storyFr: about.storyFr ?? "",
        missionEn: about.missionEn ?? "",
        missionFr: about.missionFr ?? "",
        visionEn: about.visionEn ?? "",
        visionFr: about.visionFr ?? "",
        imageUrl: about.imageUrl ?? null,
      });
      setImagePreview(resolveImageUrl(about.imageUrl));
    }
  }, [about, initialized]);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response: { objectPath: string }) => {
      setForm((prev) => ({ ...prev, imageUrl: response.objectPath }));
      setImagePreview(`/api/storage${response.objectPath}`);
      toast({ title: "Image uploaded", description: "Save to apply." });
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAbout.mutate(
      { data: { ...form, imageUrl: form.imageUrl ?? undefined } },
      {
        onSuccess: () => {
          toast({ title: "About content saved." });
          queryClient.invalidateQueries({ queryKey: getGetAboutQueryKey() });
        },
        onError: (err: any) =>
          toast({ title: "Error", description: err?.error ?? "Failed to save", variant: "destructive" }),
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">About Content</h1>
          <p className="text-muted-foreground mt-1">
            Manage the "Our Story" section shown on all partner sites.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About Image <span className="text-muted-foreground font-normal text-sm">(optional)</span></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <div className="w-32 h-32 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="About" className="w-full h-full object-cover" />
                    ) : (
                      <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Displayed alongside the brand story. Supports JPG, PNG, WebP.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() => document.getElementById("about-img-upload")?.click()}
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        {isUploading ? "Uploading…" : "Upload Image"}
                      </Button>
                      {imagePreview && (
                        <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                          onClick={() => { setForm((p) => ({ ...p, imageUrl: null })); setImagePreview(null); }}>
                          <X className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    <input id="about-img-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={async (e) => { const f = e.target.files?.[0]; if (f) await uploadFile(f); e.target.value = ""; }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Brand Story</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Story (English)</Label>
                    <Textarea className="resize-none h-32" value={form.storyEn} onChange={set("storyEn")} placeholder="Tell your brand story in English…" />
                  </div>
                  <div className="space-y-2">
                    <Label>Story (French)</Label>
                    <Textarea className="resize-none h-32" value={form.storyFr} onChange={set("storyFr")} placeholder="Racontez votre histoire en français…" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mission */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Mission</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mission (English)</Label>
                    <Textarea className="resize-none h-24" value={form.missionEn} onChange={set("missionEn")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mission (French)</Label>
                    <Textarea className="resize-none h-24" value={form.missionFr} onChange={set("missionFr")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Vision</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vision (English)</Label>
                    <Textarea className="resize-none h-24" value={form.visionEn} onChange={set("visionEn")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Vision (French)</Label>
                    <Textarea className="resize-none h-24" value={form.visionFr} onChange={set("visionFr")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateAbout.isPending || isUploading} className="gap-2">
                {updateAbout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save About Content
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
