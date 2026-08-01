/**
 * Upsert all Songtai Life products into the products table.
 * Maps video_url_en → video_url and image → image_url since the raw SQL
 * export leaves those two columns NULL.
 * Safe to re-run — uses INSERT … ON CONFLICT (id) DO UPDATE.
 */
import { pool } from "@workspace/db";

interface ProductSeed {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  priceXaf: number;
  pvPoints: number;
  category: string;
  imageUrl: string;
  videoUrl: string;
  stock: number;
}

const products: ProductSeed[] = [
  {
    id: "0538a400-4483-4789-a340-adc3a5575ebf",
    slug: "omega-3-fish-oil",
    nameEn: "Songtai Life Omega-3 Fish Oil Softgels",
    nameFr: "Gélules d'Huile de Poisson Oméga-3 Songtai Life",
    descriptionEn:
      "Promotes brain and eye health, fights depression and anxiety, reduces asthma in children, alleviates menstrual pain, and helps manage obesity, high blood pressure and insulin resistance.",
    descriptionFr:
      "Favorise la santé cérébrale et oculaire, lutte contre l'anxiété et la dépression, réduit l'asthme chez les enfants, soulage les douleurs menstruelles et aide à combattre l'obésité, l'hypertension artérielle et la résistance à l'insuline.",
    priceXaf: 19200,
    pvPoints: 21,
    category: "Health Supplements",
    imageUrl:
      "https://auyjxchghtetxpiyecds.supabase.co/storage/v1/object/public/media/products/1783950010546_fq8elk0uk.jpeg",
    videoUrl: "https://youtu.be/mW_xJ9xElrA",
    stock: 1000,
  },
  {
    id: "0831611f-03d5-44f4-a24a-abddfad13baf",
    slug: "rev-cell",
    nameEn: "Songtai Life Rev-Cell",
    nameFr: "Songtai Life Rev-Cell",
    descriptionEn:
      "Restore, renew, revitalize. A solid beverage powder blending blackcurrant, cantaloupe, grape, banana, apple, blueberry and blackberry extracts to boost the immune system, support liver health, improve blood circulation and cholesterol, and fight against sickle cell complications and hemorrhoids.",
    descriptionFr:
      "Restaurer, renouveler, revitaliser. Une boisson en poudre associant extraits de cassis, cantaloup, raisin, banane, pomme, myrtille et mûre pour renforcer le système immunitaire, soutenir la santé du foie, améliorer la circulation sanguine et le cholestérol, et lutter contre les complications de la drépanocytose et les hémorroïdes.",
    priceXaf: 20400,
    pvPoints: 19,
    category: "Nutrition",
    imageUrl:
      "https://auyjxchghtetxpiyecds.supabase.co/storage/v1/object/public/media/products/1784024337614_6799e8o21y.jpeg",
    videoUrl: "https://youtu.be/YOtkmrZsp1M",
    stock: 1000,
  },
  {
    id: "2a9bf0a8-cc13-49bc-b200-f276e96266b7",
    slug: "ganoderma-lucidum-spore-coffee",
    nameEn: "Songtai Life Ganoderma Lucidum Spore Coffee",
    nameFr: "Café aux Spores de Ganoderma Lucidum Songtai Life",
    descriptionEn:
      "A natural detox coffee that increases energy levels, fights anxiety and depression, boosts the immune system, improves cardiovascular health and helps with insomnia.",
    descriptionFr:
      "Un café détoxifiant naturel qui augmente le niveau d'énergie, combat l'anxiété et la dépression, renforce le système immunitaire, améliore la santé cardiovasculaire et aide contre l'insomnie.",
    priceXaf: 9600,
    pvPoints: 7,
    category: "Nutrition",
    imageUrl:
      "https://auyjxchghtetxpiyecds.supabase.co/storage/v1/object/public/media/products/1783894495206_xcpqvbtai8b.png",
    videoUrl: "https://www.youtube.com/watch?v=XqNJ9nNYkdQ",
    stock: 1000,
  },
  {
    id: "49c1be88-5e5b-4e27-baf9-892242f62451",
    slug: "immune-up-multivitamin",
    nameEn: "Songtai Life Immune Up Multivitamin Effervescent Tablets",
    nameFr: "Comprimés Effervescents Multivitaminés Immune Up Songtai Life",
    descriptionEn:
      "Rich in essential vitamins and minerals, maintains muscle strength, supports growth and repair, and acts as an anti-aging aid that helps wounds heal.",
    descriptionFr:
      "Riches en vitamines et minéraux essentiels, ils maintiennent la force musculaire, favorisent la croissance et la réparation, et agissent comme anti-âge en aidant à la cicatrisation des plaies.",
    priceXaf: 12000,
    pvPoints: 13,
    category: "Health Supplements",
    imageUrl:
      "https://auyjxchghtetxpiyecds.supabase.co/storage/v1/object/public/media/products/1784024129928_t89fnij4i3k.jpeg",
    videoUrl: "https://youtu.be/bjvl1fPmD3w",
    stock: 1000,
  },
  {
    id: "71358615-304d-4e02-b6cc-96d4f5284ae6",
    slug: "lemon-green-tea-toothpaste",
    nameEn: "Songtai Life Lemon & Green Tea Whitening Toothpaste",
    nameFr: "Dentifrice Blanchissant Citron & Thé Vert Songtai Life",
    descriptionEn:
      "A day-and-night formula: energizing lemon by day, repairing green tea by night. Removes plaque and stains, freshens breath, and is suitable for daily use by the whole family.",
    descriptionFr:
      "Une formule jour et nuit : citron tonifiant le jour, thé vert réparateur la nuit. Élimine les plaques et taches, procure une haleine fraîche et convient à un usage quotidien pour toute la famille.",
    priceXaf: 4200,
    pvPoints: 4,
    category: "Personal Care",
    imageUrl:
      "https://auyjxchghtetxpiyecds.supabase.co/storage/v1/object/public/media/products/1783949976712_dyrvwkcs2s.jpeg",
    videoUrl: "https://youtu.be/RNqLDA_8vv0",
    stock: 1000,
  },
  {
    id: "bfc8bf32-e373-44d4-bc28-e0b265c75dce",
    slug: "calcium-vitamin-d3",
    nameEn: "Songtai Life Calcium + Vitamin D3",
    nameFr: "Songtai Life Calcium + Vitamine D3",
    descriptionEn:
      "Strengthens bones and teeth, protects cardiac muscles, controls blood pressure, prevents kidney stones and supports overall immunity.",
    descriptionFr:
      "Renforce les os et les dents, protège les muscles cardiaques, contrôle la pression artérielle, prévient les calculs rénaux et soutient l'immunité globale.",
    priceXaf: 12000,
    pvPoints: 12,
    category: "Health Supplements",
    imageUrl:
      "https://auyjxchghtetxpiyecds.supabase.co/storage/v1/object/public/media/products/1783950538447_24wkzh5u10o.png",
    videoUrl: "https://www.youtube.com/watch?v=IRUvsMYmxjE",
    stock: 1000,
  },
  {
    id: "cbb2fd6d-6adf-42a7-91db-127333256d99",
    slug: "chitosan-life",
    nameEn: "Songtai Life Chitosan Life Capsules",
    nameFr: "Capsules Chitosan Life Songtai Life",
    descriptionEn:
      "Improves blood cholesterol levels, helps with weight loss, balances body pH, reduces the risk of anemia, and supports protection against heart attack, stroke, diabetes and cancer.",
    descriptionFr:
      "Améliore le taux de cholestérol sanguin, aide à la perte de poids, équilibre le pH du corps, réduit le risque d'anémie et aide à se protéger contre les crises cardiaques, les AVC, le diabète et le cancer.",
    priceXaf: 12000,
    pvPoints: 20,
    category: "Health Supplements",
    imageUrl:
      "https://auyjxchghtetxpiyecds.supabase.co/storage/v1/object/public/media/products/1784024085616_8stgdmqewuh.jpeg",
    videoUrl: "https://youtu.be/8xZYkxv8RyQ",
    stock: 1000,
  },
];

async function seedProducts() {
  const client = await pool.connect();
  console.log(`Seeding ${products.length} products…`);

  try {
    for (const p of products) {
      await client.query(
        `INSERT INTO products
           (id, slug, name_en, name_fr, description_en, description_fr,
            price_xaf, pv_points, category, image_url, video_url,
            stock, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,NOW(),NOW())
         ON CONFLICT (id) DO UPDATE SET
           slug           = EXCLUDED.slug,
           name_en        = EXCLUDED.name_en,
           name_fr        = EXCLUDED.name_fr,
           description_en = EXCLUDED.description_en,
           description_fr = EXCLUDED.description_fr,
           price_xaf      = EXCLUDED.price_xaf,
           pv_points      = EXCLUDED.pv_points,
           category       = EXCLUDED.category,
           image_url      = EXCLUDED.image_url,
           video_url      = EXCLUDED.video_url,
           stock          = EXCLUDED.stock,
           is_active      = true,
           updated_at     = NOW()`,
        [
          p.id,
          p.slug,
          p.nameEn,
          p.nameFr,
          p.descriptionEn,
          p.descriptionFr,
          p.priceXaf,
          p.pvPoints,
          p.category,
          p.imageUrl,
          p.videoUrl,
          p.stock,
        ],
      );
      console.log(`  ✓ ${p.nameEn}`);
    }

    console.log("Done.");
  } finally {
    client.release();
    await pool.end();
  }
}

seedProducts().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
