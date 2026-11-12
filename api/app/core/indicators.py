"""Indicateurs d'un arôme et leur source d'origine : seule source de vérité.

Catalogue commun aux deux origines : chaque source de tendances ne fournit
qu'une partie de ces indicateurs. Clé absente d'un TrendRecord = indicateur non
fourni par la source ; valeur None = fourni mais vide.

Les clés sont celles du CSV de repli (préfixes retirés), plus celles de Google
Trends (API Data/IA seulement). Le client Data/IA ramène ses champs vers ces clés.
"""

from dataclasses import dataclass
from enum import StrEnum


class Source(StrEnum):
    """Source d'origine d'un indicateur."""

    GOOGLE_TRENDS = "google_trends"
    WIKIPEDIA = "wikipedia"
    OPEN_FOOD_FACTS = "open_food_facts"
    PRESS = "presse"
    SOCIAL = "reseaux_sociaux"
    PINTEREST = "pinterest"


SOURCE_LABELS: dict[Source, str] = {
    Source.GOOGLE_TRENDS: "Google Trends",
    Source.WIKIPEDIA: "Wikipédia",
    Source.OPEN_FOOD_FACTS: "Open Food Facts",
    Source.PRESS: "Presse",
    Source.SOCIAL: "Réseaux sociaux",
    Source.PINTEREST: "Pinterest",
}


@dataclass(frozen=True, slots=True)
class IndicatorSource:
    """Un indicateur, sa source d'origine et la période qu'il couvre."""

    key: str
    label: str
    source: Source
    period: str


def _indicator(key: str, label: str, source: Source, period: str) -> IndicatorSource:
    return IndicatorSource(key=key, label=label, source=source, period=period)


INDICATORS: tuple[IndicatorSource, ...] = (
    _indicator(
        "recherche_croissance_13s_pct",
        "Croissance des recherches 13 semaines (%)",
        Source.GOOGLE_TRENDS,
        "13 semaines",
    ),
    _indicator(
        "recherche_croissance_52s_pct",
        "Croissance des recherches sur un an (%)",
        Source.GOOGLE_TRENDS,
        "52 semaines",
    ),
    _indicator(
        "recherche_volatilite_26s",
        "Volatilité des recherches",
        Source.GOOGLE_TRENDS,
        "26 semaines",
    ),
    _indicator(
        "recherche_pic_ratio",
        "Pic récent / moyenne",
        Source.GOOGLE_TRENDS,
        "26 semaines",
    ),
    _indicator(
        "popularite_vs_vanille",
        "Popularité relative à la vanille",
        Source.GOOGLE_TRENDS,
        "26 semaines",
    ),
    _indicator("wiki_vues_30j", "Vues Wikipédia", Source.WIKIPEDIA, "30 jours"),
    _indicator(
        "wiki_croissance_3m_pct", "Croissance 3 mois (%)", Source.WIKIPEDIA, "3 mois"
    ),
    _indicator(
        "wiki_croissance_12m_pct", "Croissance 12 mois (%)", Source.WIKIPEDIA, "12 mois"
    ),
    _indicator(
        "wiki_croissance_3m_relative",
        "Croissance 3 mois relative",
        Source.WIKIPEDIA,
        "3 mois",
    ),
    _indicator(
        "wiki_croissance_12m_relative",
        "Croissance 12 mois relative",
        Source.WIKIPEDIA,
        "12 mois",
    ),
    _indicator("wiki_volatilite_26s", "Volatilité", Source.WIKIPEDIA, "26 semaines"),
    _indicator("produits_total", "Produits", Source.OPEN_FOOD_FACTS, "cumul"),
    _indicator(
        "produits_nouveaux_12m", "Nouveaux produits", Source.OPEN_FOOD_FACTS, "12 mois"
    ),
    _indicator(
        "produits_croissance_12m_pct",
        "Croissance des produits (%)",
        Source.OPEN_FOOD_FACTS,
        "12 mois",
    ),
    _indicator("marques_distinctes", "Marques", Source.OPEN_FOOD_FACTS, "cumul"),
    _indicator("pays_distincts", "Pays", Source.OPEN_FOOD_FACTS, "cumul"),
    _indicator("mentions_presse_30j", "Mentions presse", Source.PRESS, "30 jours"),
    _indicator("mentions_reseaux_30j", "Mentions réseaux", Source.SOCIAL, "30 jours"),
    _indicator("youtube_vues_30j", "Vues YouTube", Source.SOCIAL, "30 jours"),
    _indicator("likes_30j", "Likes", Source.SOCIAL, "30 jours"),
    _indicator("part_sponsorise_30j", "Part sponsorisée", Source.SOCIAL, "30 jours"),
    _indicator(
        "pinterest_tendances_30j", "Tendances Pinterest", Source.PINTEREST, "30 jours"
    ),
)

INDICATOR_KEYS: tuple[str, ...] = tuple(indicator.key for indicator in INDICATORS)

# Croissance mise en avant (tri par défaut, top KPI) : la seule fournie par les deux
# origines. Data/IA précise que seule la croissance relative Wikipédia s'interprète
GROWTH_INDICATOR = "wiki_croissance_12m_relative"
# Un arôme sans produit en rayon : signal de qualité du jeu de données
PRODUCTS_INDICATOR = "produits_total"
