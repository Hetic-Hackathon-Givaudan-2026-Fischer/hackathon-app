# 0001. Appeler l'IA par le contrat compatible OpenAI

- Statut : acceptée
- Date : 2026-11-08
- Décideurs : Arnaud Fischer

## Contexte

Le produit envoie des questions à un modèle de langage et stocke ses réponses. En développement, chacun utilise Ollama sur sa machine (`llama3.2:1b`) : gratuit, sans clé. Pour la démo, ou si un modèle local ne suffit pas, l'équipe pourra passer sur un fournisseur commercial (Mistral, OpenAI…). Le hackathon dure deux semaines : changer de fournisseur ne doit pas obliger à reprendre le code.

## Options

1. SDK d'un fournisseur (`openai`, `@mistralai/mistralai`, `ollama`) : typé, prêt à l'emploi. Lie le code à ce fournisseur : en changer, c'est réécrire les appels.
2. Couche d'abstraction (LangChain, Vercel AI SDK) : beaucoup de fournisseurs. Beaucoup de dépendances et de concepts à apprendre pour un seul appel.
3. `fetch` sur l'endpoint `/chat/completions` compatible OpenAI : exposé par Ollama, Mistral, OpenAI et la plupart des autres. Pas de types ni de streaming tout prêts.

## Décision

Nous choisissons l'option 3 : une seule fonction `ask()`, dans `api/src/index.ts`, appelle `${AI_BASE_URL}/chat/completions` avec `fetch`. Le fournisseur se choisit dans `api/.env` avec trois variables (`AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`), parce que c'est la seule option où changer de fournisseur ne touche pas au code. Tout nouvel appel à l'IA passe par cette fonction.

Le mode 2 (API de l'équipe Data/IA, fonction `askDataTeam()`) suit le contrat de cette équipe et n'est pas concerné.

## Conséquences

- Positives : passer d'Ollama à Mistral, c'est modifier `api/.env` puis `docker compose restart api` ; aucune dépendance à maintenir ; les exemples sont commentés dans `api/.env.example`.
- Négatives, à accepter : la réponse n'est pas typée (`data.choices[0].message.content`) ; pas de streaming ; les fonctions propres à un fournisseur, hors du contrat commun, ne sont pas accessibles.
- À revoir si : nous avons besoin du streaming ou des appels d'outils, ou si le fournisseur retenu n'expose pas d'endpoint compatible OpenAI.
