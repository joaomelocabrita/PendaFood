export type FoodSeed = {
  id: string;
  name: string;
  category: string;
  defaultPortion: string;
  fodmapNote: string;
  preparationNote: string;
  sourceName: string;
  sourceUrl?: string;
};

// Starter metadata only. It is deliberately not presented as medical advice.
// Provenance is stored per record so richer datasets can be added later.
export const starterFoods: FoodSeed[] = [
  { id: "oats", name: "Oats", category: "grain", defaultPortion: "1 bowl", fodmapNote: "Portion and individual tolerance vary.", preparationNote: "Cook until soft if preferred.", sourceName: "PendaFood starter catalog" },
  { id: "rice", name: "Rice", category: "grain", defaultPortion: "1 bowl", fodmapNote: "Portion and individual tolerance vary.", preparationNote: "Plain, well-cooked rice is a simple base.", sourceName: "PendaFood starter catalog" },
  { id: "potato", name: "Potato", category: "starch", defaultPortion: "1 medium", fodmapNote: "Portion and individual tolerance vary.", preparationNote: "Boiled, baked, or mashed.", sourceName: "PendaFood starter catalog" },
  { id: "banana", name: "Banana", category: "fruit", defaultPortion: "1 small", fodmapNote: "Ripeness and portion can matter.", preparationNote: "Record ripeness if useful.", sourceName: "PendaFood starter catalog" },
  { id: "carrot", name: "Carrot", category: "vegetable", defaultPortion: "1 serving", fodmapNote: "Portion and individual tolerance vary.", preparationNote: "Cooked texture may be easier for some people.", sourceName: "PendaFood starter catalog" },
  { id: "egg", name: "Egg", category: "protein", defaultPortion: "1–2 eggs", fodmapNote: "Individual tolerance varies.", preparationNote: "Boiled, poached, scrambled, or omelette.", sourceName: "PendaFood starter catalog" },
  { id: "chicken", name: "Chicken", category: "protein", defaultPortion: "1 palm-sized serving", fodmapNote: "Sauces and marinades can change ingredients.", preparationNote: "Bake, poach, grill, or stew.", sourceName: "PendaFood starter catalog" }
];
