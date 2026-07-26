import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { HeartPulse, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function PartnerLayout({ children, partnerWhatsApp }: { children: React.ReactNode, partnerWhatsApp?: string | null }) {
  const { lang, setLang, t } = useI18n();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <HeartPulse className="h-6 w-6" />
            <span className="font-serif font-bold text-xl tracking-wide">Songtai Life</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#products" onClick={(e) => handleNavClick(e, 'products')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("Products", "Produits")}
            </a>
            <a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("About", "À Propos")}
            </a>
            <a href="#testimonials" onClick={(e) => handleNavClick(e, 'testimonials')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("Stories", "Témoignages")}
            </a>
            <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("FAQ", "FAQ")}
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase">{lang}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 border-t border-foreground/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <HeartPulse className="h-6 w-6 text-background/80" />
            <span className="font-serif font-bold text-xl tracking-wide text-background/90">Songtai Life</span>
          </div>
          <p className="text-background/60 text-sm max-w-md mx-auto mb-8">
            {t("Natural wellness and health products. Your journey to a better life starts here.", "Produits de bien-être et de santé naturels. Votre voyage vers une vie meilleure commence ici.")}
          </p>
          <div className="text-background/40 text-xs flex flex-col md:flex-row items-center justify-center gap-4">
            <span>© {new Date().getFullYear()} Songtai Life.</span>
            <Link href="/admin" className="hover:text-background/80 transition-colors">Partner Access</Link>
          </div>
        </div>
      </footer>

      {/* Sticky WhatsApp Button */}
      {partnerWhatsApp && (
        <a 
          href={`https://wa.me/${partnerWhatsApp.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label={t("Chat with me on WhatsApp", "Discuter avec moi sur WhatsApp")}
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.656-1.482-1.465-1.656-1.762-.173-.298-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap pl-0 group-hover:pl-3 font-medium text-sm">
            {t("Contact Me", "Contactez-moi")}
          </span>
        </a>
      )}
    </div>
  );
}
