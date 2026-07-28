import { useState } from "react";
import { useListGallery, useCreateGalleryImage, getListGalleryQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Upload, ImageOff, GripVertical, Edit } from "lucide-react";
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

type GalleryImage = {
  id: string;
  imageUrl: string;
  captionEn?: string | null;
  captionFr?: string | null;
  sortOrder: number;
  createdAt: string;
};

type UploadModalProps = {
  open: boolean;
  onClose: () => void;
};

function UploadModal({ open, onClose }: UploadModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createImage = useCreateGalleryImage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [captionEn, setCaptionEn] = useState("");
  const [captionFr, setCaptionFr] = useState("");

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response: { objectPath: string }) => {
      setImageUrl(response.objectPath);
      setImagePreview(`/api/storage${response.objectPath}`);
    },
    onError: (err: Error) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  const handleSave = () => {
    if (!imageUrl) return;
    createImage.mutate(
      { data: { imageUrl, captionEn: captionEn || undefined, captionFr: captionFr || undefined, sortOrder: 0 } } as any,
      {
        onSuccess: () => {
          toast({ title: "Image added to gallery" });
          queryClient.invalidateQueries({ queryKey: getListGalleryQueryKey() });
          onClose();
          setImageUrl(null); setImagePreview(null); setCaptionEn(""); setCaptionFr("");
        },
        onError: (e: any) => toast({ title: "Error", description: e?.message ?? "Failed", variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Add Gallery Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Image upload */}
          <div className="aspect-video rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
                <ImageOff className="h-10 w-10" />
                <span className="text-sm">No image selected</span>
              </div>
            )}
          </div>
          <Button type="button" variant="outline" className="w-full" disabled={isUploading}
            onClick={() => document.getElementById("gallery-upload")?.click()}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            {isUploading ? "Uploading…" : "Choose Image"}
          </Button>
          <input id="gallery-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) await uploadFile(f); e.target.value = ""; }} />

          {/* Captions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Caption (EN)</Label>
              <Input value={captionEn} onChange={(e) => setCaptionEn(e.target.value)} placeholder="Optional caption" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Caption (FR)</Label>
              <Input value={captionFr} onChange={(e) => setCaptionFr(e.target.value)} placeholder="Légende optionnelle" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!imageUrl || createImage.isPending || isUploading}>
            {createImage.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add to Gallery
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GalleryManage() {
  const { data: gallery, isLoading } = useListGallery();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);

  const deleteImage = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/gallery/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Image removed" });
      queryClient.invalidateQueries({ queryKey: getListGalleryQueryKey() });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateOrder = useMutation({
    mutationFn: ({ id, sortOrder }: { id: string; sortOrder: number }) =>
      apiFetch(`/api/gallery/${id}`, { method: "PATCH", body: JSON.stringify({ sortOrder }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getListGalleryQueryKey() }),
  });

  const sorted = [...(gallery ?? [])].sort((a: any, b: any) => a.sortOrder - b.sortOrder) as GalleryImage[];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Gallery</h1>
            <p className="text-muted-foreground mt-1">Manage the photo gallery shown on partner sites.</p>
          </div>
          <Button className="gap-2" onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" /> Add Image
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4 text-center">
            <ImageOff className="h-12 w-12 opacity-20" />
            <p>No gallery images yet. Click "Add Image" to upload the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map((img, index) => {
              const resolved = resolveImageUrl(img.imageUrl);
              return (
                <Card key={img.id} className="overflow-hidden border-border/60 group relative">
                  <div className="aspect-square bg-muted overflow-hidden">
                    {resolved ? (
                      <img src={resolved} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    {(img.captionEn || img.captionFr) && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {img.captionEn || img.captionFr}
                      </p>
                    )}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        disabled={index === 0 || updateOrder.isPending}
                        onClick={() => updateOrder.mutate({ id: img.id, sortOrder: img.sortOrder - 1 })}
                        title="Move up">
                        ↑
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        disabled={index === sorted.length - 1 || updateOrder.isPending}
                        onClick={() => updateOrder.mutate({ id: img.id, sortOrder: img.sortOrder + 1 })}
                        title="Move down">
                        ↓
                      </Button>
                      <div className="flex-1" />
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm("Remove this image?")) deleteImage.mutate(img.id); }}
                        disabled={deleteImage.isPending}>
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

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </AdminLayout>
  );
}
