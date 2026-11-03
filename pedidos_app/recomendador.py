"""Recomendador de contenido entrenado sobre las recetas del catálogo."""

from collections import Counter

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


STOP_WORDS_ES = [
    'a', 'al', 'de', 'del', 'el', 'la', 'las', 'los', 'o', 'u', 'y', 'con',
]


def recomendar_pizzas(pizzas, pizzas_fuente=(), popularidad=None, limite=3):
    """Ajusta TF-IDF a las recetas y rankea sabores por similitud coseno.

    ``pizzas_fuente`` contiene IDs de pizzas elegidas o compradas. Las
    cantidades repetidas en esa lista ponderan el perfil de preferencia.
    """
    pizzas = list(pizzas)
    pizzas_fuente = list(pizzas_fuente)
    if not pizzas:
        return []

    por_id = {pizza.pk: pizza for pizza in pizzas}
    sabores = {}
    for pizza in pizzas:
        receta = sabores.setdefault(pizza.nombre, {'ingredientes': set(), 'variantes': []})
        receta['ingredientes'].update(ingrediente.nombre for ingrediente in pizza.ingredientes.all())
        receta['variantes'].append(pizza)

    nombres = list(sabores)
    documentos = [' '.join(sorted(sabores[nombre]['ingredientes'])) for nombre in nombres]
    vectorizador = TfidfVectorizer(
        lowercase=True,
        strip_accents='unicode',
        ngram_range=(1, 2),
        stop_words=STOP_WORDS_ES,
        sublinear_tf=True,
    )

    matriz = None
    if any(documento.strip() for documento in documentos):
        try:
            matriz = vectorizador.fit_transform(documentos)
        except ValueError:
            # Catálogo sin vocabulario útil: se informa y se usa arranque en frío.
            matriz = None

    perfil = Counter(
        por_id[pizza_id].nombre
        for pizza_id in pizzas_fuente
        if pizza_id in por_id
    )
    popularidad = popularidad or {}
    max_popularidad = max(popularidad.values(), default=0)
    popularidad_relativa = {
        nombre: (cantidad / max_popularidad if max_popularidad else 0)
        for nombre, cantidad in popularidad.items()
    }

    similitudes = np.zeros(len(nombres), dtype=float)
    modelo_personalizado = bool(perfil and matriz is not None)
    if modelo_personalizado:
        indices = [nombres.index(nombre) for nombre in perfil]
        pesos = np.array([perfil[nombre] for nombre in perfil], dtype=float)
        perfil_vector = np.asarray(matriz[indices].T @ pesos).reshape(1, -1)
        similitudes = cosine_similarity(perfil_vector, matriz).ravel()

    tamanos_fuente = Counter(
        por_id[pizza_id].tamano
        for pizza_id in pizzas_fuente
        if pizza_id in por_id
    )
    tamano_objetivo = tamanos_fuente.most_common(1)[0][0] if tamanos_fuente else 'mediana'

    resultados = []
    for indice, nombre in enumerate(nombres):
        if nombre in perfil:
            continue
        similitud = float(similitudes[indice])
        popular = popularidad_relativa.get(nombre, 0)
        puntaje = (0.85 * similitud + 0.15 * popular) if modelo_personalizado else popular
        variantes = sabores[nombre]['variantes']
        pizza = next((item for item in variantes if item.tamano == tamano_objetivo), None)
        if pizza is None:
            pizza = next((item for item in variantes if item.tamano == 'mediana'), variantes[0])

        ingredientes_origen = set()
        for sabor_origen in perfil:
            ingredientes_origen.update(sabores[sabor_origen]['ingredientes'])
        coincidentes = sorted(ingredientes_origen & sabores[nombre]['ingredientes'])[:3]
        if coincidentes:
            motivo = 'El modelo encontró ingredientes en común: ' + ', '.join(coincidentes) + '.'
        elif modelo_personalizado:
            motivo = 'La receta tiene un perfil de ingredientes parecido a tus selecciones.'
        else:
            motivo = 'Recomendada entre las más pedidas del menú.'

        resultados.append({
            'pizza': pizza.pk,
            'nombre': nombre,
            'tamano': pizza.get_tamano_display(),
            'precio': str(pizza.precio),
            'similitud': round(similitud * 100, 1),
            'motivo': motivo,
            '_puntaje': puntaje,
        })

    resultados.sort(key=lambda item: (-item['_puntaje'], -item['similitud'], item['nombre']))
    for resultado in resultados:
        resultado.pop('_puntaje', None)
    return resultados[:limite]
