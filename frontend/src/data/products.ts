export interface Product {
  barcode: string
  name: string
  brand: string
  category: string
  imageEmoji: string
  ingredients: string[]
  allergens: string[]
  safetyScore: number          // 0–100
  warnings: string[]
  certifications: string[]
  servingSize: string
  calories: number
  nutritionHighlights: { label: string; value: string }[]
}

export const PRODUCTS: Product[] = [
  {
    barcode: '8901030894316',
    name: 'Maggi 2-Minute Noodles Masala',
    brand: 'Nestlé',
    category: 'Instant Food',
    imageEmoji: '🍜',
    ingredients: [
      'Wheat flour', 'Palm oil', 'Salt', 'Edible starch',
      'Spices & condiments', 'Onion powder', 'Garlic powder',
      'Hydrolysed groundnut protein', 'Acidity regulator (330)',
    ],
    allergens: ['Gluten (Wheat)', 'Groundnut'],
    safetyScore: 48,
    warnings: [
      'High sodium content (1,200 mg per serving)',
      'Contains trans fats from palm oil',
      'Contains MSG-like flavour enhancers',
    ],
    certifications: ['FSSAI Approved'],
    servingSize: '70 g (1 cake + tastemaker)',
    calories: 312,
    nutritionHighlights: [
      { label: 'Total Fat', value: '12 g' },
      { label: 'Sodium', value: '1,200 mg' },
      { label: 'Carbohydrates', value: '44 g' },
      { label: 'Protein', value: '8 g' },
    ],
  },
  {
    barcode: '8906002570084',
    name: 'Amul Butter Unsalted',
    brand: 'Amul',
    category: 'Dairy',
    imageEmoji: '🧈',
    ingredients: [
      'Pasteurised Cream (from Cow Milk)',
      'Common Salt (in salted variant)',
    ],
    allergens: ['Milk'],
    safetyScore: 72,
    warnings: [
      'High saturated fat — limit intake if managing cholesterol',
    ],
    certifications: ['FSSAI Approved', 'ISO 9001'],
    servingSize: '10 g',
    calories: 74,
    nutritionHighlights: [
      { label: 'Total Fat', value: '8.3 g' },
      { label: 'Saturated Fat', value: '5.4 g' },
      { label: 'Cholesterol', value: '24 mg' },
      { label: 'Protein', value: '0.1 g' },
    ],
  },
  {
    barcode: '8901063150683',
    name: 'Lay\'s Classic Salted Chips',
    brand: 'PepsiCo / Lay\'s',
    category: 'Snacks',
    imageEmoji: '🥔',
    ingredients: [
      'Potatoes', 'Edible Vegetable Oil', 'Salt', 'Spice & Condiment',
    ],
    allergens: ['None declared'],
    safetyScore: 55,
    warnings: [
      'High sodium (380 mg per 26 g serving)',
      'Deep-fried — high caloric density',
      'Acrylamide risk at high frying temperatures',
    ],
    certifications: ['FSSAI Approved', 'Vegan'],
    servingSize: '26 g',
    calories: 130,
    nutritionHighlights: [
      { label: 'Total Fat', value: '8 g' },
      { label: 'Sodium', value: '380 mg' },
      { label: 'Carbohydrates', value: '14 g' },
      { label: 'Protein', value: '1.7 g' },
    ],
  },
  {
    barcode: '8901058856718',
    name: 'Dabur Honey Pure',
    brand: 'Dabur',
    category: 'Natural Sweetener',
    imageEmoji: '🍯',
    ingredients: ['100% Pure Honey'],
    allergens: ['None declared'],
    safetyScore: 85,
    warnings: [
      'Not suitable for infants under 12 months',
      'High natural sugar — diabetics should use in moderation',
    ],
    certifications: ['FSSAI Approved', 'Non-GMO'],
    servingSize: '15 g (1 tbsp)',
    calories: 47,
    nutritionHighlights: [
      { label: 'Total Fat', value: '0 g' },
      { label: 'Sugars', value: '12.6 g' },
      { label: 'Carbohydrates', value: '12.8 g' },
      { label: 'Protein', value: '0.06 g' },
    ],
  },
  {
    barcode: '4006381333931',
    name: 'Nivea Soft Moisturising Cream',
    brand: 'Nivea / Beiersdorf',
    category: 'Skincare',
    imageEmoji: '🧴',
    ingredients: [
      'Water', 'Mineral Oil', 'Glycerin', 'Isopropyl Palmitate',
      'Glyceryl Stearate', 'Microcrystalline Wax', 'Panthenol',
      'Fragrance', 'Tocopheryl Acetate', 'Carbomer', 'Sodium Hydroxide',
    ],
    allergens: ['Fragrance (potential sensitiser)'],
    safetyScore: 63,
    warnings: [
      'Contains mineral oil — potential comedogenic for oily skin',
      'Fragrance may cause reactions in sensitive skin',
      'Carbomer processed with benzene (trace residue possible)',
    ],
    certifications: ['Dermatologically Tested'],
    servingSize: 'N/A (topical)',
    calories: 0,
    nutritionHighlights: [],
  },
  {
    barcode: '8901207003233',
    name: 'Bournvita Health Drink',
    brand: 'Cadbury / Mondelēz',
    category: 'Health Drink',
    imageEmoji: '🥛',
    ingredients: [
      'Sugar', 'Malt extract', 'Cocoa solids', 'Milk solids',
      'Vitamins (B1, B2, B6, B12, C, D)', 'Minerals (Iron, Calcium)',
      'Caramel (E150c)', 'Salt',
    ],
    allergens: ['Milk', 'Gluten (Barley Malt)'],
    safetyScore: 42,
    warnings: [
      'Sugar is the first listed ingredient — very high sugar content',
      'Caramel colour E150c linked to carcinogens in some studies',
      'Marketing as a health drink is misleading — high glycaemic',
    ],
    certifications: ['FSSAI Approved'],
    servingSize: '20 g in 200 ml milk',
    calories: 78,
    nutritionHighlights: [
      { label: 'Sugars', value: '10.4 g' },
      { label: 'Carbohydrates', value: '16 g' },
      { label: 'Protein', value: '1.2 g' },
      { label: 'Calcium', value: '54 mg' },
    ],
  },
  {
    barcode: '8901396026000',
    name: 'Tata Salt Iodised',
    brand: 'Tata Consumer',
    category: 'Condiment',
    imageEmoji: '🧂',
    ingredients: ['Iodised Salt', 'Anticaking agent (554)'],
    allergens: ['None declared'],
    safetyScore: 78,
    warnings: [
      'Sodium aluminosilicate (E554) used as anticaking — avoid excess',
      'Excessive sodium linked to hypertension',
    ],
    certifications: ['FSSAI Approved', 'ISO 22000'],
    servingSize: '1 g',
    calories: 0,
    nutritionHighlights: [
      { label: 'Sodium', value: '390 mg' },
      { label: 'Iodine', value: '30 mcg' },
    ],
  },
  {
    barcode: '8906007397018',
    name: 'Paper Boat Aamras',
    brand: 'Hector Beverages',
    category: 'Beverage',
    imageEmoji: '🥭',
    ingredients: [
      'Mango pulp (45%)', 'Water', 'Sugar', 'Acidity regulator (330)',
      'Preservative (211)', 'Spices',
    ],
    allergens: ['None declared'],
    safetyScore: 60,
    warnings: [
      'Sodium benzoate (E211) may form benzene when combined with Vitamin C',
      'Added sugar alongside fruit pulp',
    ],
    certifications: ['FSSAI Approved', 'No Artificial Flavour'],
    servingSize: '200 ml',
    calories: 100,
    nutritionHighlights: [
      { label: 'Total Fat', value: '0 g' },
      { label: 'Sugars', value: '22 g' },
      { label: 'Carbohydrates', value: '24 g' },
      { label: 'Vitamin C', value: '12 mg' },
    ],
  },
  {
    barcode: '5000119314022',
    name: 'Cadbury Dairy Milk (36 g)',
    brand: 'Cadbury / Mondelēz',
    category: 'Chocolate',
    imageEmoji: '🍫',
    ingredients: [
      'Sugar', 'Milk solids', 'Cocoa butter', 'Cocoa mass',
      'Emulsifier (E442, E476)', 'Artificial flavouring (Vanillin)',
    ],
    allergens: ['Milk', 'Soya (E442)'],
    safetyScore: 50,
    warnings: [
      'High sugar content',
      'Emulsifier E476 (PGPR) is debated for gut impact',
      'Low cocoa content (below 30%) — not dark chocolate',
    ],
    certifications: ['Rainforest Alliance Cocoa'],
    servingSize: '36 g (1 bar)',
    calories: 190,
    nutritionHighlights: [
      { label: 'Total Fat', value: '10.8 g' },
      { label: 'Sugars', value: '22 g' },
      { label: 'Carbohydrates', value: '23 g' },
      { label: 'Protein', value: '3 g' },
    ],
  },
  {
    barcode: '8901764001017',
    name: 'Patanjali Cow Ghee',
    brand: 'Patanjali',
    category: 'Dairy Fat',
    imageEmoji: '🫙',
    ingredients: ['Pure Cow Milk Fat'],
    allergens: ['Milk'],
    safetyScore: 82,
    warnings: [
      'Very high saturated fat — limit if managing cardiovascular health',
    ],
    certifications: ['FSSAI Approved', 'Organic India Certified'],
    servingSize: '10 g (1 tsp)',
    calories: 90,
    nutritionHighlights: [
      { label: 'Total Fat', value: '10 g' },
      { label: 'Saturated Fat', value: '6.3 g' },
      { label: 'Cholesterol', value: '28 mg' },
      { label: 'Protein', value: '0 g' },
    ],
  },
  {
    barcode: '8906005350012',
    name: 'Fortune Sunflower Oil',
    brand: 'Adani Wilmar',
    category: 'Cooking Oil',
    imageEmoji: '🌻',
    ingredients: ['Refined Sunflower Oil', 'Antioxidant (319)'],
    allergens: ['None declared'],
    safetyScore: 68,
    warnings: [
      'TBHQ (E319) — synthetic antioxidant, restricted in some countries',
      'High in Omega-6 — may contribute to inflammation if overused',
    ],
    certifications: ['FSSAI Approved', 'Cholesterol Free'],
    servingSize: '10 ml',
    calories: 88,
    nutritionHighlights: [
      { label: 'Total Fat', value: '10 g' },
      { label: 'Saturated Fat', value: '1.1 g' },
      { label: 'Omega-6', value: '6.5 g' },
      { label: 'Vitamin E', value: '5 mg' },
    ],
  },
  {
    barcode: '8902102000014',
    name: 'Organic India Tulsi Green Tea',
    brand: 'Organic India',
    category: 'Tea / Beverage',
    imageEmoji: '🍵',
    ingredients: [
      'Organic Green Tea (Camellia sinensis)',
      'Organic Tulsi (Ocimum sanctum)',
    ],
    allergens: ['None declared'],
    safetyScore: 95,
    warnings: [
      'Contains caffeine — avoid late evenings',
      'Avoid in large quantities during pregnancy',
    ],
    certifications: ['Certified Organic', 'USDA Organic', 'Vegan', 'Non-GMO'],
    servingSize: '1 tea bag / 200 ml',
    calories: 2,
    nutritionHighlights: [
      { label: 'Caffeine', value: '~25 mg' },
      { label: 'Antioxidants', value: 'High (EGCG)' },
      { label: 'Total Fat', value: '0 g' },
      { label: 'Sugars', value: '0 g' },
    ],
  },
]

/** Look up a product by its barcode string. Returns undefined if not found. */
export function findByBarcode(barcode: string): Product | undefined {
  return PRODUCTS.find(p => p.barcode === barcode.trim())
}

/** Colour category for a safety score */
export function safetyColour(score: number): 'green' | 'amber' | 'red' {
  if (score >= 75) return 'green'
  if (score >= 50) return 'amber'
  return 'red'
}
