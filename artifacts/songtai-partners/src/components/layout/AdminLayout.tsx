import { Link, useLocation } from "wouter";
import { Users, LayoutDashboard, LogOut, HeartPulse, Package, Images, MessageSquareQuote, HelpCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Force dark mode for admin
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: Users, label: "Partners", href: "/admin/partners" },
    { icon: Package, label: "Products", href: "/admin/products" },
    { icon: Images, label: "Gallery", href: "/admin/gallery" },
    { icon: MessageSquareQuote, label: "Testimonials", href: "/admin/testimonials" },
    { icon: HelpCircle, label: "FAQ", href: "/admin/faq" },
    { icon: BookOpen, label: "About", href: "/admin/about" },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2 text-sidebar-foreground hover:opacity-80 transition-opacity">
            <HeartPulse className="h-6 w-6 text-sidebar-primary" />
            <span className="font-serif font-bold text-lg tracking-wide">Songtai Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <Link 
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="h-16 flex items-center px-8 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-sm font-medium text-muted-foreground">Admin Portal</h1>
        </div>
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
