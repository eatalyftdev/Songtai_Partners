import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { HeartPulse, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <HeartPulse className="h-6 w-6" />
            <span className="font-serif font-bold text-xl tracking-wide">Songtai Life</span>
          </Link>
          <Link href="/admin">
            <Button variant="ghost" className="text-sm font-medium">Partner Login</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent shadow-none">
            {t("Wellness Partners Network", "Réseau de Partenaires Bien-être")}
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-[1.1]">
            Find your trusted <br/>
            <span className="text-primary italic">wellness expert.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t(
              "Songtai Life products are distributed through a network of passionate wellness advocates. Connect with a partner to start your journey.",
              "Les produits Songtai Life sont distribués par un réseau de passionnés du bien-être. Connectez-vous à un partenaire pour commencer votre voyage."
            )}
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/p/demo">
              <Button size="lg" className="rounded-full px-8 text-base h-14 w-full sm:w-auto shadow-lg shadow-primary/20">
                {t("Visit Demo Partner Site", "Visiter le Site Démo")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-14 w-full sm:w-auto bg-background">
                {t("Partner Dashboard", "Tableau de Bord Partenaire")}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// Minimal Badge for Home
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${className || ''}`}>
      {children}
    </span>
  );
}
