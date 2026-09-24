// Website product catalogue (`products` table). Content fields are copied from
// manikstu-backend/database/seeders/ProductSeeder.php; photos are small web copies of
// manikstu-backend/public/products. Sample values, not from the backend: stock_quantity,
// rating, rating_count, is_featured and translations.

export type ProductCategory = 'Health' | 'Nutrition';

export interface CatalogProduct {
  id: number;
  name: string;
  slug: string;
  category: ProductCategory;
  size: string;
  sku: string | null;
  price: number | null;
  stock_quantity: number;
  description: string;
  long_description: string;
  image: string;
  images: string[];
  highlights: string[];
  specifications: { label: string; value: string }[];
  usage_instructions: string;
  storage_instructions: string;
  ingredients: string;
  recommended_for: string[];
  rating: number | null;
  rating_count: number;
  is_featured: boolean;
  is_active: boolean;
  order: number;
  /** Locales with a translated name/description (`product_translations`), besides English. */
  translations: string[];
}

/** Stock at or below this counts as low. Not in the backend yet (no per-product reorder level). */
export const LOW_STOCK_LEVEL = 20;

/** Translation languages the website offers. */
export const PRODUCT_LOCALES: { code: string; label: string }[] = [
  { code: 'or', label: 'Odia' },
  { code: 'hi', label: 'Hindi' },
];

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    "id": 1,
    "name": "Poshak Tatwa",
    "slug": "poshak-tatwa",
    "category": "Health",
    "size": "300 ml",
    "sku": null,
    "price": 249,
    "stock_quantity": 48,
    "description": "Ayurvedic multivitamin syrup that boosts livestock health, growth, and productivity.",
    "long_description": "Poshak Tatwa is an Ayurvedic multivitamin and nutritional tonic designed to enhance livestock health, growth, and productivity. Its blend of natural herbal extracts improves metabolism, immunity, digestion, and physical strength. Essential for bone, muscle, and reproductive development, it is highly beneficial for growing, pregnant, lactating, and recovering animals. Regular supplementation ensures optimal body condition, better feed utilization, and improved overall performance.",
    "image": "/products/poshak-tatwa/1.jpg",
    "images": [
      "/products/poshak-tatwa/1.jpg",
      "/products/poshak-tatwa/2.jpg",
      "/products/poshak-tatwa/3.jpg",
      "/products/poshak-tatwa/4.jpg"
    ],
    "highlights": [
      "Supports bone formation and joint flexibility",
      "Boosts immunity and helps in disease resistance",
      "Enhances physical strength, stamina, and daily energy levels",
      "Promotes growth and development in young and adult animals",
      "Improves appetite, digestion, and nutrient absorption",
      "Helps in stress management and recovery from fatigue",
      "Maintains healthy skin and coat condition",
      "Ideal for daily health maintenance in livestock"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Syrup"
      },
      {
        "label": "Packaging Type",
        "value": "Bottle"
      },
      {
        "label": "Grade Standard",
        "value": "Ayurvedic Proprietary Medicine"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Multivitamin Supplement"
      },
      {
        "label": "Packaging",
        "value": "300 ml"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Small Ruminants (Goats/Sheep) — Weak Kids: 10 ml/day for 30 days; Pregnant Goats: 20 ml/day for 30 days.\nCattle — Weak Calves: 25 ml/day for 30 days; Pregnant Cows: 50 ml/day for 30 days.",
    "storage_instructions": "Store in a cool, dry place away from direct sunlight. Keep tightly closed when not in use.",
    "ingredients": "Composition (per 10 ml): Sahjan (Moringa) 100 mg, Apple Extract 100 mg, Amrud (Guava) 50 mg, Nashpati (Pear) 50 mg, Ashwagandha 30 mg, Shilajit 30 mg, Shatavari 45 mg, Amla (Indian Gooseberry) 15 mg, Aloe Vera 20 mg, Mulethi (Licorice) 15 mg, Safed Musli 20 mg, Papaya (Papita) 10 mg, Wheat Extract 20 mg, Bael (Wood Apple) 20 mg, Giloy (Tinospora cordifolia) 21 mg.",
    "recommended_for": [
      "Growing kids, lambs and calves",
      "Pregnant and lactating animals",
      "Weak, recovering or stressed livestock",
      "Daily health maintenance across the herd"
    ],
    "rating": 4.6,
    "rating_count": 38,
    "is_featured": true,
    "is_active": true,
    "order": 1,
    "translations": [
      "or",
      "hi"
    ]
  },
  {
    "id": 2,
    "name": "Livtherapy Syrup",
    "slug": "livtherapy-syrup",
    "category": "Health",
    "size": "1 Kg",
    "sku": null,
    "price": 173,
    "stock_quantity": 12,
    "description": "Powerful Ayurvedic liver tonic that supports hepatic function and recovery.",
    "long_description": "Livtherapy Syrup is a powerful Ayurvedic liver tonic formulated to protect and enhance liver function in livestock. It aids in detoxifying the bloodstream by supporting hepatic activity, improving liver enzyme function, and promoting bile secretion. Regular use helps animals recover from infections, stress, or deworming, and improves their overall vitality and health.",
    "image": "/products/livtherapy-syrup/1.jpg",
    "images": [
      "/products/livtherapy-syrup/1.jpg",
      "/products/livtherapy-syrup/2.jpg",
      "/products/livtherapy-syrup/3.jpg",
      "/products/livtherapy-syrup/4.jpg"
    ],
    "highlights": [
      "Supports and protects liver function in goats, sheep, and cattle",
      "Aids in detoxification of toxins, chemicals, and harmful metabolites",
      "Improves appetite, digestion, and nutrient absorption",
      "Enhances recovery from illness, stress, or post-medication (e.g., deworming)",
      "Promotes energy, immunity, and overall health"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Syrup"
      },
      {
        "label": "Packaging Type",
        "value": "Bottle"
      },
      {
        "label": "Grade Standard",
        "value": "Ayurvedic Proprietary Medicine"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Liver Tonic"
      },
      {
        "label": "Packaging",
        "value": "200 ml"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Goats & Sheep — Kids: 5 ml/day for 10 days; Adults: 10 ml/day for 10 days.\nCattle — Calves: 10 ml/day for 10 days; Adults: 20 ml/day for 10 days.",
    "storage_instructions": "Store in a cool, dry place away from direct sunlight.",
    "ingredients": "Composition (per 10 ml): Andrographis paniculata 250 mg, Eclipta alba 260 mg, Fumaria parviflora 255 mg, Phyllanthus niruri 245 mg, Terminalia chebula 250 mg, Tecomella undulata 245 mg, Chicorium endivia 200 mg, Emblica officinalis (Amla) 210 mg, Achyranthes aspera 200 mg, Terminalia arjuna 195 mg, Berberis aristata 200 mg, Potassium carbonate 140 mg, Piper longum (Long Pepper) 50 mg.",
    "recommended_for": [
      "Post-deworming recovery",
      "Animals with liver stress, poor appetite or fatigue",
      "Post-infection or post-medication recovery",
      "Farms wanting a routine liver-support tonic"
    ],
    "rating": 4.4,
    "rating_count": 21,
    "is_featured": false,
    "is_active": true,
    "order": 2,
    "translations": [
      "or",
      "hi"
    ]
  },
  {
    "id": 3,
    "name": "Pachak Tatwa",
    "slug": "pachak-tatwa",
    "category": "Health",
    "size": "200 ml",
    "sku": null,
    "price": 172,
    "stock_quantity": 64,
    "description": "Potent Ayurvedic digestive tonic that stimulates appetite and gut health.",
    "long_description": "Pachak Tatwa is a potent Ayurvedic formulation designed to improve digestion and appetite in livestock. It enhances the functioning of the gastrointestinal system by stimulating the secretion of proteolytic, amylolytic, and lipolytic enzymes. This action supports gut health, nutrient absorption, and overall well-being in animals.",
    "image": "/products/pachak-tatwa/1.jpg",
    "images": [
      "/products/pachak-tatwa/1.jpg",
      "/products/pachak-tatwa/2.jpg",
      "/products/pachak-tatwa/3.jpg",
      "/products/pachak-tatwa/4.jpg"
    ],
    "highlights": [
      "Promotes healthy digestion and nutrient assimilation",
      "Relieves indigestion, bloating, gas and GI discomfort",
      "Stimulates appetite in animals with anorexia or reduced feed intake",
      "Helps balance rumen pH and promotes gut microflora",
      "Acts as a mild carminative, digestive stimulant and tonic",
      "Enhances overall digestive wellness for improved energy and health"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Syrup"
      },
      {
        "label": "Packaging Type",
        "value": "Bottle"
      },
      {
        "label": "Grade Standard",
        "value": "Ayurvedic Proprietary Medicine"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Digestive Tonic"
      },
      {
        "label": "Packaging",
        "value": "200 ml"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Goats & Sheep — Kids: 5 ml/day for 3 days; Adults: 10 ml/day for 3 days.\nCattle — Calves: 10 ml/day for 3 days; Adults: 20 ml/day for 3 days.",
    "storage_instructions": "Store in a cool, dry place away from direct sunlight.",
    "ingredients": "Composition (per 10 ml): Amla 300 mg, Nagarmotha (Nutgrass) 295 mg, Harad (Chebulic Myrobalan) 250 mg, Baheda (Beleric Myrobalan) 255 mg, Chavya (Java Long Pepper) 155 mg, Sonth (Dry Ginger) 100 mg, Chitrakmool (Leadwort Root) 95 mg, Kala Namak (Black Salt) 90 mg, Dhaniya (Coriander) 95 mg, Peepalimool (Long Pepper Root) 55 mg, Dalchini (Cinnamon) 55 mg, Jeera (Cumin) 50 mg, Peepali (Long Pepper) 20 mg, Kali Mirch (Black Pepper) 35 mg, Hing (Asafoetida) 5 mg, Sendha Namak (Rock Salt) 100 mg.",
    "recommended_for": [
      "Animals with reduced appetite or indigestion",
      "Livestock recovering from illness or medication",
      "After transportation, diet changes or heat stress"
    ],
    "rating": 4.5,
    "rating_count": 17,
    "is_featured": false,
    "is_active": true,
    "order": 3,
    "translations": [
      "or"
    ]
  },
  {
    "id": 4,
    "name": "Kurmi Nashak",
    "slug": "kurmi-nashak",
    "category": "Health",
    "size": "Pack of 10",
    "sku": null,
    "price": 150,
    "stock_quantity": 0,
    "description": "Ayurvedic deworming tablets for internal parasite control.",
    "long_description": "Kurmi Nashak is an Ayurvedic deworming formulation designed to eliminate internal parasitic infections in livestock. It effectively targets a wide range of intestinal worms including tapeworms, roundworms, hookworms, and whipworms. Regular deworming not only protects animals from parasite-induced diseases but also improves digestion, nutrient uptake, and productivity. The formulation is safe, natural, and also helps reduce the risk of parasite transmission to humans handling the animals.",
    "image": "/products/kurmi-nashak/1.jpg",
    "images": [
      "/products/kurmi-nashak/1.jpg",
      "/products/kurmi-nashak/2.jpg",
      "/products/kurmi-nashak/3.jpg",
      "/products/kurmi-nashak/4.jpg"
    ],
    "highlights": [
      "Eliminates internal parasites such as roundworms, tapeworms and liver flukes",
      "Promotes better digestion and nutrient absorption",
      "Improves growth rate, weight gain and general well-being",
      "Enhances immune function and reduces disease risk",
      "Supports improved milk yield and meat production",
      "Contributes to biosecurity by minimizing zoonotic parasite transmission"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Tablet"
      },
      {
        "label": "Packaging Type",
        "value": "Strip"
      },
      {
        "label": "Grade Standard",
        "value": "Ayurvedic Deworming Supplement"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Anthelmintic"
      },
      {
        "label": "Packaging",
        "value": "1 Strip of 10 Tablets"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Small Animals (Goats, Sheep, Calves) — Initial deworming: 1 tablet/day for 3 days; Maintenance: 1 tablet monthly.\nLarge Animals (Cattle, Buffalo) — Initial deworming: 2 tablets/day for 3 days; Maintenance: 2 tablets monthly.",
    "storage_instructions": "Store in a cool, dry place away from children and direct sunlight.",
    "ingredients": "Composition (per tablet): Haridra (Curcuma longa) 500 mg, Chiraita (Swertia chirata) 500 mg, Maricha (Piper nigrum / Black Pepper) 500 mg, Vidanga (Embelia ribes) 500 mg, Katira (Astragalus gummifer) 500 mg.",
    "recommended_for": [
      "Routine quarterly deworming schedules",
      "Post-purchase or quarantine periods",
      "Herds showing signs of parasite load (poor coat, weight loss)"
    ],
    "rating": 4.3,
    "rating_count": 26,
    "is_featured": false,
    "is_active": true,
    "order": 4,
    "translations": [
      "or",
      "hi"
    ]
  },
  {
    "id": 5,
    "name": "Tickclear Soap",
    "slug": "tickclear-soap",
    "category": "Health",
    "size": "125 gm",
    "sku": null,
    "price": 130,
    "stock_quantity": 35,
    "description": "Medicated soap that protects livestock from ticks, lice, mites and other external parasites.",
    "long_description": "Manikstu TickClear Soap protects livestock from ticks, lice, mites, and other external parasites. It combines insecticidal Permethrin to quickly paralyze and eliminate pests, with antibacterial Cetrimide to prevent secondary skin infections caused by scratching. Regular use relieves severe irritation, maintains essential hygiene, and ensures a clean, healthy coat.",
    "image": "/products/tickclear-soap/1.jpg",
    "images": [
      "/products/tickclear-soap/1.jpg",
      "/products/tickclear-soap/2.jpg",
      "/products/tickclear-soap/3.jpg"
    ],
    "highlights": [
      "Helps eliminate ticks, lice, mites and other external parasites from the animal's skin",
      "Provides quick relief from itching, irritation and skin discomfort",
      "Helps prevent secondary bacterial infections from scratching or lesions",
      "Supports healthy skin hygiene and coat condition",
      "Reduces the risk of parasite-related skin diseases",
      "Maintains comfort and wellbeing, improving productivity",
      "Suitable for regular use in parasite-prone environments such as farms and sheds"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Soap Bar"
      },
      {
        "label": "Packaging Type",
        "value": "Wrapper"
      },
      {
        "label": "Grade Standard",
        "value": "Veterinary Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "External Parasite Control"
      },
      {
        "label": "Packaging",
        "value": "A Block of 75 gm"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Wet the animal, lather the soap over affected areas, and let the foam sit for a few minutes before rinsing thoroughly. Repeat as needed or as directed by a veterinarian for effective parasite control.",
    "storage_instructions": "Store in a cool, dry place away from direct sunlight and out of reach of children.",
    "ingredients": "Permethrin (insecticidal actives) with Cetrimide (antibacterial) in a soap base.",
    "recommended_for": [
      "Herds facing tick, lice or mite infestations",
      "Routine grooming in parasite-prone environments",
      "Support during monsoon and warm months"
    ],
    "rating": 4.2,
    "rating_count": 12,
    "is_featured": false,
    "is_active": true,
    "order": 5,
    "translations": [
      "hi"
    ]
  },
  {
    "id": 6,
    "name": "Fungi Rakshak",
    "slug": "fungi-rakshak",
    "category": "Health",
    "size": "100 gm",
    "sku": null,
    "price": 185,
    "stock_quantity": 22,
    "description": "Natural plant-based antifungal cream for livestock skin health.",
    "long_description": "Fungi Rakshak Cream is a natural, plant-based antifungal formulation designed to effectively manage fungal skin infections in domestic animals. The synergistic action of essential oils provides strong antifungal, antiseptic, and soothing effects, helping restore skin health while preventing secondary infections.",
    "image": "/products/fungi-rakshak/1.jpg",
    "images": [
      "/products/fungi-rakshak/1.jpg",
      "/products/fungi-rakshak/2.jpg",
      "/products/fungi-rakshak/3.jpg",
      "/products/fungi-rakshak/4.jpg"
    ],
    "highlights": [
      "Effectively treats fungal skin infections such as ringworm and dermatitis",
      "Provides antifungal and antimicrobial action, inhibiting fungal growth",
      "Helps relieve itching, redness, irritation and skin inflammation",
      "Promotes faster healing and regeneration of affected skin areas",
      "Prevents secondary bacterial infections due to scratching or lesions",
      "Safe for repeated use and suitable for sensitive animal skin"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Cream"
      },
      {
        "label": "Packaging Type",
        "value": "Container"
      },
      {
        "label": "Grade Standard",
        "value": "Veterinary Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Antifungal Cream"
      },
      {
        "label": "Packaging",
        "value": "A Pack of 100 gm"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Clean the affected area and apply evenly 1-2 times daily until completely healed, or as directed by a veterinarian.",
    "storage_instructions": "Store in a cool, dry place. Keep the container closed after use.",
    "ingredients": "Blend of essential oils and plant extracts with antifungal, antiseptic and soothing properties.",
    "recommended_for": [
      "Animals with ringworm, dermatitis or fungal skin lesions",
      "Recurrent skin infections during monsoon",
      "Supportive care for sensitive-skin animals"
    ],
    "rating": 4.1,
    "rating_count": 9,
    "is_featured": false,
    "is_active": true,
    "order": 6,
    "translations": []
  },
  {
    "id": 7,
    "name": "Multi Mineral Lick Block",
    "slug": "multi-mineral-lick-block",
    "category": "Nutrition",
    "size": "1 kg",
    "sku": null,
    "price": 250,
    "stock_quantity": 90,
    "description": "Natural trace mineral lick block that supports livestock health and performance.",
    "long_description": "The Mineral Block is a natural and practical supplement that provides a range of essential trace minerals required for optimum livestock health and performance. Designed as a free-choice lick, it allows animals to self-regulate their intake based on individual needs. Especially useful in mineral-deficient regions or during physiologically demanding phases like pregnancy, lactation, or heat stress.",
    "image": "/products/multi-mineral-lick-block/1.jpg",
    "images": [
      "/products/multi-mineral-lick-block/1.jpg",
      "/products/multi-mineral-lick-block/2.jpg",
      "/products/multi-mineral-lick-block/3.jpg",
      "/products/multi-mineral-lick-block/4.jpg"
    ],
    "highlights": [
      "Strengthens bones and muscles by replenishing key trace minerals (without added calcium)",
      "Enhances milk production by supporting metabolic function in lactating animals",
      "Fulfils deficiencies of Zinc, Iron, Copper, Manganese, Magnesium, Cobalt, Iodine and Selenium",
      "Boosts immunity and disease resistance via enzymatic and hormonal support",
      "Prevents dehydration and fatigue during heat stress"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Block"
      },
      {
        "label": "Packaging Type",
        "value": "Shrink Wrap"
      },
      {
        "label": "Grade Standard",
        "value": "Feed Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Trace Mineral Supplement"
      },
      {
        "label": "Packaging",
        "value": "1 Block of 1 kg"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Hang the Mineral Block securely in the shed or grazing area using a rope. Animals will lick the block according to their individual mineral requirements.",
    "storage_instructions": "Store in a dry place. Protect from rain and moisture to prevent dissolution.",
    "ingredients": "Core minerals: Zinc (Zn), Iron (Fe), Copper (Cu), Magnesium (Mg), Manganese (Mn), Cobalt (Co), Iodine (I), Selenium (Se).",
    "recommended_for": [
      "Farms in mineral-deficient regions",
      "Pregnant, lactating or growing livestock",
      "Animals under heat stress or transport stress"
    ],
    "rating": 4.7,
    "rating_count": 44,
    "is_featured": true,
    "is_active": true,
    "order": 7,
    "translations": [
      "or",
      "hi"
    ]
  },
  {
    "id": 8,
    "name": "Black Salt Block",
    "slug": "black-salt-block",
    "category": "Nutrition",
    "size": "1 kg",
    "sku": null,
    "price": 250,
    "stock_quantity": 18,
    "description": "Ayurvedic black-salt lick for digestion, electrolyte balance and detox.",
    "long_description": "The Black Salt Block is a natural mineral lick enriched with Ayurvedic digestive and detoxifying properties. Known for its high mineral content and lower sodium levels compared to regular salt, black salt (Kala Namak) supports gastrointestinal health, electrolyte balance, and respiratory comfort in livestock. This block serves as both a digestive aid and a mineral replenisher, especially in hot or stressful conditions.",
    "image": "/products/black-salt-block/1.jpg",
    "images": [
      "/products/black-salt-block/1.jpg",
      "/products/black-salt-block/2.jpg",
      "/products/black-salt-block/3.jpg",
      "/products/black-salt-block/4.jpg"
    ],
    "highlights": [
      "Aids digestion and relieves bloating, gas and acidity",
      "Acts as a natural laxative supporting bowel regularity",
      "Helps balance electrolytes, reducing muscle cramps, fatigue and dehydration",
      "Offers cooling and detoxifying effects (Ayurvedic principles)",
      "May assist in managing blood pressure via lower sodium content",
      "Traditionally used to relieve constipation, flatulence and respiratory issues"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Block"
      },
      {
        "label": "Packaging Type",
        "value": "Shrink Wrap"
      },
      {
        "label": "Grade Standard",
        "value": "Feed Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Digestive & Electrolyte Supplement"
      },
      {
        "label": "Packaging",
        "value": "1 Block of 1 kg"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Hang the Black Salt Block securely in the shed or resting area using a rope. Livestock will lick the block as needed, especially when experiencing digestive discomfort or salt cravings.",
    "storage_instructions": "Store in a dry place. Protect from rain and moisture.",
    "ingredients": "Ayurvedic black salt (Kala Namak) with natural minerals.",
    "recommended_for": [
      "Herds with digestive discomfort or bloating",
      "Animals under heat stress",
      "Routine digestive and electrolyte support"
    ],
    "rating": 4.3,
    "rating_count": 15,
    "is_featured": false,
    "is_active": true,
    "order": 8,
    "translations": [
      "or"
    ]
  },
  {
    "id": 9,
    "name": "Sulphur Block",
    "slug": "sulphur-block",
    "category": "Nutrition",
    "size": "1 kg",
    "sku": null,
    "price": 220,
    "stock_quantity": 40,
    "description": "Sulphur-rich lick block for skin, metabolism and detoxification support.",
    "long_description": "The Sulphur Block is a natural sulphur-rich lick designed to support various metabolic, dermatological, and digestive functions in livestock. Sulphur is essential for amino acid, vitamin, and enzyme formation. Free-choice licking delivers sulphur in a controlled, safe manner, contributing to improved skin condition, disease resistance, and overall productivity.",
    "image": "/products/sulphur-block/1.jpg",
    "images": [
      "/products/sulphur-block/1.jpg",
      "/products/sulphur-block/2.jpg",
      "/products/sulphur-block/3.jpg",
      "/products/sulphur-block/4.jpg"
    ],
    "highlights": [
      "Skin, coat & parasite defense — builds resilient skin and a healthy, shiny coat",
      "Hoof & joint durability — hardens hooves and improves joint flexibility",
      "Optimized digestion — boosts rumen microbial activity and feed conversion",
      "Immunity & detoxification — strengthens cellular defenses and liver function",
      "Metabolic & nervous system health — drives biotin and thiamine production",
      "Tissue repair & growth — fuels amino acid & enzyme synthesis for healing"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Block"
      },
      {
        "label": "Packaging Type",
        "value": "Shrink Wrap"
      },
      {
        "label": "Grade Standard",
        "value": "Feed Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Sulphur Supplement"
      },
      {
        "label": "Packaging",
        "value": "1 Block of 1 kg"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Hang the Sulphur Block in the livestock shed or near the feeding area using a rope. Animals will lick as needed based on their individual sulphur requirements.",
    "storage_instructions": "Store in a dry place. Protect from rain and moisture.",
    "ingredients": "Elemental sulphur with supporting minerals.",
    "recommended_for": [
      "Animals with dull coats, skin issues or slow growth",
      "Working livestock and dairy animals",
      "Herds needing metabolic and detox support"
    ],
    "rating": 4,
    "rating_count": 8,
    "is_featured": false,
    "is_active": true,
    "order": 9,
    "translations": []
  },
  {
    "id": 10,
    "name": "Calcium Block",
    "slug": "calcium-block",
    "category": "Nutrition",
    "size": "1 kg",
    "sku": null,
    "price": 250,
    "stock_quantity": 55,
    "description": "Pure plant-derived calcium block for daily livestock calcium needs.",
    "long_description": "The Calcium Block is a pure, plant-derived supplement designed to meet the daily calcium needs of livestock. Highly beneficial for young, pregnant, lactating, and high-producing animals, it offers a stress-free way to prevent deficiency through self-licking. Free from animal residues, it ensures safety while supporting strong bones, optimal muscle function, and improved productivity.",
    "image": "/products/calcium-block/1.jpg",
    "images": [
      "/products/calcium-block/1.jpg",
      "/products/calcium-block/2.jpg",
      "/products/calcium-block/3.jpg",
      "/products/calcium-block/4.jpg"
    ],
    "highlights": [
      "Bone & skeletal strength — dense, strong bones and teeth at every growth stage",
      "Deficiency prevention — protects against milk fever, rickets and osteomalacia",
      "Increased dairy yield — optimises calcium metabolism for milk quality and volume",
      "Vital system support — healthy heart, muscle, nerve and enzyme functions",
      "Reproductive health — safe reproduction and fewer post-partum complications",
      "Stress & recovery aid — accelerates recovery during high-stress periods"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Block"
      },
      {
        "label": "Packaging Type",
        "value": "Shrink Wrap"
      },
      {
        "label": "Grade Standard",
        "value": "Feed Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Calcium Supplement"
      },
      {
        "label": "Packaging",
        "value": "1 Block of 1 kg"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Hang the block using a rope inside the livestock shed or feeding area. Animals will lick the block voluntarily based on their calcium needs.",
    "storage_instructions": "Store in a dry place. Protect from rain and moisture.",
    "ingredients": "Plant-derived calcium sources with essential trace mineral support.",
    "recommended_for": [
      "High-yielding lactating dairy animals",
      "Late-pregnancy females — prevents milk fever",
      "Growing kids and calves with weak bones"
    ],
    "rating": 4.5,
    "rating_count": 19,
    "is_featured": false,
    "is_active": true,
    "order": 10,
    "translations": [
      "or",
      "hi"
    ]
  },
  {
    "id": 11,
    "name": "Pink Salt Block",
    "slug": "pink-salt-block",
    "category": "Nutrition",
    "size": "1 kg",
    "sku": null,
    "price": 275,
    "stock_quantity": 7,
    "description": "Natural pink-salt lick rich in essential trace minerals and electrolytes.",
    "long_description": "The Pink Salt Block is a natural mineral lick made from high-quality pink salt, rich in essential trace minerals required for maintaining electrolyte balance and overall health in livestock. It supports daily mineral intake through free-choice licking, especially beneficial in hot climates and mineral-deficient feeding systems.",
    "image": "/products/pink-salt-block/1.jpg",
    "images": [
      "/products/pink-salt-block/1.jpg",
      "/products/pink-salt-block/2.jpg",
      "/products/pink-salt-block/3.jpg",
      "/products/pink-salt-block/4.jpg"
    ],
    "highlights": [
      "Helps maintain electrolyte balance and prevents salt deficiency",
      "Supports proper nerve and muscle function, reducing weakness and fatigue",
      "Improves hydration levels — especially during heat stress",
      "Enhances feed intake and digestion by stimulating appetite",
      "Supports metabolic activities and overall vitality",
      "Helps reduce stress-related issues in working and grazing animals"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Block"
      },
      {
        "label": "Packaging Type",
        "value": "Shrink Wrap"
      },
      {
        "label": "Grade Standard",
        "value": "Feed Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Mineral & Electrolyte Supplement"
      },
      {
        "label": "Packaging",
        "value": "1 Block of 1 kg"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Hang the Pink Salt Block securely in the shed or grazing area using a rope. Animals will lick the block according to their individual mineral requirements.",
    "storage_instructions": "Store in a dry place. Protect from rain and moisture.",
    "ingredients": "High-quality Himalayan pink salt with natural trace minerals.",
    "recommended_for": [
      "Farms in hot or arid climates",
      "Working and grazing animals",
      "Herds needing daily electrolyte support"
    ],
    "rating": 4.4,
    "rating_count": 11,
    "is_featured": false,
    "is_active": true,
    "order": 11,
    "translations": [
      "or"
    ]
  },
  {
    "id": 12,
    "name": "Protein Block",
    "slug": "protein-block",
    "category": "Nutrition",
    "size": "1 kg",
    "sku": null,
    "price": 275,
    "stock_quantity": 72,
    "description": "Nutritional lick block that supplements essential protein for growth and milk production.",
    "long_description": "Protein Block is a nutritional lick block that supplements the essential protein required for livestock growth and productivity. It actively supports body development, muscle formation, and milk production. By instinctively licking the block, animals fulfill their specific nutritional needs and maintain a proper protein balance in their diet.",
    "image": "/products/protein-block/1.jpg",
    "images": [
      "/products/protein-block/1.jpg",
      "/products/protein-block/2.jpg",
      "/products/protein-block/3.jpg",
      "/products/protein-block/4.jpg"
    ],
    "highlights": [
      "Provides essential protein for muscle repair and body growth",
      "Enhances milk production and milk quality in dairy animals",
      "Improves feed utilization and boosts digestion efficiency",
      "Promotes faster growth and healthy weight gain in young animals",
      "Supports optimal reproductive performance and fertility",
      "Boosts overall strength, stamina and productivity"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Block"
      },
      {
        "label": "Packaging Type",
        "value": "Shrink Wrap"
      },
      {
        "label": "Grade Standard",
        "value": "Feed Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Protein Supplement"
      },
      {
        "label": "Packaging",
        "value": "1 Block of 1 kg"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Hang the Protein Block in the animal shed using a rope. Animals will naturally lick the block according to their nutritional requirements.",
    "storage_instructions": "Store in a dry place. Protect from rain and moisture.",
    "ingredients": "Balanced non-protein nitrogen sources and mineral fortification.",
    "recommended_for": [
      "Growing kids, calves and lambs",
      "High-yielding dairy animals",
      "Breeding bucks and cows during peak stages"
    ],
    "rating": 4.6,
    "rating_count": 33,
    "is_featured": true,
    "is_active": true,
    "order": 12,
    "translations": [
      "or",
      "hi"
    ]
  },
  {
    "id": 13,
    "name": "Cobalt Block",
    "slug": "cobalt-block",
    "category": "Nutrition",
    "size": "1 kg",
    "sku": null,
    "price": 275,
    "stock_quantity": 30,
    "description": "Cobalt-rich lick block for rumen Vitamin B12 synthesis and energy metabolism.",
    "long_description": "Cobalt Block is a mineral lick block formulated to supply cobalt, an essential trace mineral required for proper rumen function in ruminant animals. Cobalt plays a crucial role in the production of Vitamin B12 by rumen microbes, which is necessary for energy metabolism, red blood cell formation, and overall animal health. Regular access to cobalt helps maintain optimal growth, productivity, and metabolic efficiency in livestock.",
    "image": "/products/cobalt-block/1.jpg",
    "images": [
      "/products/cobalt-block/1.jpg",
      "/products/cobalt-block/2.jpg",
      "/products/cobalt-block/3.jpg",
      "/products/cobalt-block/4.jpg"
    ],
    "highlights": [
      "Supports Vitamin B12 synthesis in the rumen for optimal energy metabolism",
      "Prevents cobalt deficiency symptoms like anemia, poor growth and loss of appetite",
      "Promotes better growth and healthy weight gain, especially in young animals",
      "Enhances appetite, feed utilization and healthy rumen microbial activity",
      "Improves overall vitality, strength and stamina",
      "Contributes to higher productivity and yields in both milk and meat animals"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Block"
      },
      {
        "label": "Packaging Type",
        "value": "Shrink Wrap"
      },
      {
        "label": "Grade Standard",
        "value": "Feed Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Trace Mineral Supplement"
      },
      {
        "label": "Packaging",
        "value": "1 Block of 1 kg"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Hang the Cobalt Block in the shed using a rope. Animals will naturally lick the block as per their mineral requirement.",
    "storage_instructions": "Store in a dry place. Protect from rain and moisture.",
    "ingredients": "Elemental cobalt with supporting trace mineral fortification.",
    "recommended_for": [
      "Ruminants showing signs of B12 deficiency",
      "Young stock with slow growth",
      "Herds needing energy and appetite support"
    ],
    "rating": 4.2,
    "rating_count": 7,
    "is_featured": false,
    "is_active": true,
    "order": 13,
    "translations": []
  },
  {
    "id": 14,
    "name": "Super Supplement Block",
    "slug": "super-supplement-block",
    "category": "Nutrition",
    "size": "1 kg",
    "sku": null,
    "price": 250,
    "stock_quantity": 26,
    "description": "Premium multi-nutrient lick block for balanced daily supplementation.",
    "long_description": "Super Supplement Block is a premium multi-nutrient lick block specially formulated to provide a balanced combination of essential minerals and nutrients required for optimum livestock health and productivity. It helps bridge nutritional gaps in the regular diet and supports overall growth, reproduction, immunity, and milk production. Animals naturally consume the block according to their nutritional requirements.",
    "image": "/products/super-supplement-block/1.jpg",
    "images": [
      "/products/super-supplement-block/1.jpg",
      "/products/super-supplement-block/2.jpg",
      "/products/super-supplement-block/3.jpg",
      "/products/super-supplement-block/4.jpg"
    ],
    "highlights": [
      "Provides essential minerals to support health and prevent deficiency disorders",
      "Improves overall growth, strength, body condition and long-term productivity",
      "Supports higher milk production and better milk quality",
      "Enhances natural immunity and disease resistance",
      "Improves feed utilization and overall metabolic efficiency",
      "Supports optimal fertility and reproductive performance"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Block"
      },
      {
        "label": "Packaging Type",
        "value": "Shrink Wrap"
      },
      {
        "label": "Grade Standard",
        "value": "Feed Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Premium Multi-Nutrient Supplement"
      },
      {
        "label": "Packaging",
        "value": "1 Block of 1 kg"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Hang the Super Supplement Block in the shed using a rope. Animals will naturally lick the block according to their nutritional needs.",
    "storage_instructions": "Store in a dry place. Protect from rain and moisture.",
    "ingredients": "Balanced combination of macro and trace minerals, vitamins and nutrients.",
    "recommended_for": [
      "Farms wanting an all-round mineral & nutrition solution",
      "Dairy and breeding herds",
      "Livestock recovering from stress or deficiency"
    ],
    "rating": 4.5,
    "rating_count": 14,
    "is_featured": false,
    "is_active": true,
    "order": 14,
    "translations": [
      "or"
    ]
  },
  {
    "id": 15,
    "name": "Hydracharge",
    "slug": "hydracharge",
    "category": "Health",
    "size": "20 gm",
    "sku": null,
    "price": null,
    "stock_quantity": 0,
    "description": "Advanced Oral Rehydration Solution (ORS) that quickly restores fluid and electrolyte balance.",
    "long_description": "HydraCharge is an advanced Oral Rehydration Solution (ORS) that rapidly replenishes lost fluids, essential electrolytes, and energy in livestock. Designed to combat heat stress, dehydration, illness, transportation, or post-treatment recovery, this instant formula quickly restores fluid balance, helping animals recover faster and maintain optimal metabolic function during high-stress conditions.",
    "image": "/products/hydracharge/1.jpg",
    "images": [
      "/products/hydracharge/1.jpg",
      "/products/hydracharge/2.jpg",
      "/products/hydracharge/3.jpg",
      "/products/hydracharge/4.jpg"
    ],
    "highlights": [
      "Rapid rehydration to combat dehydration, heat stress and environmental challenges",
      "Restores essential electrolyte balance lost via sweating, diarrhea or illness",
      "Supports faster recovery during weakness, stress and post-treatment phases",
      "Improves overall energy levels, stamina and daily activity",
      "Encourages better feed intake and rapid appetite recovery",
      "Ideal for high-stress situations like transportation, vaccination and extreme weather"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Powder"
      },
      {
        "label": "Packaging Type",
        "value": "Sachet"
      },
      {
        "label": "Grade Standard",
        "value": "Veterinary Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Electrolyte & Rehydration Supplement"
      },
      {
        "label": "Packaging",
        "value": "A Sachet of 20 gm"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Dissolve one 20 g sachet of HydraCharge in 1 litre of clean drinking water and offer it to animals. Prepare fresh solution daily for best results.",
    "storage_instructions": "Keep the sachet sealed. Store in a cool, dry place away from direct sunlight.",
    "ingredients": "Electrolyte blend (sodium, potassium, chloride) with dextrose and supportive nutrients.",
    "recommended_for": [
      "Herds facing heat stress or dehydration",
      "Recovery after diarrhea, illness or vaccination",
      "During transportation or intensive work"
    ],
    "rating": null,
    "rating_count": 0,
    "is_featured": false,
    "is_active": true,
    "order": 15,
    "translations": []
  },
  {
    "id": 16,
    "name": "Goat Feed",
    "slug": "goat-feed",
    "category": "Nutrition",
    "size": "10 kg",
    "sku": null,
    "price": null,
    "stock_quantity": 14,
    "description": "Complete pelleted feed that supports growth, milk yield and overall goat productivity.",
    "long_description": "Goat Feed is a nutritionally complete, pelleted feed formulation designed to support the growth, health, and productivity of goats and sheep. Rich in protein, fat, vitamins, and essential minerals, it delivers balanced daily nutrition that enhances weight gain, milk yield, reproductive function, and overall vitality. The pellet form reduces wastage and improves digestibility.",
    "image": "/products/goat-feed/1.jpg",
    "images": [
      "/products/goat-feed/1.jpg",
      "/products/goat-feed/2.jpg",
      "/products/goat-feed/3.jpg",
      "/products/goat-feed/4.jpg"
    ],
    "highlights": [
      "High protein, fat and vitamin feed supplement for overall growth",
      "Aids proper development of kids into stronger, healthier goats",
      "Supports better milk production in lactating females",
      "Enhances body condition and sturdiness in male bucks",
      "Vitamins A, D3 and E support health, immunity and reproduction",
      "Minerals help maintain fertility and metabolic performance",
      "Pellet form reduces wastage and improves digestibility"
    ],
    "specifications": [
      {
        "label": "Form",
        "value": "Pellet"
      },
      {
        "label": "Packaging Type",
        "value": "Bag"
      },
      {
        "label": "Grade Standard",
        "value": "Feed Grade"
      },
      {
        "label": "Shelf Life",
        "value": ""
      },
      {
        "label": "Type Of Supplement",
        "value": "Complete Feed"
      },
      {
        "label": "Packaging",
        "value": "1 Pack of 10 kg"
      },
      {
        "label": "Country of Origin",
        "value": "Made in India"
      }
    ],
    "usage_instructions": "Goats and Sheep — Kids: 100 gram/day; Large Animals: 200 gram/day.\nCattle — Calves: 200 gram/day; Large Animals: 400 gram/day.",
    "storage_instructions": "Store in a cool, dry place away from direct sunlight. Reseal the bag after every use. Keep out of reach of children.",
    "ingredients": "DORB, Food Byproducts & Rice Bran (20%); Maize / Broken Rice (25%); DDGS (15%); Mustard / Groundnut / Soya DOC (15%); Molasses (5%); Calcium & Salt (2%); Vitamin & Mineral Mix (1%); Urea (2%); Wheat Bran / Fillers (15%).",
    "recommended_for": [
      "Growing kids and lambs",
      "Lactating females needing higher nutrient density",
      "Farms with limited access to quality green fodder"
    ],
    "rating": 4.8,
    "rating_count": 52,
    "is_featured": true,
    "is_active": true,
    "order": 16,
    "translations": [
      "or",
      "hi"
    ]
  }
];
