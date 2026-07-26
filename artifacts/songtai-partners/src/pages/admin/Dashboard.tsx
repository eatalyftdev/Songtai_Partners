import { useGetPartnerStats, useHealthCheck } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Clock, Ban, Server } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading, isError } = useGetPartnerStats();
  const { data: health } = useHealthCheck();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your partner network.</p>
          </div>
          <Badge variant={health?.status === 'ok' ? 'success' : 'outline'} className="gap-2 px-3 py-1">
            <Server className="h-3 w-3" />
            API: {health?.status || 'checking...'}
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                  <div className="h-8 w-8 bg-muted rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted rounded mt-2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            Failed to load statistics.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Partners" 
              value={stats?.total || 0} 
              icon={Users} 
              colorClass="text-blue-500" 
            />
            <StatCard 
              title="Active" 
              value={stats?.active || 0} 
              icon={UserCheck} 
              colorClass="text-green-500" 
            />
            <StatCard 
              title="Pending" 
              value={stats?.pending || 0} 
              icon={Clock} 
              colorClass="text-amber-500" 
            />
            <StatCard 
              title="Suspended" 
              value={stats?.suspended || 0} 
              icon={Ban} 
              colorClass="text-red-500" 
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: any, colorClass: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-sans text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-sans">{value}</div>
      </CardContent>
    </Card>
  );
}
