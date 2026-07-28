import { useParams } from "wouter";
import { useGetPartnerBySlug, getGetPartnerBySlugQueryKey, useListProducts, useListTestimonials, useListGallery, useListFaq, useGetAbout } from "@workspace/api-client-react";
import { PartnerLayout } from "@/components/layout/PartnerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Loader2, ArrowRight, Star, ChevronDown, CheckCircle2, PlayCircle, User } from "lucide-react";

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
      <iframe
        className="w-full aspect-video rounded-xl"
        src={`https://www.youtube.com/embed/${ytId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return (
      <iframe
        className="w-full aspect-video rounded-xl"
        src={`https://player.vimeo.com/video/${vimeoId}`}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Direct video file (mp4, webm, etc.)
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return (
      <video
        className="w-full aspect-video rounded-xl bg-black"
        src={url}
        controls
        title={title}
      />
    );
  }

  // Fallback: generic iframe
  return (
    <iframe
      className="w-full aspect-video rounded-xl"
      src={url}
      title={title}
      allowFullScreen
    />
  );
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
    query: { queryKey: getGetPartnerBySlugQueryKey(slug || ""), retry: false, enabled: !!slug }
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

  if (isError || !partner || partner.status !== 'active') {
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

  // Products grouped by category for the Videos section
  const activeProducts = products?.filter(p => p.isActive) ?? [];
  const productsWithVideo = activeProducts.filter(p => p.videoUrl);
  const videoCategories = [...new Set(productsWithVideo.map(p => p.category))].filter(Boolean) as string[];

  const profileImageUrl = resolveImageUrl(partner.profileImageUrl);

  return (
    <PartnerLayout partnerWhatsApp={partner.whatsappNumber}>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 lg:py-28 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14 lg:gap-20">

            {/* Left: Text & CTAs */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1">
              <Badge className="mb-5 bg-secondary/10 text-secondary hover:bg-secondary/20 border-none px-4 py-1.5 text-sm uppercase tracking-wider">
                {t("Authorized Independent Partner", "Partenaire Indépendant Agréé")}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-foreground font-bold leading-tight mb-5">
                {heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10">
                {heroSub}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="rounded-full px-8 h-14 text-base shadow-lg shadow-primary/25"
                  onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t("Shop Products", "Acheter les Produits")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <a
                  href={`https://wa.me/${partner.whatsappNumber?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base bg-background/50 backdrop-blur w-full sm:w-auto">
                    {t("Contact Me Directly", "Contactez-moi Directement")}
                  </Button>
                </a>
              </div>
            </div>

            {/* Right: Partner Photo — large, floating */}
            <div className="flex-shrink-0 order-1 md:order-2 flex items-center justify-center">
              <div className="animate-partner-float relative">
                {/* Glow ring behind the photo */}
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/25 to-secondary/25 blur-2xl scale-110 pointer-events-none" />
                {profileImageUrl ? (
                  <div className="relative w-52 h-64 sm:w-64 sm:h-80 md:w-72 md:h-96 lg:w-80 lg:h-[420px] rounded-[2.5rem] overflow-hidden border-4 border-primary/20 shadow-2xl shadow-primary/20">
                    <img
                      src={profileImageUrl}
                      alt={partner.slug}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="relative w-52 h-64 sm:w-64 sm:h-80 md:w-72 md:h-96 lg:w-80 lg:h-[420px] rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-4 border-primary/20 shadow-2xl shadow-primary/20 flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                      <User className="w-10 h-10 md:w-14 md:h-14 text-primary/40" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground px-4 text-center">{partner.slug}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t("Wellness Collection", "Collection Bien-être")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("Premium natural nutrition and care products to support your daily vitality.", "Produits de nutrition et de soins naturels haut de gamme pour soutenir votre vitalité quotidienne.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeProducts.map(product => (
              <Card key={product.id} className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 group">
                <div className="aspect-[4/3] bg-muted relative overflow-hidden flex items-center justify-center">
                  {product.imageUrl ? (
                    <img src={resolveImageUrl(product.imageUrl) ?? ''} alt={t(product.nameEn, product.nameFr)} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <span className="text-primary/40 font-serif font-bold text-2xl">{t(product.nameEn, product.nameFr).charAt(0)}</span>
                    </div>
                  )}
                  <Badge className="absolute top-4 left-4 bg-background/80 backdrop-blur text-foreground border-none">
                    {product.category}
                  </Badge>
                  {product.videoUrl && (
                    <button
                      className="absolute bottom-4 right-4 bg-background/80 backdrop-blur rounded-full p-2 hover:bg-background transition-colors"
                      onClick={() => document.getElementById('videos')?.scrollIntoView({ behavior: 'smooth' })}
                      title={t("Watch video", "Voir la vidéo")}
                    >
                      <PlayCircle className="h-5 w-5 text-primary" />
                    </button>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif font-bold text-xl line-clamp-1">{t(product.nameEn, product.nameFr)}</h3>
                    <span className="font-semibold text-primary">{product.priceXaf.toLocaleString()} FCFA</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {t(product.descriptionEn || "", product.descriptionFr || "")}
                  </p>
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-xs font-medium bg-muted px-2 py-1 rounded text-muted-foreground">
                      {product.pvPoints} PV
                    </span>
                    <a href={`https://wa.me/${partner.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello! I'm interested in buying: ${t(product.nameEn, product.nameFr)}`)}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="rounded-full hover:bg-primary hover:text-primary-foreground">
                        {t("Order via WhatsApp", "Commander via WhatsApp")}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Videos Section */}
      {productsWithVideo.length > 0 && (
        <section id="videos" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                {t("Product Videos", "Vidéos Produits")}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t(
                  "See our products in action — discover how each one supports your wellness journey.",
                  "Découvrez nos produits en action — voyez comment chacun soutient votre bien-être."
                )}
              </p>
            </div>

            {(() => {
              const VideoProductCard = ({ product }: { product: typeof productsWithVideo[0] }) => {
                const imgUrl = resolveImageUrl(product.imageUrl);
                const waUrl = `https://wa.me/${partner.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello! I'm interested in: ${t(product.nameEn, product.nameFr)}`)}`;
                const inStock = product.stock == null || product.stock > 0;
                return (
                  <div className="rounded-2xl border border-border/50 bg-background overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Video embed */}
                    <div className="p-4 pb-0">
                      <VideoEmbed url={product.videoUrl!} title={t(product.nameEn, product.nameFr)} />
                    </div>

                    {/* Product details */}
                    <div className="p-6 flex gap-5">
                      {/* Thumbnail */}
                      {imgUrl && (
                        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border/40">
                          <img
                            src={imgUrl}
                            alt={t(product.nameEn, product.nameFr)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Info */}
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
                          <span className="text-xs font-medium bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                            {product.pvPoints} PV
                          </span>
                          {product.category && (
                            <Badge variant="outline" className="text-xs border-primary/30 text-primary px-2.5 py-1">
                              {product.category}
                            </Badge>
                          )}
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${inStock ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                            {inStock ? t("In stock", "En stock") : t("Out of stock", "Rupture de stock")}
                          </span>
                        </div>

                        <a href={waUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="rounded-full w-full sm:w-auto">
                            {t("Order via WhatsApp", "Commander via WhatsApp")}
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              };

              const groups: Array<{ label: string | null; items: typeof productsWithVideo }> =
                videoCategories.length > 0
                  ? videoCategories.map(cat => ({ label: cat, items: productsWithVideo.filter((p: any) => p.category === cat) }))
                  : [{ label: null, items: productsWithVideo }];

              const uncategorised = productsWithVideo.filter((p: any) => !p.category);
              if (videoCategories.length > 0 && uncategorised.length > 0) {
                groups.push({ label: t("Other Products", "Autres Produits"), items: uncategorised });
              }

              return (
                <div className="space-y-16">
                  {groups.map((group, gi) => (
                    <div key={group.label ?? gi}>
                      {group.label && (
                        <div className="flex items-center gap-4 mb-8">
                          <Badge variant="outline" className="text-sm px-4 py-1.5 font-medium border-primary/30 text-primary">
                            {group.label}
                          </Badge>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {group.items.map(product => (
                          <VideoProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* About Section */}
      {about && (
        <section id="about" className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl" />

              <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
                    {t("Our Story", "Notre Histoire")}
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-primary-foreground/90 leading-relaxed text-lg">
                      {t(about.storyEn, about.storyFr)}
                    </p>
                  </div>
                  <div className="mt-8 space-y-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-6 w-6 text-secondary shrink-0" />
                      <div>
                        <h4 className="font-bold">{t("Mission", "Mission")}</h4>
                        <p className="text-sm text-primary-foreground/80">{t(about.missionEn, about.missionFr)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-6 w-6 text-secondary shrink-0" />
                      <div>
                        <h4 className="font-bold">{t("Vision", "Vision")}</h4>
                        <p className="text-sm text-primary-foreground/80">{t(about.visionEn, about.visionFr)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative aspect-[3/4] md:aspect-square rounded-2xl overflow-hidden shadow-xl bg-primary-foreground/10">
                  {about.imageUrl ? (
                     <img src={resolveImageUrl(about.imageUrl) ?? ''} alt="About Songtai Life" className="object-cover w-full h-full mix-blend-overlay" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-t from-black/40 to-transparent" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section id="testimonials" className="py-24 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t("Real Stories", "Histoires Vraies")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("Hear from people who have transformed their wellness journey.", "Écoutez les personnes qui ont transformé leur parcours de bien-être.")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.filter(t => t.isActive && t.authorName && t.contentEn).map(testim => (
                <Card key={testim.id} className="bg-background border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-6 text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < testim.rating ? "fill-current" : "opacity-30"}`} />
                      ))}
                    </div>
                    <p className="text-foreground/90 italic mb-8 leading-relaxed">
                      "{t(testim.contentEn, testim.contentFr)}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {testim.imageUrl ? (
                          <img src={resolveImageUrl(testim.imageUrl) ?? ''} alt={testim.authorName} className="object-cover w-full h-full" />
                        ) : (
                          <span className="font-bold text-muted-foreground">{testim.authorName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold font-serif">{testim.authorName}</h4>
                        {testim.authorRole && <p className="text-sm text-muted-foreground">{testim.authorRole}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery && gallery.length > 0 && (
        <section id="gallery" className="py-24">
          <div className="container mx-auto px-4">
             <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t("Gallery", "Galerie")}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.sort((a,b) => a.sortOrder - b.sortOrder).map((img, i) => (
                <div key={img.id} className={`group relative rounded-xl overflow-hidden bg-muted aspect-square ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                  <img src={resolveImageUrl(img.imageUrl) ?? ''} alt="" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                  {(img.captionEn || img.captionFr) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <p className="text-white font-medium">{t(img.captionEn || "", img.captionFr || "")}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq && faq.length > 0 && (
        <section id="faq" className="py-24 bg-card/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t("Common Questions", "Questions Fréquentes")}</h2>
            </div>
            <div className="space-y-4">
              {faq.sort((a,b) => a.sortOrder - b.sortOrder).map(item => (
                <details key={item.id} className="group border border-border/60 bg-background rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between p-6 font-medium cursor-pointer list-none hover:bg-muted/30 transition-colors">
                    <span className="pr-4">{t(item.questionEn, item.questionFr)}</span>
                    <span className="transition group-open:rotate-180 shrink-0">
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </span>
                  </summary>
                  <div className="p-6 pt-0 text-muted-foreground leading-relaxed border-t border-border/30 bg-muted/10">
                    {t(item.answerEn, item.answerFr)}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

    </PartnerLayout>
  );
}
