import { useState } from "react";
import {
  useListTestimonials,
  useCreateTestimonial,
  getListTestimonialsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Star, CheckCircle2, XCircle, User, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@workspace/object-storage-web";

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/objects/")) return `/api/storage${url}`;
  return url;
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `${res.status} ${res.statusText}`);
  }
  return res.status === 204 ? null : res.json();
}

type Testimonial = {
  id: string;
  authorName: string;
  authorRole?: string | null;
  contentEn: string;
  contentFr: string;
  rating: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
};

const EMPTY = {
  authorName: "",
  authorRole: "",
  contentEn: "",
  contentFr: "",
  rating: 5,
  imageUrl: null as string | null,
  isActive: true,
};

function TestimonialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const create = useCreateTestimonial();
  const [form, setForm] = useState(EMPTY);
  const [imgPreview, setImgPreview] = useState<string | null>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (r: { objectPath: string }) => {
      setForm((p) => ({ ...p, imageUrl: r.objectPath }));
      setImgPreview(`/api/storage${r.objectPath}`);
    },
    onError: (e: Error) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.authorName || !form.contentEn) return;
    create.mutate(
      {
        data: {
          authorName: form.authorName,
          authorRole: form.authorRole || undefined,
          contentEn: form.contentEn,
          contentFr: form.contentFr || form.contentEn,
          rating: Number(form.rating),
          imageUrl: form.imageUrl ?? undefined,
          isActive: form.isActive,
        },
      } as any,
      {
        onSuccess: () => {
          toast({ title: "Testimonial added" });
          queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
          onClose();
          setForm(EMPTY); setImgPreview(null);
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">New Testimonial</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* Author */}
          <div className="flex gap-4 items-start">
            <div className="w-16 h-16 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0 cursor-pointer"
              onClick={() => document.getElementById("t-img-upload")?.click()}>
              {imgPreview ? (
                <img src={imgPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-7 w-7 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Author Name *</Label>
                <Input value={form.authorName} onChange={set("authorName")} placeholder="Jane Doe" />
              </div>
              <div className="space-y-1">
                <Label>Role / Location</Label>
                <Input value={form.authorRole} onChange={set("authorRole")} placeholder="Distributor, Cameroon" />
              </div>
            </div>
          </div>
          <input id="t-img-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) await uploadFile(f); e.target.value = ""; }} />

          {/* Rating */}
          <div className="space-y-1">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button"
                  className={`h-8 w-8 flex items-center justify-center rounded ${n <= form.rating ? "text-yellow-500" : "text-muted-foreground/30"}`}
                  onClick={() => setForm((p) => ({ ...p, rating: n }))}>
                  <Star className="h-5 w-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Review (English) *</Label>
              <Textarea className="resize-none h-28" value={form.contentEn} onChange={set("contentEn")} placeholder="Their review in English…" />
            </div>
            <div className="space-y-1">
              <Label>Review (French)</Label>
              <Textarea className="resize-none h-28" value={form.contentFr} onChange={set("contentFr")} placeholder="Leur avis en français…" />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input id="t-active" type="checkbox" checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 accent-primary rounded" />
            <Label htmlFor="t-active" className="cursor-pointer">Show on partner sites</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.authorName || !form.contentEn || create.isPending || isUploading}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Testimonial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TestimonialsManage() {
  const { data: testimonials, isLoading } = useListTestimonials();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);

  const deleteT = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/testimonials/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Testimonial removed" });
      queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch(`/api/testimonials/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Testimonials</h1>
            <p className="text-muted-foreground mt-1">Customer reviews shown on partner sites.</p>
          </div>
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Testimonial
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !testimonials?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 text-center">
            <Star className="h-12 w-12 opacity-20" />
            <p>No testimonials yet. Add the first one to display social proof on partner sites.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(testimonials as Testimonial[]).map((t) => {
              const imgUrl = resolveImageUrl(t.imageUrl);
              return (
                <Card key={t.id} className={`border-border/60 ${!t.isActive ? "opacity-60" : ""}`}>
                  <CardContent className="p-5 space-y-3">
                    {/* Stars */}
                    <div className="flex gap-0.5 text-yellow-500">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} className={`h-4 w-4 ${n <= t.rating ? "fill-current" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>

                    {/* Review */}
                    <p className="text-sm text-foreground/80 italic line-clamp-3">"{t.contentEn}"</p>

                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
                        {imgUrl ? (
                          <img src={imgUrl} alt={t.authorName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">{t.authorName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.authorName}</p>
                        {t.authorRole && <p className="text-xs text-muted-foreground">{t.authorRole}</p>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                      <Badge variant={t.isActive ? "success" : "outline"} className="text-xs gap-1 flex-none">
                        {t.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {t.isActive ? "Visible" : "Hidden"}
                      </Badge>
                      <div className="flex-1" />
                      <Button variant="ghost" size="sm" className="h-7 text-xs"
                        disabled={toggleActive.isPending}
                        onClick={() => toggleActive.mutate({ id: t.id, isActive: !t.isActive })}>
                        {t.isActive ? "Hide" : "Show"}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm("Remove this testimonial?")) deleteT.mutate(t.id); }}
                        disabled={deleteT.isPending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <TestimonialModal open={addOpen} onClose={() => setAddOpen(false)} />
    </AdminLayout>
  );
}
