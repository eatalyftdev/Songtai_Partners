import { useParams } from "wouter";
import { useRef, useState, useEffect } from "react";
import {
  useGetPartnerBySlug,
  getGetPartnerBySlugQueryKey,
  useListProducts,
  useListTestimonials,
  useListGallery,
  useListFaq,
  useGetAbout,
} from "@workspace/api-client-react";
import { PartnerLayout } from "@/components/layout/PartnerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import {
  Loader2, ArrowRight, Star, ChevronDown, CheckCircle2, PlayCircle, User,
  Leaf, Shield, Zap, TrendingUp, Users, Globe, Award, Sparkles,
  Clock, MessageCircle, Heart, Package
} from "lucide-react";
import { motion, useInView, useAnimation, AnimatePresence } from "framer-motion";

// ── Animation helpers ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] } }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({ opacity: 1, transition: { duration: 0.5, delay } }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ── Animated counter ───────────────────────────────────────────────────────

function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = to / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, to]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Video URL helpers ──────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

function VideoEmbed({ url, title }: { url: string; title: string }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <iframe className="w-full aspect-video rounded-xl" src={`https://www.youtube.com/embed/${ytId}`}
        title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    );
  }
  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return (
      <iframe className="w-full aspect-video rounded-xl" src={`https://player.vimeo.com/video/${vimeoId}`}
        title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
    );
  }
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return <video className="w-full aspect-video rounded-xl bg-black" src={url} controls title={title} />;
  }
  return <iframe className="w-full aspect-video rounded-xl" src={url} title={title} allowFullScreen />;
}

// ── Image URL helper ───────────────────────────────────────────────────────

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/objects/")) return `/api/storage${url}`;
  return url;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PartnerSite() {
  const { slug } = useParams();
  const { t } = useI18n();

  const { data: partner, isLoading: partnerLoading, isError } = useGetPartnerBySlug(slug || "", {
    query: { queryKey: getGetPartnerBySlugQueryKey(slug || ""), retry: false, enabled: !!slug },
  });
  const { data: products } = useListProducts();
  const { data: testimonials } = useListTestimonials();
  const { data: gallery } = useListGallery();
  const { data: faq } = useListFaq();
  const { data: about } = useGetAbout();

  if (partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !partner || partner.status !== "active") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-4xl font-serif text-foreground mb-4">
          {t("Page Not Available", "Page Non Disponible")}
        </h1>
        <p className="text-muted-foreground max-w-md">
          {t(
            "This partner page is not currently available. Please check the URL or contact your distributor.",
            "Cette page partenaire n'est pas disponible actuellement. Veuillez vérifier l'URL ou contacter votre distributeur."
          )}
        </p>
      </div>
    );
  }

  const defaultHeroTitleEn = "Welcome to my Songtai Life boutique";
  const defaultHeroTitleFr = "Bienvenue dans ma boutique Songtai Life";
  const defaultHeroSubEn = "Discover natural wellness products trusted by thousands for a healthier, more vibrant life.";
  const defaultHeroSubFr = "Découvrez des produits de bien-être naturels approuvés par des milliers de personnes pour une vie plus saine et plus vibrante.";

  const heroTitle = t(partner.heroTitleEn || defaultHeroTitleEn, partner.heroTitleFr || defaultHeroTitleFr);
  const heroSub = t(partner.heroSubtitleEn || defaultHeroSubEn, partner.heroSubtitleFr || defaultHeroSubFr);

  const activeProducts = products?.filter((p) => p.isActive) ?? [];
  const productsWithVideo = activeProducts.filter((p) => p.videoUrl);
  const videoCategories = [...new Set(productsWithVideo.map((p) => p.category))].filter(Boolean) as string[];
  const profileImageUrl = resolveImageUrl(partner.profileImageUrl);
  const waBase = `https://wa.me/${partner.whatsappNumber?.replace(/[^0-9]/g, "")}`;

  // ── Section: stats ───────────────────────────────────────────────────────
  const stats = [
    { icon: Users, value: 500, suffix: "+", labelEn: "Active Partners", labelFr: "Partenaires Actifs" },
    { icon: Heart, value: 15000, suffix: "+", labelEn: "Happy Customers", labelFr: "Clients Satisfaits" },
    { icon: Globe, value: 10, suffix: "+", labelEn: "Countries Served", labelFr: "Pays Desservis" },
    { icon: Award, value: 100, suffix: "%", labelEn: "Natural Ingredients", labelFr: "Ingrédients Naturels" },
  ];

  // ── Section: why choose ──────────────────────────────────────────────────
  const pillars = [
    {
      icon: Leaf,
      titleEn: "100% Natural",
      titleFr: "100% Naturel",
      descEn: "Formulated from premium plant-based ingredients, free from harmful additives and synthetic compounds.",
      descFr: "Formulé à partir d'ingrédients végétaux de qualité supérieure, sans additifs ni composés synthétiques.",
    },
    {
      icon: Shield,
      titleEn: "Clinically Tested",
      titleFr: "Testé Cliniquement",
      descEn: "Each product is rigorously tested to ensure safety, efficacy, and quality you can trust.",
      descFr: "Chaque produit est rigoureusement testé pour garantir sécurité, efficacité et qualité.",
    },
    {
      icon: Zap,
      titleEn: "Fast Results",
      titleFr: "Résultats Rapides",
      descEn: "Feel the difference within weeks. Our customers report visible improvements in energy and vitality.",
      descFr: "Ressentez la différence en quelques semaines. Améliorations visibles de l'énergie et de la vitalité.",
    },
    {
      icon: Clock,
      titleEn: "30-Day Guarantee",
      titleFr: "Garantie 30 Jours",
      descEn: "Not satisfied? Get a full refund within 30 days. We stand behind every product we sell.",
      descFr: "Pas satisfait? Remboursement complet sous 30 jours. Nous garantissons chaque produit.",
    },
    {
      icon: Package,
      titleEn: "Nationwide Delivery",
      titleFr: "Livraison Nationale",
      descEn: "Fast, reliable delivery across Cameroon and beyond. Your wellness products, right to your door.",
      descFr: "Livraison rapide et fiable dans tout le Cameroun. Vos produits de bien-être, directement chez vous.",
    },
    {
      icon: Sparkles,
      titleEn: "Expert Guidance",
      titleFr: "Conseil Expert",
      descEn: "Your partner is trained to help you choose the right products for your specific wellness goals.",
      descFr: "Votre partenaire est formé pour vous aider à choisir les bons produits selon vos objectifs.",
    },
  ];

  // ── Section: how it works ────────────────────────────────────────────────
  const steps = [
    {
      num: "01",
      titleEn: "Discover",
      titleFr: "Découvrez",
      descEn: "Browse our curated collection of natural wellness and nutrition products.",
      descFr: "Parcourez notre collection de produits de bien-être et de nutrition naturels.",
    },
    {
      num: "02",
      titleEn: "Order",
      titleFr: "Commandez",
      descEn: "Contact your partner directly on WhatsApp to place your order — no complicated process.",
      descFr: "Contactez directement votre partenaire sur WhatsApp pour passer commande — aucune complication.",
    },
    {
      num: "03",
      titleEn: "Transform",
      titleFr: "Transformez",
      descEn: "Receive your products, follow your wellness plan, and experience real change in your life.",
      descFr: "Recevez vos produits, suivez votre plan bien-être et vivez une vraie transformation.",
    },
  ];

  return (
    <PartnerLayout partnerWhatsApp={partner.whatsappNumber}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14 lg:gap-20">

            {/* Text */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1">
              <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
                <Badge className="mb-5 bg-secondary/10 text-secondary hover:bg-secondary/20 border-none px-4 py-1.5 text-sm uppercase tracking-wider">
                  {t("Authorized Independent Partner", "Partenaire Indépendant Agréé")}
                </Badge>
              </motion.div>
              <motion.h1
                variants={fadeUp} custom={0.1} initial="hidden" animate="visible"
                className="text-4xl md:text-5xl lg:text-6xl font-serif text-foreground font-bold leading-tight mb-5"
              >
                {heroTitle}
              </motion.h1>
              <motion.p
                variants={fadeUp} custom={0.2} initial="hidden" animate="visible"
                className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10"
              >
                {heroSub}
              </motion.p>
              <motion.div
                variants={fadeUp} custom={0.3} initial="hidden" animate="visible"
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  size="lg"
                  className="rounded-full px-8 h-14 text-base shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
                  onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                >
                  {t("Shop Products", "Acheter les Produits")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <a href={waBase} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base bg-background/50 backdrop-blur w-full sm:w-auto hover:scale-105 transition-transform">
                    {t("Contact Me Directly", "Contactez-moi Directement")}
                  </Button>
                </a>
              </motion.div>
            </div>

            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex-shrink-0 order-1 md:order-2 flex items-center justify-center"
            >
              <div className="animate-partner-float relative">
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/25 to-secondary/25 blur-2xl scale-110 pointer-events-none" />
                {profileImageUrl ? (
                  <div className="relative w-52 h-64 sm:w-64 sm:h-80 md:w-72 md:h-96 lg:w-80 lg:h-[430px] rounded-[2.5rem] overflow-hidden border-4 border-primary/20 shadow-2xl shadow-primary/20">
                    <img src={profileImageUrl} alt={partner.slug} className="w-full h-full object-cover object-top" />
                  </div>
                ) : (
                  <div className="relative w-52 h-64 sm:w-64 sm:h-80 md:w-72 md:h-96 lg:w-80 lg:h-[430px] rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-4 border-primary/20 shadow-2xl shadow-primary/20 flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                      <User className="w-10 h-10 md:w-14 md:h-14 text-primary/40" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground px-4 text-center">{partner.slug}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Banner ─────────────────────────────────────────────────── */}
      <section className="py-12 bg-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp} custom={i * 0.1} initial="hidden"
                whileInView="visible" viewport={{ once: true, margin: "-60px" }}
                className="text-center"
              >
                <s.icon className="h-8 w-8 mx-auto mb-3 text-secondary opacity-90" />
                <div className="text-3xl md:text-4xl font-serif font-bold mb-1">
                  <AnimatedCounter to={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm text-primary-foreground/70 uppercase tracking-wider">
                  {t(s.labelEn, s.labelFr)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products ─────────────────────────────────────────────────────── */}
      <section id="products" className="py-24 bg-card/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden"
            whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-none px-4 py-1.5 uppercase tracking-wider text-xs">
              {t("Our Products", "Nos Produits")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t("Wellness Collection", "Collection Bien-être")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("Premium natural nutrition and care products to support your daily vitality.", "Produits de nutrition et de soins naturels haut de gamme pour soutenir votre vitalité quotidienne.")}
            </p>
          </motion.div>

          <motion.div
            variants={stagger} initial="hidden"
            whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {activeProducts.map((product) => {
              const waLink = `${waBase}?text=${encodeURIComponent(`Hello! I'm interested in buying: ${t(product.nameEn, product.nameFr)}`)}`;
              const imgUrl = resolveImageUrl(product.imageUrl);
              return (
                <motion.div key={product.id} variants={cardItem}>
                  <motion.div
                    whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
                    className="group relative bg-background rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-shadow duration-300 h-full flex flex-col"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden flex items-center justify-center">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={t(product.nameEn, product.nameFr)}
                          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                          <span className="text-primary/30 font-serif font-bold text-5xl">
                            {t(product.nameEn, product.nameFr).charAt(0)}
                          </span>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 flex items-end justify-center pb-6">
                        <a href={waLink} target="_blank" rel="noopener noreferrer">
                          <motion.button
                            initial={{ y: 10, opacity: 0 }}
                            whileHover={{ scale: 1.05 }}
                            className="bg-white text-primary font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {t("Order Now", "Commander")}
                          </motion.button>
                        </a>
                      </div>

                      <Badge className="absolute top-4 left-4 bg-background/85 backdrop-blur text-foreground border-none text-xs font-medium">
                        {product.category}
                      </Badge>
                      {product.videoUrl && (
                        <button
                          className="absolute top-4 right-4 bg-background/85 backdrop-blur rounded-full p-1.5 hover:bg-background transition-colors"
                          onClick={() => document.getElementById("videos")?.scrollIntoView({ behavior: "smooth" })}
                          title={t("Watch video", "Voir la vidéo")}
                        >
                          <PlayCircle className="h-4 w-4 text-primary" />
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-serif font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {t(product.nameEn, product.nameFr)}
                        </h3>
                        <span className="font-bold text-primary ml-2 shrink-0">
                          {product.priceXaf.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed flex-1">
                        {t(product.descriptionEn || "", product.descriptionFr || "")}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium bg-primary/8 text-primary px-2.5 py-1 rounded-full">
                            {product.pvPoints} PV
                          </span>
                          {(product.stock != null && product.stock > 0) ? (
                            <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">
                              {t("In Stock", "En Stock")}
                            </span>
                          ) : null}
                        </div>
                        <a href={waLink} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="rounded-full text-xs h-8 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                            {t("Order", "Commander")}
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Why Songtai Life ─────────────────────────────────────────────── */}
      <section className="py-24 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden"
            whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-secondary/10 text-secondary border-none px-4 py-1.5 uppercase tracking-wider text-xs">
              {t("Why Choose Us", "Pourquoi Nous Choisir")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              {t("The Songtai Life Difference", "La Différence Songtai Life")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t(
                "We combine nature's best ingredients with modern science to deliver wellness products you can truly trust.",
                "Nous combinons les meilleurs ingrédients naturels avec la science moderne pour des produits bien-être en qui vous pouvez avoir confiance."
              )}
            </p>
          </motion.div>

          <motion.div
            variants={stagger} initial="hidden"
            whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {pillars.map((p, i) => (
              <motion.div key={i} variants={cardItem}>
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="group p-8 rounded-2xl border border-border/50 bg-background hover:border-primary/30 hover:shadow-lg hover:shadow-primary/8 transition-all duration-300 h-full"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/8 group-hover:bg-primary/15 transition-colors flex items-center justify-center mb-5">
                    <p.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif font-bold text-lg mb-3 group-hover:text-primary transition-colors">
                    {t(p.titleEn, p.titleFr)}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t(p.descEn, p.descFr)}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-card/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden"
            whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-none px-4 py-1.5 uppercase tracking-wider text-xs">
              {t("Simple Process", "Processus Simple")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              {t("How It Works", "Comment Ça Marche")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t(
                "Getting started with Songtai Life is simple — three steps to your wellness transformation.",
                "Démarrer avec Songtai Life est simple — trois étapes vers votre transformation bien-être."
              )}
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-10 left-[calc(16.666%+2rem)] right-[calc(16.666%+2rem)] h-px bg-border z-0" />

              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp} custom={i * 0.15} initial="hidden"
                  whileInView="visible" viewport={{ once: true, margin: "-60px" }}
                  className="relative z-10 flex flex-col items-center text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-6 shadow-lg shadow-primary/25"
                  >
                    <span className="font-serif font-bold text-2xl">{step.num}</span>
                  </motion.div>
                  <h3 className="font-serif font-bold text-xl mb-3">{t(step.titleEn, step.titleFr)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(step.descEn, step.descFr)}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              variants={fadeUp} custom={0.4} initial="hidden"
              whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="text-center mt-14"
            >
              <a href={waBase} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="rounded-full px-10 h-14 text-base shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  {t("Start My Journey", "Commencer Mon Parcours")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Videos ───────────────────────────────────────────────────────── */}
      {productsWithVideo.length > 0 && (
        <section id="videos" className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              variants={fadeUp} custom={0} initial="hidden"
              whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t("Product Videos", "Vidéos Produits")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t(
                  "See our products in action — discover how each one supports your wellness journey.",
                  "Découvrez nos produits en action — voyez comment chacun soutient votre bien-être."
                )}
              </p>
            </motion.div>

            {(() => {
              const VideoProductCard = ({ product }: { product: typeof productsWithVideo[0] }) => {
                const imgUrl = resolveImageUrl(product.imageUrl);
                const waUrl = `${waBase}?text=${encodeURIComponent(`Hello! I'm interested in: ${t(product.nameEn, product.nameFr)}`)}`;
                const inStock = product.stock == null || product.stock > 0;
                return (
                  <motion.div
                    variants={cardItem}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl border border-border/50 bg-background overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/25 transition-all duration-300"
                  >
                    <div className="p-4 pb-0">
                      <VideoEmbed url={product.videoUrl!} title={t(product.nameEn, product.nameFr)} />
                    </div>
                    <div className="p-6 flex gap-5">
                      {imgUrl && (
                        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border/40">
                          <img src={imgUrl} alt={t(product.nameEn, product.nameFr)} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-serif font-bold text-lg leading-tight">{t(product.nameEn, product.nameFr)}</h3>
                          <span className="font-semibold text-primary text-base shrink-0">{product.priceXaf.toLocaleString()} FCFA</span>
                        </div>
                        {(product.descriptionEn || product.descriptionFr) && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {t(product.descriptionEn || "", product.descriptionFr || "")}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="text-xs font-medium bg-muted px-2.5 py-1 rounded-full text-muted-foreground">{product.pvPoints} PV</span>
                          {product.category && <Badge variant="outline" className="text-xs border-primary/30 text-primary px-2.5 py-1">{product.category}</Badge>}
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${inStock ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
                            {inStock ? t("In stock", "En stock") : t("Out of stock", "Rupture de stock")}
                          </span>
                        </div>
                        <a href={waUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="rounded-full w-full sm:w-auto hover:scale-105 transition-transform">
                            {t("Order via WhatsApp", "Commander via WhatsApp")}
                          </Button>
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              };

              const groups: Array<{ label: string | null; items: typeof productsWithVideo }> =
                videoCategories.length > 0
                  ? videoCategories.map((cat) => ({ label: cat, items: productsWithVideo.filter((p: any) => p.category === cat) }))
                  : [{ label: null, items: productsWithVideo }];

              const uncategorised = productsWithVideo.filter((p: any) => !p.category);
              if (videoCategories.length > 0 && uncategorised.length > 0)
                groups.push({ label: t("Other Products", "Autres Produits"), items: uncategorised });

              return (
                <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-16">
                  {groups.map((group, gi) => (
                    <div key={group.label ?? gi}>
                      {group.label && (
                        <div className="flex items-center gap-4 mb-8">
                          <Badge variant="outline" className="text-sm px-4 py-1.5 font-medium border-primary/30 text-primary">{group.label}</Badge>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {group.items.map((product) => <VideoProductCard key={product.id} product={product} />)}
                      </div>
                    </div>
                  ))}
                </motion.div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ── About ────────────────────────────────────────────────────────── */}
      {about && (
        <section id="about" className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              variants={fadeUp} custom={0} initial="hidden"
              whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-black/10 rounded-full blur-3xl" />
              <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <motion.div variants={fadeUp} custom={0.1} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">{t("Our Story", "Notre Histoire")}</h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-primary-foreground/90 leading-relaxed text-lg">{t(about.storyEn, about.storyFr)}</p>
                  </div>
                  <div className="mt-8 space-y-5">
                    {[
                      { label: t("Mission", "Mission"), text: t(about.missionEn, about.missionFr) },
                      { label: t("Vision", "Vision"), text: t(about.visionEn, about.visionFr) },
                    ].map((item, i) => (
                      <motion.div key={i} variants={fadeUp} custom={0.2 + i * 0.1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex gap-3">
                        <CheckCircle2 className="h-6 w-6 text-secondary shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold">{item.label}</h4>
                          <p className="text-sm text-primary-foreground/80">{item.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
                <motion.div
                  variants={fadeIn} custom={0.2} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="relative aspect-[3/4] md:aspect-square rounded-2xl overflow-hidden shadow-xl bg-primary-foreground/10"
                >
                  {about.imageUrl ? (
                    <img src={resolveImageUrl(about.imageUrl) ?? ""} alt="About Songtai Life" className="object-cover w-full h-full mix-blend-overlay" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-t from-black/40 to-transparent" />
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      {testimonials && testimonials.length > 0 && (
        <section id="testimonials" className="py-24 bg-card/30 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              variants={fadeUp} custom={0} initial="hidden"
              whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-secondary/10 text-secondary border-none px-4 py-1.5 uppercase tracking-wider text-xs">
                {t("Success Stories", "Histoires de Réussite")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t("Real Stories", "Histoires Vraies")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("Hear from people who have transformed their wellness journey.", "Écoutez les personnes qui ont transformé leur parcours de bien-être.")}
              </p>
            </motion.div>

            <motion.div
              variants={stagger} initial="hidden"
              whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {testimonials.filter((tt) => tt.isActive && tt.authorName && tt.contentEn).map((testim, idx) => (
                <motion.div key={testim.id} variants={cardItem}>
                  <motion.div
                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                    className="bg-background border border-border/50 hover:border-secondary/30 hover:shadow-lg hover:shadow-secondary/8 rounded-2xl p-8 transition-all duration-300 h-full flex flex-col"
                  >
                    <div className="flex gap-1 mb-5 text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < testim.rating ? "fill-current" : "opacity-25"}`} />
                      ))}
                    </div>
                    <p className="text-foreground/90 italic mb-6 leading-relaxed flex-1">
                      "{t(testim.contentEn, testim.contentFr)}"
                    </p>
                    <div className="flex items-center gap-4 pt-4 border-t border-border/40">
                      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-border">
                        {testim.imageUrl ? (
                          <img src={resolveImageUrl(testim.imageUrl) ?? ""} alt={testim.authorName} className="object-cover w-full h-full" />
                        ) : (
                          <span className="font-bold text-muted-foreground">{testim.authorName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold font-serif text-sm">{testim.authorName}</h4>
                        {testim.authorRole && <p className="text-xs text-muted-foreground">{testim.authorRole}</p>}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Gallery ──────────────────────────────────────────────────────── */}
      {gallery && gallery.length > 0 && (
        <section id="gallery" className="py-24 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              variants={fadeUp} custom={0} initial="hidden"
              whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t("Gallery", "Galerie")}</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {t("A glimpse into the Songtai Life community and products.", "Un aperçu de la communauté et des produits Songtai Life.")}
              </p>
            </motion.div>
            <motion.div
              variants={stagger} initial="hidden"
              whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {gallery.sort((a, b) => a.sortOrder - b.sortOrder).map((img, i) => (
                <motion.div key={img.id} variants={cardItem}
                  className={`group relative rounded-2xl overflow-hidden bg-muted aspect-square ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
                >
                  <img src={resolveImageUrl(img.imageUrl) ?? ""} alt="" className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out" />
                  {(img.captionEn || img.captionFr) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                      <p className="text-white font-medium text-sm">{t(img.captionEn || "", img.captionFr || "")}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Business Opportunity ─────────────────────────────────────────── */}
      <section className="py-24 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">

              {/* Left: text */}
              <motion.div
                variants={fadeUp} custom={0} initial="hidden"
                whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              >
                <Badge className="mb-5 bg-secondary/10 text-secondary border-none px-4 py-1.5 uppercase tracking-wider text-xs">
                  {t("Business Opportunity", "Opportunité d'Affaires")}
                </Badge>
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 leading-tight">
                  {t("Earn While Sharing Wellness", "Gagnez en Partageant le Bien-être")}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {t(
                    "Songtai Life isn't just about health — it's a proven business system. Join thousands of partners across Africa who build real income by sharing products they believe in.",
                    "Songtai Life n'est pas seulement une question de santé — c'est un système commercial éprouvé. Rejoignez des milliers de partenaires en Afrique qui construisent un revenu réel en partageant des produits en lesquels ils croient."
                  )}
                </p>

                {[
                  { icon: TrendingUp, en: "Competitive commissions on every sale", fr: "Commissions compétitives sur chaque vente" },
                  { icon: Users, en: "Build and lead your own distribution team", fr: "Construisez et dirigez votre propre équipe" },
                  { icon: Globe, en: "Work from anywhere — no office required", fr: "Travaillez de partout — aucun bureau requis" },
                  { icon: Award, en: "Recognition programs and performance bonuses", fr: "Programmes de reconnaissance et primes de performance" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp} custom={0.1 + i * 0.1} initial="hidden"
                    whileInView="visible" viewport={{ once: true }}
                    className="flex items-start gap-3 mb-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-foreground/85 text-sm leading-relaxed pt-1">{t(item.en, item.fr)}</p>
                  </motion.div>
                ))}

                <motion.div variants={fadeUp} custom={0.5} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8">
                  <a href={`${waBase}?text=${encodeURIComponent("Hello! I'm interested in joining the Songtai Life business opportunity.")}`} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" className="rounded-full px-8 h-12 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors hover:scale-105 transform">
                      {t("Learn More", "En Savoir Plus")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </motion.div>
              </motion.div>

              {/* Right: visual card */}
              <motion.div
                variants={fadeUp} custom={0.2} initial="hidden"
                whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/15 to-secondary/15 rounded-[3rem] blur-2xl" />
                  <div className="relative bg-primary rounded-[2rem] p-8 md:p-10 text-primary-foreground shadow-2xl">
                    <div className="absolute top-6 right-6 opacity-10">
                      <TrendingUp className="h-24 w-24" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-6">{t("Why Partner with Us?", "Pourquoi Nous Rejoindre?")}</h3>
                    {[
                      { num: "3×", en: "Faster growth vs. traditional retail", fr: "Croissance plus rapide vs. vente traditionnelle" },
                      { num: "40%", en: "Average partner commission rate", fr: "Taux de commission moyen des partenaires" },
                      { num: "0 XAF", en: "Startup cost to begin selling", fr: "Coût de démarrage pour commencer" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-5 mb-6 last:mb-0">
                        <div className="text-3xl font-serif font-bold text-secondary shrink-0 w-16">{item.num}</div>
                        <p className="text-primary-foreground/80 text-sm leading-relaxed">{t(item.en, item.fr)}</p>
                      </div>
                    ))}
                    <div className="mt-8 pt-6 border-t border-white/15">
                      <a href={`${waBase}?text=${encodeURIComponent("Hello! I want to become a Songtai Life partner.")}`} target="_blank" rel="noopener noreferrer">
                        <Button size="lg" className="w-full rounded-full bg-white text-primary hover:bg-secondary hover:text-secondary-foreground transition-colors h-12 font-semibold">
                          {t("Join as a Partner", "Rejoindre comme Partenaire")}
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      {faq && faq.length > 0 && (
        <section id="faq" className="py-24 bg-card/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              variants={fadeUp} custom={0} initial="hidden"
              whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-none px-4 py-1.5 uppercase tracking-wider text-xs">FAQ</Badge>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t("Common Questions", "Questions Fréquentes")}</h2>
            </motion.div>
            <motion.div
              variants={stagger} initial="hidden"
              whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              className="space-y-3"
            >
              {faq.sort((a, b) => a.sortOrder - b.sortOrder).map((item, i) => (
                <motion.details
                  key={item.id}
                  variants={cardItem}
                  className="group border border-border/60 bg-background rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden hover:border-primary/30 transition-colors duration-200"
                >
                  <summary className="flex items-center justify-between p-6 font-medium cursor-pointer list-none hover:bg-muted/30 transition-colors">
                    <span className="pr-4 text-foreground/90">{t(item.questionEn, item.questionFr)}</span>
                    <span className="transition-transform duration-300 group-open:rotate-180 shrink-0">
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </span>
                  </summary>
                  <div className="p-6 pt-0 text-muted-foreground leading-relaxed border-t border-border/30 bg-muted/10 text-sm">
                    {t(item.answerEn, item.answerFr)}
                  </div>
                </motion.details>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 text-center text-primary-foreground">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden"
            whileInView="visible" viewport={{ once: true, margin: "-60px" }}
          >
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-8 w-8 text-secondary" />
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-5 max-w-2xl mx-auto leading-tight">
              {t("Ready to Start Your Wellness Journey?", "Prêt à Commencer Votre Parcours Bien-être?")}
            </h2>
            <p className="text-primary-foreground/75 max-w-xl mx-auto mb-10 text-lg">
              {t(
                "Connect with your partner today. No pressure, just honest guidance on the best products for your health goals.",
                "Connectez-vous avec votre partenaire aujourd'hui. Sans pression, juste des conseils honnêtes sur les meilleurs produits pour vos objectifs de santé."
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={`${waBase}?text=${encodeURIComponent("Hello! I'd like to learn more about Songtai Life products.")}`} target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white text-primary font-semibold px-10 h-14 rounded-full shadow-xl flex items-center gap-2 mx-auto sm:mx-0 hover:bg-secondary hover:text-secondary-foreground transition-colors text-base"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t("Chat on WhatsApp", "Discuter sur WhatsApp")}
                </motion.button>
              </a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                className="border border-white/30 text-white font-semibold px-10 h-14 rounded-full flex items-center gap-2 mx-auto sm:mx-0 hover:bg-white/10 transition-colors text-base"
              >
                {t("Browse Products", "Voir les Produits")}
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

    </PartnerLayout>
  );
}
