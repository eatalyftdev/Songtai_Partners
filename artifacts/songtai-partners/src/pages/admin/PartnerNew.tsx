import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreatePartner, getListPartnersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PartnerNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createPartner = useCreatePartner();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    slug: "",
    whatsappNumber: "",
    contactEmail: "",
    pendingContactName: "",
    pendingContactPhone: "",
    heroTitleEn: "",
    heroTitleFr: "",
    heroSubtitleEn: "",
    heroSubtitleFr: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug.trim()) {
      toast({ title: "Validation Error", description: "Slug is required.", variant: "destructive" });
      return;
    }

    createPartner.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Partner created successfully." });
        queryClient.invalidateQueries({ queryKey: getListPartnersQueryKey() });
        setLocation("/admin/partners");
      },
      onError: (error: any) => {
        toast({ 
          title: "Error", 
          description: error.error || "Failed to create partner.", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/admin/partners">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">New Partner</h1>
            <p className="text-muted-foreground mt-1">Create a new partner site instance.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Partner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug <span className="text-destructive">*</span></Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      /p/
                    </span>
                    <Input 
                      id="slug" 
                      name="slug" 
                      value={formData.slug} 
                      onChange={handleChange} 
                      placeholder="jean-paul"
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used in the URL: songtai.life/p/slug</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input 
                    id="whatsappNumber" 
                    name="whatsappNumber" 
                    value={formData.whatsappNumber} 
                    onChange={handleChange} 
                    placeholder="+237 600 000 000"
                  />
                  <p className="text-xs text-muted-foreground">For the sticky contact button</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pendingContactName">Contact Name</Label>
                  <Input 
                    id="pendingContactName" 
                    name="pendingContactName" 
                    value={formData.pendingContactName} 
                    onChange={handleChange} 
                    placeholder="Jean Paul"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input 
                    id="contactEmail" 
                    type="email"
                    name="contactEmail" 
                    value={formData.contactEmail} 
                    onChange={handleChange} 
                    placeholder="jean@example.com"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-medium mb-4">Custom Hero Content (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="heroTitleEn">Hero Title (English)</Label>
                    <Input 
                      id="heroTitleEn" 
                      name="heroTitleEn" 
                      value={formData.heroTitleEn} 
                      onChange={handleChange} 
                      placeholder="Welcome to my Wellness Store"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroTitleFr">Hero Title (French)</Label>
                    <Input 
                      id="heroTitleFr" 
                      name="heroTitleFr" 
                      value={formData.heroTitleFr} 
                      onChange={handleChange} 
                      placeholder="Bienvenue dans ma boutique de bien-être"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitleEn">Hero Subtitle (English)</Label>
                    <Input 
                      id="heroSubtitleEn" 
                      name="heroSubtitleEn" 
                      value={formData.heroSubtitleEn} 
                      onChange={handleChange} 
                      placeholder="Natural solutions for everyday life."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitleFr">Hero Subtitle (French)</Label>
                    <Input 
                      id="heroSubtitleFr" 
                      name="heroSubtitleFr" 
                      value={formData.heroSubtitleFr} 
                      onChange={handleChange} 
                      placeholder="Solutions naturelles pour la vie quotidienne."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <Link href="/admin/partners">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={createPartner.isPending}>
                  {createPartner.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Partner
                </Button>
              </div>

            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}
