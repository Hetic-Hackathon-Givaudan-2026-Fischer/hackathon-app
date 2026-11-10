# 0005. Scanner secrets et vulnérabilités en CI avec TruffleHog et Trivy

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : Arnaud Fischer

## Contexte

Humains et agents IA commitent en parallèle. Ni le lint ni les tests ne détectent un secret commité (à révoquer une fois poussé) ou une dépendance, une image ou une config Docker vulnérable.

## Options

1. Relecture seule : rien ne bloque.
2. Outils GitHub (Dependabot, secret scanning) : dépend de l'offre GitHub, pas de scan d'image ni de config Docker.
3. `pip-audit` + `npm audit` + Gitleaks : trois outils, pas d'image ni de config, secrets non vérifiés.
4. TruffleHog + Trivy : deux outils couvrent tout, secrets vérifiés auprès des fournisseurs.

## Décision

Option 4, dans [`.github/workflows/security.yml`](../../.github/workflows/security.yml), sur chaque PR et chaque push sur `main` / `develop` :

| Job           | Outil      | Scanne                                                      | Bloque si                                                       |
| ------------- | ---------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| `secrets`     | TruffleHog | les commits de la PR ou du push                             | secret vérifié ou invérifiable                                  |
| `trivy-repo`  | Trivy      | `uv.lock`, `package-lock.json`, `Dockerfile`, `compose.yml` | vulnérabilité corrigeable ou mauvaise config, `HIGH`/`CRITICAL` |
| `trivy-image` | Trivy      | l'image `prod` de [`api/Dockerfile`](../../api/Dockerfile)  | vulnérabilité corrigeable, `HIGH`/`CRITICAL`                    |

Règles :

- Toute action tierce est épinglée par SHA de commit, tag en commentaire. Jamais par tag seul.
- Le workflow reste en `permissions: contents: read`.
- Un job rouge se corrige (montée de version, secret révoqué), jamais en baissant la sévérité ni en retirant le job.
- [`.github/trufflehog-exclude.txt`](../../.github/trufflehog-exclude.txt) ne contient que des fichiers aux identifiants de dev volontaires (`app:app`). Jamais un fichier avec un vrai secret.

## Conséquences

- Positives : secret ou dépendance vulnérable bloqué avant `develop`.
- Négatives : une nouvelle CVE peut faire échouer une PR sans rapport ; SHA des actions à monter à la main ; build d'image à chaque run ; protection de branche sur `develop` nécessaire pour bloquer la fusion.
- À revoir si : trop de faux positifs ; déploiement (scanner l'image du registre) ; besoin de SAST sur notre code (CodeQL, Semgrep).
