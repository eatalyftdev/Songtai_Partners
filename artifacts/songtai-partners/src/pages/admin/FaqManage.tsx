import { useState } from "react";
import { useListFaq, useCreateFaqItem, getListFaqQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, ChevronDown, HelpCircle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

type FaqItem = {
  id: string;
  questionEn: string;
  questionFr: string;
  answerEn: string;
  answerFr: string;
  category?: string | null;
  sortOrder: number;
  createdAt: string;
};

const EMPTY = {
  questionEn: "",
  questionFr: "",
  answerEn: "",
  answerFr: "",
  category: "",
  sortOrder: 0,
};

function FaqModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: FaqItem | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const create = useCreateFaqItem();
  const [form, setForm] = useState(() =>
    item
      ? { questionEn: item.questionEn, questionFr: item.questionFr, answerEn: item.answerEn, answerFr: item.answerFr, category: item.category ?? "", sortOrder: item.sortOrder }
      : { ...EMPTY }
  );

  const updateMutation = useMutation({
    mutationFn: (data: Partial<typeof form>) => apiFetch(`/api/faq/${item!.id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast({ title: "FAQ item updated" });
      queryClient.invalidateQueries({ queryKey: getListFaqQueryKey() });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    const data = { ...form, category: form.category || undefined, sortOrder: Number(form.sortOrder) };
    if (item) {
      updateMutation.mutate(data);
    } else {
      create.mutate({ data } as any, {
        onSuccess: () => {
          toast({ title: "FAQ item added" });
          queryClient.invalidateQueries({ queryKey: getListFaqQueryKey() });
          onClose();
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      });
    }
  };

  const isPending = create.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{item ? "Edit FAQ Item" : "New FAQ Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Question (English) *</Label>
              <Input value={form.questionEn} onChange={set("questionEn")} placeholder="What is Songtai Life?" />
            </div>
            <div className="space-y-2">
              <Label>Question (French) *</Label>
              <Input value={form.questionFr} onChange={set("questionFr")} placeholder="Qu'est-ce que Songtai Life ?" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Answer (English) *</Label>
              <Textarea className="resize-none h-28" value={form.answerEn} onChange={set("answerEn")} placeholder="Your answer in English…" />
            </div>
            <div className="space-y-2">
              <Label>Answer (French) *</Label>
              <Textarea className="resize-none h-28" value={form.answerFr} onChange={set("answerFr")} placeholder="Votre réponse en français…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={form.category} onChange={set("category")} placeholder="e.g. Orders, Products" />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={set("sortOrder")} min={0} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending || !form.questionEn || !form.answerEn}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {item ? "Save Changes" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FaqManage() {
  const { data: faq, isLoading } = useListFaq();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [modalItem, setModalItem] = useState<FaqItem | null | "new">(null);

  const deleteItem = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/faq/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "FAQ item removed" });
      queryClient.invalidateQueries({ queryKey: getListFaqQueryKey() });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sorted = [...(faq ?? [])].sort((a: any, b: any) => a.sortOrder - b.sortOrder) as FaqItem[];

  // Group by category
  const categories = [...new Set(sorted.map((i) => i.category ?? "General"))];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">FAQ</h1>
            <p className="text-muted-foreground mt-1">Frequently asked questions shown on partner sites.</p>
          </div>
          <Button className="gap-2" onClick={() => setModalItem("new")}>
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 text-center">
            <HelpCircle className="h-12 w-12 opacity-20" />
            <p>No FAQ items yet. Add common questions to help customers on partner sites.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat) => {
              const items = sorted.filter((i) => (i.category ?? "General") === cat);
              return (
                <div key={cat}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{cat}</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <Card key={item.id} className="border-border/60">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm mb-1">{item.questionEn}</p>
                              {item.questionFr !== item.questionEn && (
                                <p className="text-xs text-muted-foreground mb-2 italic">{item.questionFr}</p>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2">{item.answerEn}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => setModalItem(item)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => { if (confirm("Delete this FAQ item?")) deleteItem.mutate(item.id); }}
                                disabled={deleteItem.isPending}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FaqModal
        open={modalItem !== null}
        onClose={() => setModalItem(null)}
        item={modalItem === "new" ? null : (modalItem as FaqItem | null)}
      />
    </AdminLayout>
  );
}
