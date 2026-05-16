/**
 * Etuna Restaurant menu catalog (canonical).
 * Source: property menu document (January 2025). Used by seed script and Sofia knowledge.
 * Location: lib/data/etuna-restaurant-menu-catalog.ts
 */

import { restaurantMenuHoursBlurb } from '@/lib/dining/restaurant-hours';

export type MenuCatalogItem = {
  categoryName: string;
  name: string;
  description: string;
  price: string;
  /** Stock-keeping unit for inventory_items (one menu line = one SKU). */
  inventorySku?: string;
};

export const ETUNA_MENU_CATEGORIES = [
  { name: 'Light Meal', description: 'Breakfast, salads, and light bites', displayOrder: 1 },
  { name: 'Main Course', description: 'Lamb, beef, pork, poultry, and seafood', displayOrder: 2 },
  { name: 'Traditional Cuisine', description: 'Namibian traditional dishes', displayOrder: 3 },
  { name: 'Pizza', description: 'All pizzas N$120; extra toppings N$20', displayOrder: 4 },
  { name: 'Platters', description: 'Sharing platters (advance order required)', displayOrder: 5 },
  { name: 'Desserts', description: 'Sweet endings', displayOrder: 6 },
  { name: 'Hot Beverages', description: 'Tea, coffee, and hot chocolate', displayOrder: 7 },
  { name: 'Soft Drinks', description: 'Non-alcoholic refreshments', displayOrder: 8 },
  { name: 'Cocktails', description: 'House cocktails and shandies', displayOrder: 9 },
  { name: 'Beer & Cider', description: 'Local and imported beers and ciders', displayOrder: 10 },
  { name: 'Spirits & Liqueur', description: 'Spirits, liqueurs, brandy, and shots', displayOrder: 11 },
  { name: 'Wine', description: 'House wines by glass and bottle', displayOrder: 12 },
] as const;

export const ETUNA_MENU_ITEMS: MenuCatalogItem[] = [
  // Light Meal
  { categoryName: 'Light Meal', name: 'Full Breakfast', description: 'Cereal, yoghurt, bacon, eggs, sausage, toast, juice, coffee or tea', price: '120.00' },
  { categoryName: 'Light Meal', name: 'Chicken Salad', description: 'Lettuce, onion, tomatoes, cucumbers, olives, feta cheese, with chicken fillet', price: '105.00' },
  { categoryName: 'Light Meal', name: 'Greek Salad', description: 'Lettuce, onion, tomatoes, cucumbers, olives, feta cheese', price: '95.00' },
  { categoryName: 'Light Meal', name: 'Toast or Plain Sandwich (Speciality)', description: 'Two slices: mince & cheese, egg tomato & cheese, tuna mayo, or chicken mayo; served with French fries', price: '75.00' },
  { categoryName: 'Light Meal', name: 'Chicken Wings', description: 'Four chicken wings', price: '80.00' },
  { categoryName: 'Light Meal', name: 'Sandwich Plain or Toast', description: 'Two slices: ham & cheese, or tomato, lettuce & cheese', price: '30.00' },
  { categoryName: 'Light Meal', name: 'Chips', description: 'A portion of French fries', price: '40.00' },
  { categoryName: 'Light Meal', name: 'Viennas', description: 'Two pieces', price: '30.00' },

  // Main Course
  { categoryName: 'Main Course', name: 'Lamb Curry', description: 'Lamb curry stew served on a bed of rice', price: '205.00' },
  { categoryName: 'Main Course', name: 'Lamb Chops', description: 'Lamb chops served with French fries', price: '205.00' },
  { categoryName: 'Main Course', name: 'Pork Chops', description: 'Pork chops served with parsley potatoes', price: '230.00' },
  { categoryName: 'Main Course', name: 'Spare Ribs', description: 'Succulent pork ribs served with French fries', price: '230.00' },
  { categoryName: 'Main Course', name: 'Half Chicken', description: 'Half chicken served with French fries', price: '180.00' },
  { categoryName: 'Main Course', name: 'Oxtail', description: 'Oxtail stew served with rice, maize, or mahangu', price: '205.00' },
  { categoryName: 'Main Course', name: 'Rump Steak', description: 'Rump steak served with parsley potatoes', price: '205.00' },
  { categoryName: 'Main Course', name: 'T-Bone Steak', description: 'T-bone steak served with rice or French fries', price: '205.00' },
  { categoryName: 'Main Course', name: 'Hake Fillet', description: 'Pan-fried fillet served with French fries', price: '140.00' },
  { categoryName: 'Main Course', name: 'King Klip', description: 'King klip served with parsley potatoes or French fries', price: '230.00' },
  { categoryName: 'Main Course', name: 'Pepper Sauce', description: 'Side sauce', price: '30.00', inventorySku: 'SAUCE-PEPPER' },
  { categoryName: 'Main Course', name: 'Garlic Sauce', description: 'Side sauce', price: '30.00', inventorySku: 'SAUCE-GARLIC' },
  { categoryName: 'Main Course', name: 'Mushroom Sauce', description: 'Side sauce', price: '30.00', inventorySku: 'SAUCE-MUSHROOM' },
  { categoryName: 'Main Course', name: 'Tomato Sauce', description: 'Side sauce', price: '30.00', inventorySku: 'SAUCE-TOMATO' },
  { categoryName: 'Main Course', name: 'Chilli Sauce', description: 'Side sauce', price: '30.00', inventorySku: 'SAUCE-CHILLI' },

  // Traditional Cuisine
  { categoryName: 'Traditional Cuisine', name: 'Ondjove', description: 'Marula oil', price: '30.00' },
  { categoryName: 'Traditional Cuisine', name: 'Omaungu', description: 'Mopane worms fried over low heat; served with mahangu or maize', price: '100.00' },
  { categoryName: 'Traditional Cuisine', name: 'Oshingali', description: 'Crushed beans served with mahangu or maize (order in advance)', price: '100.00' },
  { categoryName: 'Traditional Cuisine', name: 'Matangara', description: 'Tripe stew served with mahangu or maize', price: '100.00' },
  { categoryName: 'Traditional Cuisine', name: 'Eedingu', description: 'Dried beef stew served with mahangu or maize', price: '100.00' },
  { categoryName: 'Traditional Cuisine', name: 'Ombidi / Omtete', description: 'Fresh wild spinach served with mahangu or maize', price: '100.00' },
  { categoryName: 'Traditional Cuisine', name: 'Okapana', description: 'Served with salsa, mahangu, or maize', price: '205.00' },
  { categoryName: 'Traditional Cuisine', name: 'Traditional Half Chicken', description: 'Traditional chicken served with mahangu or maize', price: '195.00' },

  // Pizza
  { categoryName: 'Pizza', name: 'Haden Hawaiian', description: 'Ham and pineapple', price: '120.00' },
  { categoryName: 'Pizza', name: 'Harry-Regina', description: 'Mushroom and ham', price: '120.00' },
  { categoryName: 'Pizza', name: 'Onawa Supreme', description: 'Bacon, mushroom, ham, green pepper, onion', price: '120.00' },
  { categoryName: 'Pizza', name: 'Etuna Chicken Mushroom', description: 'Chicken fillet, mushroom, diced onions', price: '120.00' },
  { categoryName: 'Pizza', name: 'Kelly-O-Meaty', description: 'Ham, mince, bacon, chutney', price: '120.00' },
  { categoryName: 'Pizza', name: 'Penda Mexicana', description: 'Mince, peri-peri, crushed garlic, chutney', price: '120.00' },

  // Platters
  { categoryName: 'Platters', name: 'Large Platter', description: 'Serves 8–10: meatballs, chicken pieces, beef strips, fish pieces or pork ribs, chicken fingers, cocktail viennas, sandwiches or potato wedges (advance order)', price: '1000.00' },
  { categoryName: 'Platters', name: 'Medium Platter', description: 'Serves 5–7 (advance order)', price: '750.00' },
  { categoryName: 'Platters', name: 'Mini Platter', description: 'Serves 3–4 (advance order)', price: '500.00' },

  // Desserts
  { categoryName: 'Desserts', name: 'Ice Cream Vanilla', description: 'Single scoop', price: '30.00', inventorySku: 'DESSERT-ICE-VANILLA' },
  { categoryName: 'Desserts', name: 'Ice Cream Chocolate', description: 'Single scoop', price: '30.00', inventorySku: 'DESSERT-ICE-CHOC' },
  { categoryName: 'Desserts', name: 'Ice Cream Strawberry', description: 'Single scoop', price: '30.00', inventorySku: 'DESSERT-ICE-STRAWBERRY' },
  { categoryName: 'Desserts', name: 'Fruit Salad', description: 'Seasonal fruit salad', price: '30.00', inventorySku: 'DESSERT-FRUIT-SALAD' },
  { categoryName: 'Desserts', name: 'Milk Shake Vanilla', description: 'Per glass', price: '40.00', inventorySku: 'DESSERT-SHAKE-VANILLA' },
  { categoryName: 'Desserts', name: 'Milk Shake Lime', description: 'Per glass', price: '40.00', inventorySku: 'DESSERT-SHAKE-LIME' },
  { categoryName: 'Desserts', name: 'Milk Shake Banana', description: 'Per glass', price: '40.00', inventorySku: 'DESSERT-SHAKE-BANANA' },
  { categoryName: 'Desserts', name: 'Malva Pudding', description: 'With custard', price: '45.00' },
  { categoryName: 'Desserts', name: 'Dom Pedro (Amarula or Kahlua)', description: 'Cream liqueur dom pedro', price: '60.00' },
  { categoryName: 'Desserts', name: 'Dom Pedro (Brandy)', description: 'Brandy dom pedro', price: '60.00' },
  { categoryName: 'Desserts', name: 'Dom Pedro (Whisky)', description: 'Whisky dom pedro', price: '60.00' },

  // Hot Beverages
  { categoryName: 'Hot Beverages', name: 'Tea', description: 'Per cup', price: '20.00', inventorySku: 'HOT-TEA' },
  { categoryName: 'Hot Beverages', name: 'Coffee', description: 'Per cup', price: '20.00', inventorySku: 'HOT-COFFEE' },
  { categoryName: 'Hot Beverages', name: 'Cappuccino', description: 'Per cup', price: '30.00', inventorySku: 'HOT-CAPPUCCINO' },
  { categoryName: 'Hot Beverages', name: 'Espresso', description: 'Per cup', price: '30.00', inventorySku: 'HOT-ESPRESSO' },
  { categoryName: 'Hot Beverages', name: 'Hot Chocolate', description: 'Per cup', price: '30.00', inventorySku: 'HOT-CHOCOLATE' },

  // Soft Drinks
  { categoryName: 'Soft Drinks', name: 'Mineral Water 500ml', description: '', price: '20.00', inventorySku: 'BEV-WATER-500' },
  { categoryName: 'Soft Drinks', name: 'Oasis Flavoured Sparkling Water 400ml', description: '', price: '25.00', inventorySku: 'BEV-OASIS-400' },
  { categoryName: 'Soft Drinks', name: 'Schweppes Tonic Water', description: '330ml mixer', price: '20.00', inventorySku: 'BEV-SCHWEPPES-TONIC' },
  { categoryName: 'Soft Drinks', name: 'Schweppes Soda Water', description: '330ml mixer', price: '20.00', inventorySku: 'BEV-SCHWEPPES-SODA' },
  { categoryName: 'Soft Drinks', name: 'Schweppes Lemonade', description: '330ml mixer', price: '20.00', inventorySku: 'BEV-SCHWEPPES-LEMONADE' },
  { categoryName: 'Soft Drinks', name: 'Schweppes Dry Lemon', description: '330ml mixer', price: '20.00', inventorySku: 'BEV-SCHWEPPES-DRY-LEMON' },
  { categoryName: 'Soft Drinks', name: 'Coke 330ml', description: '', price: '20.00', inventorySku: 'BEV-COKE-330' },
  { categoryName: 'Soft Drinks', name: 'Fanta Orange 330ml', description: '', price: '20.00', inventorySku: 'BEV-FANTA-330' },
  { categoryName: 'Soft Drinks', name: 'Stoney 330ml', description: '', price: '20.00', inventorySku: 'BEV-STONEY-330' },
  { categoryName: 'Soft Drinks', name: 'Liquifruit Red Grape 300ml', description: '', price: '25.00', inventorySku: 'BEV-LIQUIFRUIT-RED-GRAPE' },
  { categoryName: 'Soft Drinks', name: 'Liquifruit Clear Apple 300ml', description: '', price: '25.00', inventorySku: 'BEV-LIQUIFRUIT-APPLE' },
  { categoryName: 'Soft Drinks', name: 'Liquifruit Cranberry 300ml', description: '', price: '25.00', inventorySku: 'BEV-LIQUIFRUIT-CRANBERRY' },
  { categoryName: 'Soft Drinks', name: 'Liquifruit Passion Power 300ml', description: '', price: '25.00', inventorySku: 'BEV-LIQUIFRUIT-PASSION' },
  { categoryName: 'Soft Drinks', name: 'Liquifruit Breakfast Punch 300ml', description: '', price: '25.00', inventorySku: 'BEV-LIQUIFRUIT-BREAKFAST' },
  { categoryName: 'Soft Drinks', name: 'Appletiser 330ml', description: '', price: '35.00', inventorySku: 'BEV-APPLETISER-330' },
  { categoryName: 'Soft Drinks', name: 'Grapetiser 330ml', description: '', price: '35.00', inventorySku: 'BEV-GRAPETISER-330' },
  { categoryName: 'Soft Drinks', name: 'Red Bull', description: '250ml can', price: '40.00', inventorySku: 'BEV-REDBULL' },

  // Cocktails
  { categoryName: 'Cocktails', name: 'Passion Fruit 500ml', description: '', price: '50.00' },
  { categoryName: 'Cocktails', name: 'Malawi Shandy 500ml', description: '', price: '50.00' },
  { categoryName: 'Cocktails', name: 'Rock Shandy', description: '', price: '50.00' },
  { categoryName: 'Cocktails', name: 'Etuna Spritzer Cocktail', description: '', price: '50.00' },
  { categoryName: 'Cocktails', name: 'Gin Cocktail', description: '', price: '80.00' },

  // Beer & Cider
  { categoryName: 'Beer & Cider', name: 'Windhoek Lemon', description: '', price: '30.00', inventorySku: 'BEV-WINDHOEK-LEMON' },
  { categoryName: 'Beer & Cider', name: 'Windhoek Non-Alcoholic', description: '', price: '30.00', inventorySku: 'BEV-WINDHOEK-NA' },
  { categoryName: 'Beer & Cider', name: 'Castle Lite 330ml', description: '', price: '25.00', inventorySku: 'BEV-CASTLE-LITE-330' },
  { categoryName: 'Beer & Cider', name: 'Windhoek Lager 440ml', description: '', price: '30.00', inventorySku: 'BEV-WINDHOEK-LAGER-440' },
  { categoryName: 'Beer & Cider', name: 'Tafel Lager 330ml', description: '', price: '25.00', inventorySku: 'BEV-TAFEL-330' },
  { categoryName: 'Beer & Cider', name: 'Windhoek Draught 440ml', description: '', price: '30.00', inventorySku: 'BEV-WINDHOEK-DRAUGHT-440' },
  { categoryName: 'Beer & Cider', name: 'Hansa Draught 500ml', description: '', price: '30.00', inventorySku: 'BEV-HANSA-DRAUGHT-500' },
  { categoryName: 'Beer & Cider', name: 'Bernini 330ml', description: '', price: '30.00', inventorySku: 'BEV-BERNINI-330' },
  { categoryName: 'Beer & Cider', name: 'Hunters Gold 330ml', description: '', price: '30.00', inventorySku: 'BEV-HUNTERS-GOLD-330' },
  { categoryName: 'Beer & Cider', name: 'Hunters Dry 330ml', description: '', price: '30.00', inventorySku: 'BEV-HUNTERS-DRY-330' },
  { categoryName: 'Beer & Cider', name: 'Savannah 330ml', description: '', price: '30.00', inventorySku: 'BEV-SAVANNAH-330' },
  { categoryName: 'Beer & Cider', name: 'Savannah Dry 330ml', description: '', price: '30.00', inventorySku: 'BEV-SAVANNAH-DRY-330' },
  { categoryName: 'Beer & Cider', name: 'Belgravia Cider Dry Lemon', description: '330ml', price: '30.00', inventorySku: 'BEV-BELGRAVIA-DRY-LEMON' },
  { categoryName: 'Beer & Cider', name: 'Belgravia Tonic', description: '330ml', price: '30.00', inventorySku: 'BEV-BELGRAVIA-TONIC' },

  // Spirits & Liqueur
  { categoryName: 'Spirits & Liqueur', name: 'Klipdrift Brandy', description: '', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Richelieu Brandy', description: '', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Hennessy', description: '', price: '50.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Cactus Jack', description: '', price: '15.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Amarula', description: '', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Potency', description: '', price: '15.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Kahlua', description: '', price: '15.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Jagermeister', description: '', price: '25.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Jagerbombs (x4)', description: '', price: '140.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Absolut Vodka', description: 'Per tot', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Smirnoff Vodka', description: 'Per tot', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Smirnoff Pineapple', description: 'Per tot', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Gordon Gin', description: 'Per tot', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Olmeca Tequila Silver', description: 'Per tot', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Olmeca Tequila Chocolate', description: 'Per tot', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Tanqueray Royal', description: 'Per tot', price: '25.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Tanqueray Dry Gin', description: 'Per tot', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Bombay Gin', description: 'Per tot', price: '25.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Jack Daniels', description: 'Per tot', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Jameson', description: 'Per tot', price: '20.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Johnnie Walker Red', description: 'Per tot', price: '25.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Johnnie Walker Black', description: 'Per tot', price: '40.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Jameson Select Reserve', description: 'Per tot', price: '40.00' },
  { categoryName: 'Spirits & Liqueur', name: 'Johnnie Walker Blue', description: 'Per tot', price: '150.00' },
  { categoryName: 'Spirits & Liqueur', name: 'White Horse', description: 'Per tot', price: '20.00' },

  // Wine
  { categoryName: 'Wine', name: 'Sun Kissed Rosé', description: 'Bottle', price: '150.00' },
  { categoryName: 'Wine', name: 'Sun Kissed Sweet Red', description: 'Bottle', price: '150.00' },
  { categoryName: 'Wine', name: 'Optima Red', description: 'Bottle', price: '350.00' },
  { categoryName: 'Wine', name: 'Roodeberg Black', description: 'Bottle', price: '250.00' },
  { categoryName: 'Wine', name: 'Silk & Spice Red Blend', description: 'Bottle', price: '250.00' },
  { categoryName: 'Wine', name: 'Nero Marone D-Italian', description: 'Bottle', price: '300.00' },
  { categoryName: 'Wine', name: 'Silk & Spice Intense Red Blend', description: 'Bottle', price: '250.00' },
  { categoryName: 'Wine', name: 'Diemersdal White', description: 'Bottle', price: '150.00' },
  { categoryName: 'Wine', name: 'La Gosta Vinho Verde', description: 'Bottle', price: '200.00' },
  { categoryName: 'Wine', name: 'Casal Garcia Vinho Verde', description: 'Bottle', price: '250.00' },
  { categoryName: 'Wine', name: 'Silk & Spice White Blend', description: 'Bottle', price: '250.00' },
  { categoryName: 'Wine', name: 'Sun Kissed Sweet White', description: 'Bottle', price: '150.00' },
  { categoryName: 'Wine', name: 'Castle White Wine', description: 'Bottle', price: '80.00' },
  { categoryName: 'Wine', name: 'House Wine Carafe Red 250ml', description: '', price: '30.00', inventorySku: 'WINE-CARAFE-RED-250' },
  { categoryName: 'Wine', name: 'House Wine Carafe White 250ml', description: '', price: '30.00', inventorySku: 'WINE-CARAFE-WHITE-250' },
  { categoryName: 'Wine', name: 'J.C. Le Roux Sparkling', description: 'Bottle', price: '150.00' },
  { categoryName: 'Wine', name: 'J.C. Le Roux Non-Alcoholic Sparkling', description: 'Bottle', price: '150.00' },
  { categoryName: 'Wine', name: 'Sparkling Red', description: 'Bottle', price: '150.00' },
  { categoryName: 'Wine', name: 'Sparkling White', description: 'Bottle', price: '150.00' },
];

export function formatMenuMarkdown(): string {
  const lines: string[] = [
    '# Etuna Restaurant Menu',
    '',
    `${restaurantMenuHoursBlurb} All prices in Namibian Dollars (NAD). Platters and some traditional dishes require advance notice.`,
    '',
  ];

  let currentCategory = '';
  for (const item of ETUNA_MENU_ITEMS) {
    if (item.categoryName !== currentCategory) {
      currentCategory = item.categoryName;
      if (lines.length > 4) lines.push('');
      lines.push(`## ${currentCategory}`, '');
    }
    const desc = item.description ? ` — ${item.description}` : '';
    lines.push(`- ${item.name}${desc}: N$${Number(item.price).toFixed(0)}`);
  }

  return lines.join('\n');
}
