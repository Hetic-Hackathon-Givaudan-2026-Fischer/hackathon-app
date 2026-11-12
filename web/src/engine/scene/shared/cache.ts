// Mémoïsation des objets coûteux (matériaux, textures, modèles).

/** Valeur en cache pour `key`, créée par `create` au premier appel. */
export function cached<K, V>(cache: Map<K, V>, key: K, create: () => V): V {
  let value = cache.get(key);
  if (value === undefined) {
    value = create();
    cache.set(key, value);
  }
  return value;
}
