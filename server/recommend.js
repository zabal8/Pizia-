const STOP_WORDS = new Set(['a', 'al', 'de', 'del', 'el', 'la', 'las', 'los', 'o', 'u', 'y', 'con']);

function terms(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .match(/[a-z0-9]+/g)?.filter((word) => !STOP_WORDS.has(word)) || [];
}

function vector(text) {
  const words = terms(text);
  const counts = new Map();
  for (let i = 0; i < words.length; i += 1) {
    counts.set(words[i], (counts.get(words[i]) || 0) + 1);
    if (i + 1 < words.length) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      counts.set(phrase, (counts.get(phrase) || 0) + 1);
    }
  }
  return counts;
}

function cosine(a, b, idf) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [term, count] of a) {
    const value = count * (idf.get(term) || 1);
    normA += value * value;
    dot += value * (b.get(term) || 0) * (idf.get(term) || 1);
  }
  for (const [term, count] of b) {
    const value = count * (idf.get(term) || 1);
    normB += value * value;
  }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}

export function recommend(pizzas, sourceIds, popularity = {}) {
  const grouped = new Map();
  for (const pizza of pizzas) {
    if (!grouped.has(pizza.nombre)) grouped.set(pizza.nombre, { ingredients: new Set(), variants: [] });
    const group = grouped.get(pizza.nombre);
    pizza.ingredientes.forEach((ingredient) => group.ingredients.add(ingredient.nombre));
    group.variants.push(pizza);
  }
  const recipes = [...grouped].map(([nombre, group]) => ({ nombre, ...group, vector: vector([...group.ingredients].join(' ')) }));
  const docs = recipes.map((recipe) => recipe.vector);
  const df = new Map();
  for (const doc of docs) for (const term of doc.keys()) df.set(term, (df.get(term) || 0) + 1);
  const idf = new Map([...df].map(([term, n]) => [term, Math.log(1 + recipes.length / (n || 1))]));
  const byId = new Map(pizzas.map((pizza) => [Number(pizza.id), pizza]));
  const sources = sourceIds.map((id) => byId.get(Number(id))).filter(Boolean);
  const selectedNames = new Set(sources.map((pizza) => pizza.nombre));
  const selectedSizes = sources.map((pizza) => pizza.tamano);
  const targetSize = selectedSizes.sort((a, b) => selectedSizes.filter((x) => x === b).length - selectedSizes.filter((x) => x === a).length)[0] || 'mediana';
  const profile = new Map();
  for (const source of sources) {
    const recipe = recipes.find((item) => item.nombre === source.nombre);
    if (!recipe) continue;
    for (const [term, count] of recipe.vector) profile.set(term, (profile.get(term) || 0) + count);
  }
  const maxPop = Math.max(0, ...Object.values(popularity));
  return recipes.filter((recipe) => !selectedNames.has(recipe.nombre)).map((recipe) => {
    const similarity = sources.length ? cosine(profile, recipe.vector, idf) : 0;
    const popular = maxPop ? (popularity[recipe.nombre] || 0) / maxPop : 0;
    const variant = recipe.variants.find((item) => item.tamano === targetSize)
      || recipe.variants.find((item) => item.tamano === 'mediana') || recipe.variants[0];
    const shared = [...new Set(sources.flatMap((source) => source.ingredientes.map((item) => item.nombre)))]
      .filter((name) => recipe.ingredients.has(name)).slice(0, 3);
    return {
      pizza: variant.id,
      nombre: recipe.nombre,
      tamano: variant.tamano,
      precio: String(variant.precio),
      similitud: Number((similarity * 100).toFixed(1)),
      motivo: shared.length ? `El modelo encontró ingredientes en común: ${shared.join(', ')}.` : sources.length
        ? 'La receta tiene un perfil de ingredientes parecido a tus selecciones.'
        : 'Recomendada entre las más pedidas del menú.',
      _score: sources.length ? 0.85 * similarity + 0.15 * popular : popular,
    };
  }).sort((a, b) => b._score - a._score || b.similitud - a.similitud || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, 3).map(({ _score, ...item }) => item);
}
