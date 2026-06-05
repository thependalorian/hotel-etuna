/**
 * Menu image taxonomy — each catalog line maps to a visual intent, then a vetted URL.
 * Location: lib/data/menu-item-image-kinds.ts
 *
 * Traditional Namibian dishes use Wikimedia Commons (CC BY-SA; attribute in property materials).
 * Plated food and packaged drinks use Unsplash (commercial license).
 */

import type { MenuCatalogItem } from '@/lib/data/etuna-restaurant-menu-catalog';
import { securityLogger } from '@/lib/utils/security-logger';
import {
  buildUnsplashMenuThumbUrl,
  buildWikimediaMenuThumbUrl,
} from '@/lib/data/menu-image-thumb';

export type MenuImageKind =
  | 'breakfast-full'
  | 'salad-chicken'
  | 'salad-greek'
  | 'sandwich-plate'
  | 'sandwich-toast'
  | 'wings'
  | 'fries'
  | 'sausage-vienna'
  | 'curry-lamb'
  | 'lamb-chops'
  | 'pork-chops'
  | 'ribs-pork'
  | 'chicken-roast-half'
  | 'stew-oxtail'
  | 'steak-rump'
  | 'steak-tbone'
  | 'fish-fillet'
  | 'fish-klip'
  | 'sauce-bowl'
  | 'condiment-oil'
  | 'traditional-mopane-worms'
  | 'traditional-beans-mahangu'
  | 'traditional-tripe-stew'
  | 'traditional-dried-beef-stew'
  | 'traditional-spinach-mahangu'
  | 'traditional-grilled-meat'
  | 'traditional-chicken-mahangu'
  | 'pizza-hawaiian'
  | 'pizza-mushroom-ham'
  | 'pizza-supreme'
  | 'pizza-chicken'
  | 'pizza-meaty'
  | 'pizza-spicy-mince'
  | 'platter-sharing'
  | 'ice-cream-vanilla'
  | 'ice-cream-chocolate'
  | 'ice-cream-strawberry'
  | 'fruit-salad'
  | 'milkshake'
  | 'dessert-malva'
  | 'dessert-dom-pedro'
  | 'tea'
  | 'coffee'
  | 'cappuccino'
  | 'espresso'
  | 'hot-chocolate'
  | 'water-bottle'
  | 'sparkling-water'
  | 'mixer-tonic'
  | 'soda-cola'
  | 'soda-orange'
  | 'soda-ginger'
  | 'juice-bottle'
  | 'sparkling-grape'
  | 'energy-drink'
  | 'cocktail-tropical'
  | 'cocktail-shandy'
  | 'cocktail-spritzer'
  | 'cocktail-gin'
  | 'beer-lager'
  | 'beer-draught'
  | 'beer-non-alcoholic'
  | 'cider-bottle'
  | 'spirit-brandy'
  | 'spirit-hennessy'
  | 'spirit-shot'
  | 'liqueur-cream'
  | 'liqueur-herbal'
  | 'vodka-bottle'
  | 'gin-bottle'
  | 'tequila-bottle'
  | 'whisky-bottle'
  | 'whisky-premium'
  | 'wine-rose'
  | 'wine-red-bottle'
  | 'wine-red-premium'
  | 'wine-white-bottle'
  | 'wine-sparkling'
  | 'wine-carafe';

function unsplash(photoId: string): string {
  return buildUnsplashMenuThumbUrl(photoId);
}

function wikimedia(path: string): string {
  return buildWikimediaMenuThumbUrl(path);
}

/** Vetted URL per visual intent — Unsplash IDs verified HTTP 200 at 480px (May 2026). */
export const IMAGE_URL_BY_KIND: Record<MenuImageKind, string> = {
  'breakfast-full': unsplash('1465014925804-7b9ede58d0d7'),
  'salad-chicken': unsplash('1512621776951-a57141f2eefd'),
  'salad-greek': unsplash('1540420773420-3366772f4999'),
  'sandwich-plate': unsplash('1758157835975-1cb4947750df'),
  'sandwich-toast': unsplash('1493770348161-369560ae357d'),
  wings: unsplash('1515951276599-79cccea69cf2'),
  fries: unsplash('1573080496219-bb080dd4f877'),
  'sausage-vienna': unsplash('1540878724756-d5c4517dea9c'),
  'curry-lamb': unsplash('1534939561126-855b8675edd7'),
  'lamb-chops': unsplash('1448227700746-d8eab5a1b9d7'),
  'pork-chops': unsplash('1600891964092-4316c288032e'),
  'ribs-pork': unsplash('1544025162-d76694265947'),
  'chicken-roast-half': unsplash('1567620832903-9fc6debc209f'),
  'stew-oxtail': unsplash('1599395759383-d5fd1050d676'),
  'steak-rump': unsplash('1768260731884-08b2ff0bb3f7'),
  'steak-tbone': unsplash('1758157835975-1cb4947750df'),
  'fish-fillet': unsplash('1544947950-fa07a98d237f'),
  'fish-klip': unsplash('1546069901-ba9599a7e63c'),
  'sauce-bowl': unsplash('1472476443507-c7a5948772fc'),
  'condiment-oil': unsplash('1504674900247-0877df9cc836'),
  'traditional-mopane-worms': wikimedia('6/66/Mopane-worm-meal.jpg'),
  'traditional-beans-mahangu': unsplash('1555939594-58d7cb561ad1'),
  'traditional-tripe-stew': unsplash('1555939594-58d7cb561ad1'),
  'traditional-dried-beef-stew': unsplash('1534939561126-855b8675edd7'),
  'traditional-spinach-mahangu': wikimedia(
    '3/3c/Mahangu_Porridge_served_with_mopane_worms_and_spinach_stew.jpg',
  ),
  'traditional-grilled-meat': unsplash('1768260731884-08b2ff0bb3f7'),
  'traditional-chicken-mahangu': wikimedia(
    '3/3c/Mahangu_Porridge_served_with_mopane_worms_and_spinach_stew.jpg',
  ),
  'pizza-hawaiian': unsplash('1513104890138-7c749659a591'),
  'pizza-mushroom-ham': unsplash('1574071318508-1cdbab80d002'),
  'pizza-supreme': unsplash('1565299624946-b28f40a0ae38'),
  'pizza-chicken': unsplash('1534308983496-4fabb1a015ee'),
  'pizza-meaty': unsplash('1571066811602-716837d681de'),
  'pizza-spicy-mince': unsplash('1555072956-7758afb20e8f'),
  'platter-sharing': unsplash('1758157835975-1cb4947750df'),
  'ice-cream-vanilla': unsplash('1563805042-7684c019e1cb'),
  'ice-cream-chocolate': unsplash('1476887334197-56adbf254e1a'),
  'ice-cream-strawberry': unsplash('1488477181946-6428a0291777'),
  'fruit-salad': unsplash('1546069901-ba9599a7e63c'),
  milkshake: unsplash('1553787499-6f9133860278'),
  'dessert-malva': unsplash('1476887334197-56adbf254e1a'),
  'dessert-dom-pedro': unsplash('1514362545857-3bc16c4c7d1b'),
  tea: unsplash('1551782450-a2132b4ba21d'),
  coffee: unsplash('1495474472287-4d71bcdd2085'),
  cappuccino: unsplash('1447933601403-0c6688de566e'),
  espresso: unsplash('1509042239860-f550ce710b93'),
  'hot-chocolate': unsplash('1476887334197-56adbf254e1a'),
  'water-bottle': unsplash('1550426735-c33c7ce414ff'),
  'sparkling-water': unsplash('1550426735-c33c7ce414ff'),
  'mixer-tonic': unsplash('1514362545857-3bc16c4c7d1b'),
  'soda-cola': unsplash('1550426735-c33c7ce414ff'),
  'soda-orange': unsplash('1619241638225-14d56e47ae64'),
  'soda-ginger': unsplash('1629203851122-3726ecdf080e'),
  'juice-bottle': unsplash('1546069901-ba9599a7e63c'),
  'sparkling-grape': unsplash('1550426735-c33c7ce414ff'),
  'energy-drink': unsplash('1544145945-f90425340c7e'),
  'cocktail-tropical': unsplash('1514362545857-3bc16c4c7d1b'),
  'cocktail-shandy': unsplash('1608270586620-248524c67de9'),
  'cocktail-spritzer': unsplash('1550426735-c33c7ce414ff'),
  'cocktail-gin': unsplash('1551538827-9c037cb4f32a'),
  'beer-lager': unsplash('1608270586620-248524c67de9'),
  'beer-draught': unsplash('1535958636474-b021ee887b13'),
  'beer-non-alcoholic': unsplash('1436076863939-06870fe779c2'),
  'cider-bottle': unsplash('1535958636474-b021ee887b13'),
  'spirit-brandy': unsplash('1470337458703-46ad1756a187'),
  'spirit-hennessy': unsplash('1508253730651-e5ace80a7025'),
  'spirit-shot': unsplash('1508253730651-e5ace80a7025'),
  'liqueur-cream': unsplash('1470337458703-46ad1756a187'),
  'liqueur-herbal': unsplash('1508253730651-e5ace80a7025'),
  'vodka-bottle': unsplash('1516758288207-e9059e0b3b3f'),
  'gin-bottle': unsplash('1551538827-9c037cb4f32a'),
  'tequila-bottle': unsplash('1551538827-9c037cb4f32a'),
  'whisky-bottle': unsplash('1508253730651-e5ace80a7025'),
  'whisky-premium': unsplash('1508253730651-e5ace80a7025'),
  'wine-rose': unsplash('1472352327492-9765783b74e1'),
  'wine-red-bottle': unsplash('1472352327492-9765783b74e1'),
  'wine-red-premium': unsplash('1472352327492-9765783b74e1'),
  'wine-white-bottle': unsplash('1550426735-c33c7ce414ff'),
  'wine-sparkling': unsplash('1550426735-c33c7ce414ff'),
  'wine-carafe': unsplash('1472352327492-9765783b74e1'),
};

/** Exact dish name → visual intent (every Etuna menu line). */
const ITEM_IMAGE_KIND: Record<string, MenuImageKind> = {
  'Full Breakfast': 'breakfast-full',
  'Chicken Salad': 'salad-chicken',
  'Greek Salad': 'salad-greek',
  'Toast or Plain Sandwich (Speciality)': 'sandwich-plate',
  'Chicken Wings': 'wings',
  'Sandwich Plain or Toast': 'sandwich-toast',
  Chips: 'fries',
  Viennas: 'sausage-vienna',
  'Lamb Curry': 'curry-lamb',
  'Lamb Chops': 'lamb-chops',
  'Pork Chops': 'pork-chops',
  'Spare Ribs': 'ribs-pork',
  'Half Chicken': 'chicken-roast-half',
  Oxtail: 'stew-oxtail',
  'Rump Steak': 'steak-rump',
  'T-Bone Steak': 'steak-tbone',
  'Hake Fillet': 'fish-fillet',
  'King Klip': 'fish-klip',
  'Pepper Sauce': 'sauce-bowl',
  'Garlic Sauce': 'sauce-bowl',
  'Mushroom Sauce': 'sauce-bowl',
  'Tomato Sauce': 'sauce-bowl',
  'Chilli Sauce': 'sauce-bowl',
  Ondjove: 'condiment-oil',
  Omaungu: 'traditional-mopane-worms',
  Oshingali: 'traditional-beans-mahangu',
  Matangara: 'traditional-tripe-stew',
  Eedingu: 'traditional-dried-beef-stew',
  'Ombidi / Omtete': 'traditional-spinach-mahangu',
  Okapana: 'traditional-grilled-meat',
  'Traditional Half Chicken': 'traditional-chicken-mahangu',
  'Haden Hawaiian': 'pizza-hawaiian',
  'Harry-Regina': 'pizza-mushroom-ham',
  'Onawa Supreme': 'pizza-supreme',
  'Etuna Chicken Mushroom': 'pizza-chicken',
  'Kelly-O-Meaty': 'pizza-meaty',
  'Penda Mexicana': 'pizza-spicy-mince',
  'Large Platter': 'platter-sharing',
  'Medium Platter': 'platter-sharing',
  'Mini Platter': 'platter-sharing',
  'Ice Cream Vanilla': 'ice-cream-vanilla',
  'Ice Cream Chocolate': 'ice-cream-chocolate',
  'Ice Cream Strawberry': 'ice-cream-strawberry',
  'Fruit Salad': 'fruit-salad',
  'Milk Shake Vanilla': 'milkshake',
  'Milk Shake Lime': 'milkshake',
  'Milk Shake Banana': 'milkshake',
  'Malva Pudding': 'dessert-malva',
  'Dom Pedro (Amarula or Kahlua)': 'dessert-dom-pedro',
  'Dom Pedro (Brandy)': 'dessert-dom-pedro',
  'Dom Pedro (Whisky)': 'dessert-dom-pedro',
  Tea: 'tea',
  Coffee: 'coffee',
  Cappuccino: 'cappuccino',
  Espresso: 'espresso',
  'Hot Chocolate': 'hot-chocolate',
  'Mineral Water 500ml': 'water-bottle',
  'Oasis Flavoured Sparkling Water 400ml': 'sparkling-water',
  'Schweppes Tonic Water': 'mixer-tonic',
  'Schweppes Soda Water': 'mixer-tonic',
  'Schweppes Lemonade': 'mixer-tonic',
  'Schweppes Dry Lemon': 'mixer-tonic',
  'Coke 330ml': 'soda-cola',
  'Fanta Orange 330ml': 'soda-orange',
  'Stoney 330ml': 'soda-ginger',
  'Liquifruit Red Grape 300ml': 'juice-bottle',
  'Liquifruit Clear Apple 300ml': 'juice-bottle',
  'Liquifruit Cranberry 300ml': 'juice-bottle',
  'Liquifruit Passion Power 300ml': 'juice-bottle',
  'Liquifruit Breakfast Punch 300ml': 'juice-bottle',
  'Appletiser 330ml': 'sparkling-grape',
  'Grapetiser 330ml': 'sparkling-grape',
  'Red Bull': 'energy-drink',
  'Passion Fruit 500ml': 'cocktail-tropical',
  'Malawi Shandy 500ml': 'cocktail-shandy',
  'Rock Shandy': 'cocktail-shandy',
  'Etuna Spritzer Cocktail': 'cocktail-spritzer',
  'Gin Cocktail': 'cocktail-gin',
  'Windhoek Lemon': 'beer-non-alcoholic',
  'Windhoek Non-Alcoholic': 'beer-non-alcoholic',
  'Castle Lite 330ml': 'beer-lager',
  'Windhoek Lager 440ml': 'beer-lager',
  'Tafel Lager 330ml': 'beer-lager',
  'Windhoek Draught 440ml': 'beer-draught',
  'Hansa Draught 500ml': 'beer-draught',
  'Bernini 330ml': 'cider-bottle',
  'Hunters Gold 330ml': 'cider-bottle',
  'Hunters Dry 330ml': 'cider-bottle',
  'Savannah 330ml': 'cider-bottle',
  'Savannah Dry 330ml': 'cider-bottle',
  'Belgravia Cider Dry Lemon': 'cider-bottle',
  'Belgravia Tonic': 'mixer-tonic',
  'Klipdrift Brandy': 'spirit-brandy',
  'Richelieu Brandy': 'spirit-brandy',
  Hennessy: 'spirit-hennessy',
  'Cactus Jack': 'spirit-shot',
  Amarula: 'liqueur-cream',
  Potency: 'spirit-shot',
  Kahlua: 'liqueur-cream',
  Jagermeister: 'liqueur-herbal',
  'Jagerbombs (x4)': 'liqueur-herbal',
  'Absolut Vodka': 'vodka-bottle',
  'Smirnoff Vodka': 'vodka-bottle',
  'Smirnoff Pineapple': 'vodka-bottle',
  'Gordon Gin': 'gin-bottle',
  'Olmeca Tequila Silver': 'tequila-bottle',
  'Olmeca Tequila Chocolate': 'tequila-bottle',
  'Tanqueray Royal': 'gin-bottle',
  'Tanqueray Dry Gin': 'gin-bottle',
  'Bombay Gin': 'gin-bottle',
  'Jack Daniels': 'whisky-bottle',
  Jameson: 'whisky-bottle',
  'Johnnie Walker Red': 'whisky-bottle',
  'Johnnie Walker Black': 'whisky-premium',
  'Jameson Select Reserve': 'whisky-premium',
  'Johnnie Walker Blue': 'whisky-premium',
  'White Horse': 'whisky-bottle',
  'Sun Kissed Rosé': 'wine-rose',
  'Sun Kissed Sweet Red': 'wine-red-bottle',
  'Optima Red': 'wine-red-premium',
  'Roodeberg Black': 'wine-red-premium',
  'Silk & Spice Red Blend': 'wine-red-bottle',
  'Nero Marone D-Italian': 'wine-red-premium',
  'Silk & Spice Intense Red Blend': 'wine-red-bottle',
  'Diemersdal White': 'wine-white-bottle',
  'La Gosta Vinho Verde': 'wine-white-bottle',
  'Casal Garcia Vinho Verde': 'wine-white-bottle',
  'Silk & Spice White Blend': 'wine-white-bottle',
  'Sun Kissed Sweet White': 'wine-white-bottle',
  'Castle White Wine': 'wine-white-bottle',
  'House Wine Carafe Red 250ml': 'wine-carafe',
  'House Wine Carafe White 250ml': 'wine-carafe',
  'J.C. Le Roux Sparkling': 'wine-sparkling',
  'J.C. Le Roux Non-Alcoholic Sparkling': 'wine-sparkling',
  'Sparkling Red': 'wine-sparkling',
  'Sparkling White': 'wine-sparkling',
};

export function resolveMenuImageKind(item: MenuCatalogItem): MenuImageKind {
  const exact = ITEM_IMAGE_KIND[item.name];
  if (exact) return exact;

  const category = item.categoryName;
  const name = item.name.toLowerCase();

  if (category === 'Wine') {
    if (name.includes('rosé') || name.includes('rose')) return 'wine-rose';
    if (name.includes('sparkling') || name.includes('le roux')) return 'wine-sparkling';
    if (name.includes('white') || name.includes('verde')) return 'wine-white-bottle';
    if (name.includes('carafe')) return 'wine-carafe';
    return 'wine-red-bottle';
  }

  if (category === 'Spirits & Liqueur') {
    if (name.includes('hennessy') || name.includes('walker blue')) return 'whisky-premium';
    if (name.includes('vodka')) return 'vodka-bottle';
    if (name.includes('gin') || name.includes('tanqueray') || name.includes('bombay')) return 'gin-bottle';
    if (name.includes('tequila') || name.includes('olmeca')) return 'tequila-bottle';
    if (name.includes('amarula') || name.includes('kahlua')) return 'liqueur-cream';
    if (name.includes('jager')) return 'liqueur-herbal';
    if (name.includes('brandy')) return 'spirit-brandy';
    return 'whisky-bottle';
  }

  securityLogger.warn(`[menu-image] No image kind for "${item.name}" (${category}); using sauce-bowl fallback`);
  return 'sauce-bowl';
}

export function getImageUrlForMenuItem(item: MenuCatalogItem): string {
  const kind = resolveMenuImageKind(item);
  return IMAGE_URL_BY_KIND[kind];
}
