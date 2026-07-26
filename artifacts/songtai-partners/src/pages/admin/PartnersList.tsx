import { Link } from "wouter";
import { useListPartners, useUpdatePartnerStatus, getListPartnersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

export default function PartnersList() {
  const { data: partners, isLoading } = useListPartners();
  const updateStatus = useUpdatePartnerStatus();
  const queryClient = useQueryClient();

  const handleStatusChange = (id: string, status: 'active' | 'suspended' | 'pending') => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPartnersQueryKey() });
        }
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Partners</h1>
            <p className="text-muted-foreground mt-1">Manage your wellness distributor network.</p>
          </div>
          <Link href="/admin/partners/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Partner
            </Button>
          </Link>
        </div>

        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Slug</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Loading partners...
                  </TableCell>
                </TableRow>
              ) : partners?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No partners found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                partners?.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">
                      <Link href={`/p/${partner.slug}`} target="_blank" className="hover:underline text-primary">
                        /p/{partner.slug}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{partner.pendingContactName || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">{partner.whatsappNumber || partner.pendingContactPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={partner.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(partner.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/partners/${partner.id}`}>
                          <Button variant="ghost" size="icon" title="Edit Partner">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {partner.status !== 'active' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                            onClick={() => handleStatusChange(partner.id, 'active')}
                            title="Activate"
                            disabled={updateStatus.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        {partner.status === 'active' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                            onClick={() => handleStatusChange(partner.id, 'suspended')}
                            title="Suspend"
                            disabled={updateStatus.isPending}
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
    case 'pending':
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
    case 'suspended':
      return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> Suspended</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
