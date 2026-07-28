import { useState } from "react";
import {
  useListProducts,
  useUpdateProduct,
  useCreateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  ImageOff,
  Video,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@workspace/object-storage-web";

// ── helpers ──────────────────────────────────────────────────────────────────

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/objects/")) return `/api/storage${url}`;
  return url;
}

type Product = {
  id: string;
  nameEn: string;
  nameFr: string;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  priceXaf: number;
  pvPoints: number;
  category?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
};

const EMPTY_FORM = {
  nameEn: "",
  nameFr: "",
  descriptionEn: "",
  descriptionFr: "",
  priceXaf: 0,
  pvPoints: 0,
  category: "",
  imageUrl: null as string | null,
  videoUrl: "",
  stock: 1000,
  isActive: true,
};

// ── ProductModal ──────────────────────────────────────────────────────────────

function ProductModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null; // null = create mode
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateProduct = useUpdateProduct();
  const createProduct = useCreateProduct();

  const [form, setForm] = useState(() =>
    product
      ? {
          nameEn: product.nameEn ?? "",
          nameFr: product.nameFr ?? "",
          descriptionEn: product.descriptionEn ?? "",
          descriptionFr: product.descriptionFr ?? "",
          priceXaf: product.priceXaf ?? 0,
          pvPoints: product.pvPoints ?? 0,
          category: product.category ?? "",
          imageUrl: product.imageUrl ?? null,
          videoUrl: product.videoUrl ?? "",
          stock: product.stock ?? 1000,
          isActive: product.isActive ?? true,
        }
      : { ...EMPTY_FORM }
  );

  const [imagePreview, setImagePreview] = useState<string | null>(() =>
    product ? resolveImageUrl(product.imageUrl) : null
  );

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

  const isPending = updateProduct.isPending || createProduct.isPending;

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    const data = {
      nameEn: form.nameEn,
      nameFr: form.nameFr,
      descriptionEn: form.descriptionEn || null,
      descriptionFr: form.descriptionFr || null,
      priceXaf: Number(form.priceXaf),
      pvPoints: Number(form.pvPoints),
      category: form.category || null,
      imageUrl: form.imageUrl || null,
      videoUrl: form.videoUrl || null,
      stock: Number(form.stock),
      isActive: form.isActive,
    };

    if (product) {
      updateProduct.mutate(
        { id: product.id, data },
        {
          onSuccess: () => {
            toast({ title: "Product updated" });
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            onClose();
          },
          onError: (e: any) =>
            toast({ title: "Error", description: e?.error ?? "Failed", variant: "destructive" }),
        }
      );
    } else {
      createProduct.mutate(
        data as any,
        {
          onSuccess: () => {
            toast({ title: "Product created" });
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            onClose();
          },
          onError: (e: any) =>
            toast({ title: "Error", description: e?.error ?? "Failed", variant: "destructive" }),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {product ? "Edit Product" : "New Product"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Image */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Product Image</Label>
            <div className="flex items-start gap-4">
              <div className="w-28 h-28 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-xs text-muted-foreground">
                  Upload a JPG, PNG or WebP image for this product.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => document.getElementById(`img-upload-${product?.id ?? "new"}`)?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? "Uploading…" : "Upload Image"}
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, imageUrl: null }));
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  )}
                </div>
                <input
                  id={`img-upload-${product?.id ?? "new"}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await uploadFile(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label htmlFor="videoUrl" className="text-sm font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              Video URL
            </Label>
            <Input
              id="videoUrl"
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              value={form.videoUrl}
              onChange={set("videoUrl")}
            />
            <p className="text-xs text-muted-foreground">
              Supports YouTube, Vimeo, or direct .mp4/.webm links.
            </p>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameEn">Name (English)</Label>
                <Input id="nameEn" value={form.nameEn} onChange={set("nameEn")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameFr">Name (French)</Label>
                <Input id="nameFr" value={form.nameFr} onChange={set("nameFr")} required />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descEn">Description (English)</Label>
                <Textarea
                  id="descEn"
                  className="resize-none h-24 text-sm"
                  value={form.descriptionEn}
                  onChange={set("descriptionEn")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descFr">Description (French)</Label>
                <Textarea
                  id="descFr"
                  className="resize-none h-24 text-sm"
                  value={form.descriptionFr}
                  onChange={set("descriptionFr")}
                />
              </div>
            </div>

            {/* Price / PV / Category / Stock */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceXaf">Price (FCFA)</Label>
                <Input id="priceXaf" type="number" min={0} value={form.priceXaf} onChange={set("priceXaf")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pvPoints">PV Points</Label>
                <Input id="pvPoints" type="number" min={0} value={form.pvPoints} onChange={set("pvPoints")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g. Nutrition" value={form.category} onChange={set("category")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" min={0} value={form.stock} onChange={set("stock")} />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active (visible on partner sites)</Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || isUploading || !form.nameEn}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {product ? "Save Changes" : "Create Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ProductsList() {
  const { data: products, isLoading } = useListProducts();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingProduct, setEditingProduct] = useState<Product | null | "new">(null);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteProduct.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Product deleted" });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        },
        onError: (e: any) =>
          toast({ title: "Error", description: e?.error ?? "Failed", variant: "destructive" }),
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground mt-1">
              Manage the product catalogue shown on every partner site.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setEditingProduct("new")}>
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !products?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-4">
            <Package className="h-12 w-12 opacity-20" />
            <p>No products yet. Click "New Product" to add the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => {
              const imgUrl = resolveImageUrl(product.imageUrl);
              return (
                <Card
                  key={product.id}
                  className="overflow-hidden border-border/60 hover:border-primary/30 transition-colors group"
                >
                  {/* Image area */}
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={product.nameEn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <ImageOff className="h-8 w-8 text-muted-foreground/30" />
                        <span className="text-xs text-muted-foreground/50">No image</span>
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                      {product.category && (
                        <Badge className="bg-background/85 backdrop-blur text-foreground border-none text-xs">
                          {product.category}
                        </Badge>
                      )}
                      {!product.isActive && (
                        <Badge variant="destructive" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    {product.videoUrl && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary/90 backdrop-blur text-primary-foreground border-none text-xs gap-1">
                          <Video className="h-3 w-3" /> Video
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-serif font-bold text-sm leading-snug line-clamp-2 mb-2">
                      {product.nameEn}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="font-semibold text-foreground">
                        {product.priceXaf.toLocaleString()} FCFA
                      </span>
                      <span>{product.pvPoints} PV</span>
                      <span className={product.stock > 0 ? "text-green-500" : "text-red-500"}>
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setEditingProduct(product as any)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(product.id, product.nameEn)}
                        disabled={deleteProduct.isPending}
                      >
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

      {/* Edit / Create modal */}
      <ProductModal
        open={editingProduct !== null}
        onClose={() => setEditingProduct(null)}
        product={editingProduct === "new" ? null : (editingProduct as Product | null)}
      />
    </AdminLayout>
  );
}
