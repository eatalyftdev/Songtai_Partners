/**
 * Upsert 13 FAQ items into the local `faq` table.
 * Category UUIDs from the source export are mapped to plain-text category labels
 * since the Drizzle faqTable stores category as text (not a FK).
 * Safe to re-run — uses INSERT … ON CONFLICT (id) DO UPDATE.
 */
import { pool } from "@workspace/db";

const CATEGORIES: Record<string, string> = {
  "84f18654-38a4-47c2-9ad3-263d0537ab02": "Payments & Bonuses",
  "6cda8ce3-d488-4ac8-b13e-f1aee5aac6d0": "Orders & Delivery",
  "11b23895-ddc1-4e26-a0b2-9e8e234ad7bd": "Business Opportunity",
  "61311295-05e0-4c1c-b5b1-9ca43dad41ab": "Products",
};

interface FaqSeed {
  id: string;
  categoryId: string;
  questionEn: string;
  questionFr: string;
  answerEn: string;
  answerFr: string;
  sortOrder: number;
}

const faqs: FaqSeed[] = [
  // Business Opportunity
  {
    id: "7e6b84ff-8f7a-4df9-b8ad-45d39407c895",
    categoryId: "11b23895-ddc1-4e26-a0b2-9e8e234ad7bd",
    questionEn: "How do I become a Songtai Life distributor?",
    questionFr: "Comment devenir distributeur Songtai Life ?",
    answerEn: "Register on our Become a Distributor page, choose an entry pack (Iron, Bronze, Silver, Gold, Platinum or VIP), and complete payment via mobile money. Your distributor account and PV are activated instantly.",
    answerFr: "Inscrivez-vous sur la page Devenir Distributeur, choisissez un pack d'entrée (Iron, Bronze, Silver, Gold, Platinum ou VIP) et réglez via mobile money. Votre compte distributeur et vos PV sont activés instantanément.",
    sortOrder: 1,
  },
  {
    id: "4b5170be-aea7-49f2-9735-bc6b9d27bbdf",
    categoryId: "11b23895-ddc1-4e26-a0b2-9e8e234ad7bd",
    questionEn: "What are the entry pack levels and prices?",
    questionFr: "Quels sont les niveaux et prix des packs d'inscription ?",
    answerEn: "Iron: 51,000 XAF (50 PV). Bronze: 84,000 XAF (85 PV). Silver: 150,000 XAF (150 PV). Gold: 240,000 XAF (240 PV). Platinum: 720,000 XAF (720 PV). VIP: 1,680,000 XAF (1,680 PV).",
    answerFr: "Iron : 51 000 XAF (50 PV). Bronze : 84 000 XAF (85 PV). Silver : 150 000 XAF (150 PV). Gold : 240 000 XAF (240 PV). Platinum : 720 000 XAF (720 PV). VIP : 1 680 000 XAF (1 680 PV).",
    sortOrder: 2,
  },
  {
    id: "e5bcecda-2b0b-41e7-a83e-b6c2ad1b4661",
    categoryId: "11b23895-ddc1-4e26-a0b2-9e8e234ad7bd",
    questionEn: "How does the compensation plan work?",
    questionFr: "Comment fonctionne le plan de rémunération ?",
    answerEn: "Songtai Life pays 12 bonus streams: Levelling Bonus and Sponsoring Bonus (daily), Performance Bonus (weekly, paid on your weaker leg), Leadership Bonus (monthly, up to 12 generations deep), plus Ranking, Maintenance, Upgrading, Trip, Car, Cash Reward, Repurchase and Housing incentives.",
    answerFr: "Songtai Life verse 12 types de bonus : Bonus de Mise à Niveau et de Parrainage (quotidiens), Bonus de Performance (hebdomadaire, calculé sur la jambe la plus faible), Bonus de Leadership (mensuel, jusqu'à 12 générations), ainsi que les bonus de Rang, de Maintenance, de Mise à Niveau, les primes Voyage, Voiture, Récompense en Espèces, Rachat et Logement.",
    sortOrder: 3,
  },
  {
    id: "b07f3413-23d6-4326-aa6b-1dac428ca159",
    categoryId: "11b23895-ddc1-4e26-a0b2-9e8e234ad7bd",
    questionEn: "What is the Sponsoring Bonus?",
    questionFr: "Qu'est-ce que le Bonus de Parrainage ?",
    answerEn: "As a sponsor, you earn 20% of the PV of anyone you personally bring into the business, paid on both legs of your team.",
    answerFr: "En tant que parrain, vous gagnez 20 % des PV de toute personne que vous amenez personnellement dans l'entreprise, calculés sur les deux jambes de votre équipe.",
    sortOrder: 4,
  },
  {
    id: "c620ee47-fcf3-4436-b85d-7a0bb0598ace",
    categoryId: "11b23895-ddc1-4e26-a0b2-9e8e234ad7bd",
    questionEn: "How do I qualify for a Car Award?",
    questionFr: "Comment se qualifier pour le programme Voiture ?",
    answerEn: "Two tiers are available: a $12,000 car requires 80,000 PV total network volume (with each leg's personal sponsor volume at 30,000 PV or more) and is valid for 12 months; a $16,000 car requires 110,000 PV (40,000 PV per leg). You can only choose one car award per qualification.",
    answerFr: "Deux paliers existent : la voiture à 12 000 $ nécessite 80 000 PV de volume total (avec au moins 30 000 PV de parrainage personnel par jambe), valable 12 mois ; la voiture à 16 000 $ nécessite 110 000 PV (40 000 PV par jambe). Un seul prix voiture peut être choisi par qualification.",
    sortOrder: 5,
  },
  // Products
  {
    id: "e6b533ee-4c8e-4482-885f-9953d570359c",
    categoryId: "61311295-05e0-4c1c-b5b1-9ca43dad41ab",
    questionEn: "Are Songtai Life products safe and certified?",
    questionFr: "Les produits Songtai Life sont-ils sûrs et certifiés ?",
    answerEn: "Yes. Songtai Group products are manufactured in GMP-certified workshops, grown on self-built organic plantations, and carry certifications including ISO 9001, ISO 14001, ISO 45001, HACCP, Halal and NSF, backed by more than 45 years of manufacturing experience.",
    answerFr: "Oui. Les produits du Groupe Songtai sont fabriqués dans des ateliers certifiés GMP, cultivés sur des plantations biologiques intégrées, et disposent de certifications ISO 9001, ISO 14001, ISO 45001, HACCP, Halal et NSF, appuyées par plus de 45 ans d'expérience en fabrication.",
    sortOrder: 6,
  },
  {
    id: "75d3a3ad-5ed4-472e-8a49-ba532f58d11d",
    categoryId: "61311295-05e0-4c1c-b5b1-9ca43dad41ab",
    questionEn: "What is Rev-Cell used for?",
    questionFr: "À quoi sert le Rev-Cell ?",
    answerEn: "Rev-Cell is a fruit and vegetable extract beverage powder designed to restore, renew and revitalize the body. It supports liver health, blood circulation, cholesterol balance, and is used by people managing sickle cell complications, hemorrhoids, and stomach ulcers.",
    answerFr: "Le Rev-Cell est une boisson en poudre à base d'extraits de fruits et légumes conçue pour restaurer, renouveler et revitaliser l'organisme. Il soutient la santé du foie, la circulation sanguine, l'équilibre du cholestérol, et est utilisé pour accompagner la drépanocytose, les hémorroïdes et les ulcères d'estomac.",
    sortOrder: 7,
  },
  {
    id: "9a8e6110-f3a6-41f0-b3d7-400bd2b72d42",
    categoryId: "61311295-05e0-4c1c-b5b1-9ca43dad41ab",
    questionEn: "Can the whole family use Songtai Life products?",
    questionFr: "Toute la famille peut-elle utiliser les produits Songtai Life ?",
    answerEn: "Most Songtai Life products, such as the Lemon & Green Tea Toothpaste and the Immune Up Multivitamin, are formulated for daily use by the whole family. For children, pregnant or nursing women, or anyone on medication, we recommend consulting a healthcare professional before use.",
    answerFr: "La plupart des produits Songtai Life, comme le dentifrice Citron & Thé Vert ou le Multivitamine Immune Up, sont formulés pour un usage quotidien par toute la famille. Pour les enfants, les femmes enceintes ou allaitantes, ou toute personne sous traitement médical, nous recommandons de consulter un professionnel de santé avant utilisation.",
    sortOrder: 8,
  },
  // Payments & Bonuses
  {
    id: "09c2b353-be84-43eb-aa45-4db815fdb023",
    categoryId: "84f18654-38a4-47c2-9ad3-263d0537ab02",
    questionEn: "What payment methods are accepted?",
    questionFr: "Quels moyens de paiement sont acceptés ?",
    answerEn: "We accept MTN Mobile Money and Orange Money through our secure MeSomb payment gateway. Commissions and withdrawals are also paid directly to your mobile money wallet.",
    answerFr: "Nous acceptons MTN Mobile Money et Orange Money via notre passerelle de paiement sécurisée MeSomb. Les commissions et retraits sont également versés directement sur votre portefeuille mobile money.",
    sortOrder: 9,
  },
  {
    id: "5aaa1ff0-6183-425e-94da-78e4910ab5e2",
    categoryId: "84f18654-38a4-47c2-9ad3-263d0537ab02",
    questionEn: "When and how often are bonuses paid?",
    questionFr: "Quand et à quelle fréquence les bonus sont-ils versés ?",
    answerEn: "Levelling and Sponsoring bonuses are paid daily, the Performance Bonus is paid weekly, and the Leadership, Maintenance and Ranking bonuses are paid monthly.",
    answerFr: "Les bonus de Mise à Niveau et de Parrainage sont versés quotidiennement, le Bonus de Performance chaque semaine, et les bonus de Leadership, de Maintenance et de Rang chaque mois.",
    sortOrder: 10,
  },
  {
    id: "f388ebae-5a2a-47d2-bee8-ffb158f26be2",
    categoryId: "84f18654-38a4-47c2-9ad3-263d0537ab02",
    questionEn: "What is the monthly maintenance requirement?",
    questionFr: "Quelle est l'exigence de maintenance mensuelle ?",
    answerEn: "To remain eligible for your Leadership Bonus, you must maintain 30 PV per month (equivalent to about $50). This is automatically deducted from your account before leadership commissions are calculated.",
    answerFr: "Pour rester éligible au Bonus de Leadership, vous devez maintenir 30 PV par mois (environ 50 $). Ce montant est automatiquement déduit de votre compte avant le calcul des commissions de leadership.",
    sortOrder: 11,
  },
  // Orders & Delivery
  {
    id: "223336cc-f088-4262-b3c0-3c68782093cb",
    categoryId: "6cda8ce3-d488-4ac8-b13e-f1aee5aac6d0",
    questionEn: "Where can I collect my starter pack or product orders?",
    questionFr: "Où puis-je récupérer mon pack de démarrage ou mes commandes ?",
    answerEn: "Starter packs and product orders are currently prepared for pickup at our Douala office (Akwa, Ancien Dalip). We are expanding pickup and delivery coverage across Cameroon — check the Contact page for the latest options in your area.",
    answerFr: "Les packs de démarrage et les commandes sont actuellement préparés pour un retrait à notre bureau de Douala (Akwa, Ancien Dalip). Nous étendons notre couverture de retrait et de livraison à travers le Cameroun — consultez la page Contact pour les options disponibles dans votre région.",
    sortOrder: 12,
  },
  {
    id: "60a872d1-6517-4420-b25c-23a188a9ef38",
    categoryId: "6cda8ce3-d488-4ac8-b13e-f1aee5aac6d0",
    questionEn: "Do you deliver outside Douala?",
    questionFr: "Livrez-vous en dehors de Douala ?",
    answerEn: "We are progressively rolling out delivery to other regions of Cameroon. For now, distributors outside Douala can arrange collection through their upline or contact our support team via WhatsApp to coordinate delivery.",
    answerFr: "Nous étendons progressivement la livraison aux autres régions du Cameroun. En attendant, les distributeurs situés hors de Douala peuvent organiser un retrait via leur parrain ou contacter notre équipe support par WhatsApp pour coordonner une livraison.",
    sortOrder: 13,
  },
];

async function seedFaq() {
  const client = await pool.connect();
  console.log(`Seeding ${faqs.length} FAQ items…`);

  try {
    for (const f of faqs) {
      await client.query(
        `INSERT INTO faq
           (id, question_en, question_fr, answer_en, answer_fr, category, sort_order, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
         ON CONFLICT (id) DO UPDATE SET
           question_en = EXCLUDED.question_en,
           question_fr = EXCLUDED.question_fr,
           answer_en   = EXCLUDED.answer_en,
           answer_fr   = EXCLUDED.answer_fr,
           category    = EXCLUDED.category,
           sort_order  = EXCLUDED.sort_order`,
        [
          f.id,
          f.questionEn,
          f.questionFr,
          f.answerEn,
          f.answerFr,
          CATEGORIES[f.categoryId],
          f.sortOrder,
        ],
      );
      console.log(`  ✓ [${CATEGORIES[f.categoryId]}] ${f.questionEn.slice(0, 55)}…`);
    }
    console.log("Done.");
  } finally {
    client.release();
    await pool.end();
  }
}

seedFaq().catch((err) => {
  console.error("FAQ seed failed:", err);
  process.exit(1);
});
