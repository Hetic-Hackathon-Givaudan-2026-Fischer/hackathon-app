# 0011. Retirer les questions posées à l'IA

- Statut : acceptée
- Date : 2026-11-12
- Décideurs : Arnaud Fischer

## Contexte

Le socle servait `POST/GET /api/v1/questions` : une question envoyée à une IA (Ollama, ou `POST /answer` chez l'équipe Data/IA), l'échange stocké en base. L'API Data/IA réelle n'a pas de route `/answer`, et le prototype (dashboard, rapport, showroom) n'utilise pas les questions.

## Options

1. Garder les questions sur Ollama : une IA locale à installer pour une fonction que personne n'utilise.
2. Les retirer : moins de code, plus d'Ollama à installer.

## Décision

Option 2. Remplace l'[ADR 0001](0001-client-ia.md).

Règles :

- Plus de route `/questions`, de table `questions`, de client IA (`clients/ai.py`), de variables `AI_*` ni d'Ollama dans `setup.sh`.
- La seule source externe de l'API est l'API Data/IA, en lecture ([0008](0008-source-tendances-repli.md)).
- Une future fonction d'IA générative repart d'un nouvel ADR.

## Conséquences

- Positives : Docker seul prérequis ; `DATA_AI_URL` ne sert plus qu'aux tendances ; moins de code à maintenir.
- Négatives, à accepter : une base déjà créée garde sa table `questions` (inutile, sans effet) ; `DROP TABLE questions;` pour la retirer.
- À revoir si : le prototype a besoin d'une IA générative (résumé, chat sur les tendances).
