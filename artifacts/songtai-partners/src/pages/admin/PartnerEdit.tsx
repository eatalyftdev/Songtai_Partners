import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useListPartners, useUpdatePartner, useDeletePartner, getListPartnersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PartnerEdit() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: partners, isLoading } = useListPartners();
  const partner = partners?.find(p => p.id === id);
  
  const updatePartner = useUpdatePartner();
  const deletePartner = useDeletePartner();
  const queryClient = useQueryClient();

  const initializedForId = useRef<string | null>(null);
  const [formData, setFormData] = useState({
    whatsappNumber: "",
    contactEmail: "",
    heroTitleEn: "",
    heroTitleFr: "",
    heroSubtitleEn: "",
    heroSubtitleFr: ""
  });

  useEffect(() => {
    if (partner && initializedForId.current !== partner.id) {
      initializedForId.current = partner.id;
      setFormData({
        whatsappNumber: partner.whatsappNumber || "",
        contactEmail: partner.contactEmail || "",
        heroTitleEn: partner.heroTitleEn || "",
        heroTitleFr: partner.heroTitleFr || "",
        heroSubtitleEn: partner.heroSubtitleEn || "",
        heroSubtitleFr: partner.heroSubtitleFr || ""
      });
    }
  }, [partner]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    updatePartner.mutate({ id, data: formData }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Partner updated successfully." });
        queryClient.invalidateQueries({ queryKey: getListPartnersQueryKey() });
        setLocation("/admin/partners");
      },
      onError: (error: any) => {
        toast({ 
          title: "Error", 
          description: error.error || "Failed to update partner.", 
          variant: "destructive" 
        });
      }
    });
  };

  const handleDelete = () => {
    if (!id) return;
    if (confirm("Are you sure you want to suspend/delete this partner?")) {
      deletePartner.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Partner suspended." });
          queryClient.invalidateQueries({ queryKey: getListPartnersQueryKey() });
          setLocation("/admin/partners");
        },
        onError: (error: any) => {
          toast({ 
            title: "Error", 
            description: error.error || "Failed to delete partner.", 
            variant: "destructive" 
          });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!partner) {
    return (
      <AdminLayout>
        <div className="p-6 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          Partner not found.
        </div>
      </AdminLayout>
    );
  }

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
            <h1 className="text-3xl font-serif font-bold text-foreground">Edit Partner</h1>
            <p className="text-muted-foreground mt-1">/p/{partner.slug}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Partner Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input 
                    id="whatsappNumber" 
                    name="whatsappNumber" 
                    value={formData.whatsappNumber} 
                    onChange={handleChange} 
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroTitleFr">Hero Title (French)</Label>
                    <Input 
                      id="heroTitleFr" 
                      name="heroTitleFr" 
                      value={formData.heroTitleFr} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitleEn">Hero Subtitle (English)</Label>
                    <Input 
                      id="heroSubtitleEn" 
                      name="heroSubtitleEn" 
                      value={formData.heroSubtitleEn} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitleFr">Hero Subtitle (French)</Label>
                    <Input 
                      id="heroSubtitleFr" 
                      name="heroSubtitleFr" 
                      value={formData.heroSubtitleFr} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-between gap-3">
                <Button 
                  variant="destructive" 
                  type="button" 
                  onClick={handleDelete}
                  disabled={deletePartner.isPending}
                >
                  {deletePartner.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Delete/Suspend"}
                </Button>
                <div className="flex gap-3">
                  <Link href="/admin/partners">
                    <Button variant="outline" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={updatePartner.isPending}>
                    {updatePartner.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}
