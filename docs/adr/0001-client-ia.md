# 0001. Appeler l'IA par le contrat compatible OpenAI

- Statut : remplacée par [0011](0011-retrait-questions-ia.md)
- Date : 2026-11-08 (mise à jour le 2026-11-10 : API en Python, voir [0004](0004-backend-fastapi.md))
- Décideurs : Arnaud Fischer

## Contexte

En dev, Ollama local (`llama3.2:1b`, gratuit, sans clé) ; pour la démo, peut-être un fournisseur commercial (Mistral, OpenAI…). Changer de fournisseur ne doit pas toucher au code.

## Options

1. SDK d'un fournisseur (`openai`, `mistralai`, `ollama`) : lie le code au fournisseur.
2. Abstraction (LangChain, LiteLLM) : lourd pour un seul appel.
3. `httpx` sur `/chat/completions` compatible OpenAI : exposé par Ollama, Mistral, OpenAI… ; ni types ni streaming fournis.

## Décision

Option 3, dans [`api/app/clients/ai.py`](../../api/app/clients/ai.py) :

| Mode | Classe                     | Activé quand             | Appel                                   |
| ---- | -------------------------- | ------------------------ | --------------------------------------- |
| 1    | `OpenAICompatibleProvider` | `DATA_AI_URL` vide       | `POST {AI_BASE_URL}/chat/completions`   |
| 2    | `DataTeamProvider`         | `DATA_AI_URL` renseignée | contrat de l'équipe Data/IA (`/answer`) |

Règles :

- Tout appel à l'IA passe par l'interface `AnswerProvider` de [`services/ports.py`](../../api/app/services/ports.py). Jamais de SDK de fournisseur.
- Le fournisseur se change dans `api/.env` (`AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`, exemples dans [`api/.env.example`](../../api/.env.example)), jamais dans le code.
- Seul `get_answer_provider` de [`api/deps.py`](../../api/app/api/deps.py) choisit le mode.
- Toute erreur ou réponse inattendue du fournisseur devient une `AIProviderError` (HTTP `502`, détail dans les logs uniquement).

## Conséquences

- Positives : changer de fournisseur = modifier `api/.env` + `docker compose restart api` ; aucun SDK à maintenir ; IA simulable avec `httpx.MockTransport` ([0003](0003-tests.md)).
- Négatives : réponse non typée (`choices[0].message.content` lu à la main) ; pas de streaming ; fonctions propres à un fournisseur inaccessibles.
- À revoir si : besoin de streaming ou d'appels d'outils ; fournisseur sans endpoint compatible OpenAI.
