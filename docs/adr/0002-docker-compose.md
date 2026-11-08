# 0002. Lancer la stack avec Docker Compose, le dev container en option

- Statut : acceptée
- Date : 2026-11-08
- Décideurs : Arnaud Fischer

## Contexte

Le socle du projet est préparé avant que l'équipe soit constituée : on ne sait pas encore qui en fera partie, sur quel système (Windows, macOS, Linux), avec quelle version de Node (ou sans Node), ni avec quel éditeur. Beaucoup de développeurs utilisent aujourd'hui des éditeurs récents, pensés pour travailler avec des agents IA (visualisation et pilotage de sous-agents), qui ne prennent pas tous en charge les dev containers.

La stack compte quatre briques : le front, l'API, PostgreSQL et l'IA. Le hackathon dure deux semaines : chacun doit pouvoir la lancer en une commande, sans y passer du temps pris sur le sujet. Le code change en permanence : une modification doit être prise en compte sans redémarrer de conteneur.

## Options

1. Tout installer sur sa machine (Node, PostgreSQL) : rien à apprendre de Docker. Versions différentes d'un poste à l'autre, « ça marche chez moi ».
2. Dev container obligatoire : environnement identique pour tous, outils (ESLint, Prettier, hook pre-commit, `psql`) déjà configurés. Il ne fonctionne qu'avec les éditeurs qui le prennent en charge (ici VS Code et Zed) : un coéquipier sur un autre éditeur doit en changer, ou il faut adapter la configuration à son éditeur avant même de commencer le sujet.
3. Docker Compose comme socle, dev container en option : mêmes services et mêmes versions pour tous, éditeur au choix ; le dev container reste disponible pour ceux qui sont sur VS Code ou Zed.

## Décision

Nous choisissons l'option 3, parce que Docker Compose apporte l'essentiel de ce qu'on attend d'un dev container (mêmes versions de Node et de PostgreSQL, mêmes services, Docker comme seul prérequis) sans dépendre de l'éditeur, pour un temps de mise en place comparable. Ce que le dev container ajoute, les outils préconfigurés, relève du confort : ça ne justifie pas d'imposer un éditeur à une équipe qu'on ne connaît pas encore.

- **Docker Compose est la méthode par défaut.** `compose.yml` lance `db`, `install`, `api` et `web`. `setup.sh` rend l'installation rapide pour tous : il vérifie les prérequis (Docker, Ollama si besoin, ports libres), crée `api/.env` et démarre la stack jusqu'à ce que tous les services soient sains. Un nouvel arrivant est prêt en une commande, quel que soit son éditeur.
- **Le dev container est une option pour VS Code et Zed.** Il s'attache au service `dev` du même `compose.yml`, qui fournit Node, git, `psql`, ESLint et Prettier déjà configurés : il ne duplique pas la stack et ne coûte rien à ceux qui ne s'en servent pas. Il n'est pas adapté d'avance à d'autres éditeurs : on ne l'étend que si un coéquipier le demande.

Pour que le code se recharge en temps réel dans les deux cas :

- le dossier du projet est monté dans les conteneurs (`.:/workspace`) ;
- l'API tourne avec `tsx watch`, le front avec le serveur de développement de Vite ;
- le service `install` ne relance `npm ci` que si `package-lock.json` a changé, pour ne pas vider `node_modules` sous un `tsx` en marche ;
- les healthchecks et `depends_on` démarrent les services dans l'ordre : base saine, puis API saine, puis front.

Les ports ne sont publiés que sur `127.0.0.1`, et le dev container n'a pas accès à Docker : monter le socket Docker lui donnerait un accès root à la machine.

## Conséquences

- Positives : chacun garde son éditeur et peut travailler sur le sujet dès `./setup.sh` terminé ; Docker est le seul prérequis (avec Ollama en mode 1) ; mêmes versions de Node (24) et de PostgreSQL (17) sur tous les postes et en CI ; une modification de code est prise en compte sans redémarrage.
- Négatives, à accepter : deux terminaux à distinguer (la machine pour `docker compose`, `setup.sh` et `ollama` ; le conteneur `dev` pour `npm run lint`, `git`, `psql`) ; une modification de `api/.env` n'est lue qu'au démarrage de l'API : il faut `docker compose restart api`, depuis la machine, même quand on code dans le conteneur `dev` ; sans dev container, ESLint, Prettier et le hook pre-commit demandent Node sur la machine ; une modification de `.devcontainer/` oblige à recréer le conteneur.
- À revoir si : toute l'équipe est finalement sur VS Code ou Zed (le dev container peut alors devenir la méthode recommandée) ; un poste ne détecte pas les modifications à travers le montage (cas connu des dossiers Windows hors WSL : passer `tsx` et Vite en polling) ; l'application doit être déployée (il faudra des images de production, cette configuration est faite pour le développement).
