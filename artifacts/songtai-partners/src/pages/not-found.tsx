import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { HeartPulse } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <HeartPulse className="h-16 w-16 text-muted-foreground/30 mb-6" />
      <h1 className="text-6xl font-serif font-bold text-foreground mb-4">404</h1>
      <p className="text-xl text-muted-foreground max-w-md mb-8">
        {t("The page you're looking for doesn't exist.", "La page que vous recherchez n'existe pas.")}
      </p>
      <Link href="/">
        <Button size="lg" className="rounded-full px-8">
          {t("Return Home", "Retour à l'accueil")}
        </Button>
      </Link>
    </div>
  );
}
