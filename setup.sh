#!/bin/sh
# Vérifie que la machine a tout ce qu'il faut, puis démarre toute la stack.
# Relançable sans risque : ce qui est déjà fait est sauté.
# Usage : ./setup.sh   (Linux, macOS, ou Git Bash / WSL sous Windows)
set -eu
cd "$(dirname "$0")"

PORTS="3000 5173 5433"

# --- Affichage ---------------------------------------------------------------

if [ -t 1 ]; then
  GREEN='\033[32m' YELLOW='\033[33m' RED='\033[31m' BOLD='\033[1m' RESET='\033[0m'
else
  GREEN='' YELLOW='' RED='' BOLD='' RESET=''
fi

step() { printf '\n%b==> %s%b\n' "$BOLD" "$1" "$RESET"; }
ok() { printf '%b  ✔ %s%b\n' "$GREEN" "$1" "$RESET"; }
warn() { printf '%b  ! %s%b\n' "$YELLOW" "$1" "$RESET"; }
fail() {
  printf '%b  ✘ %s%b\n' "$RED" "$1" "$RESET" >&2
  [ $# -gt 1 ] && printf '    → %s\n' "$2" >&2
  exit 1
}

has() { command -v "$1" >/dev/null 2>&1; }

# --- Hôte --------------------------------------------------------------------

# Le script pilote le Docker de la machine : inutile dans le dev container
check_host() {
  [ -f /.dockerenv ] || [ -f /run/.containerenv ] || return 0
  fail "setup.sh se lance depuis ta machine, pas depuis le dev container" \
    "Ouvre un terminal sur l'hôte, dans le dossier du projet, puis relance ./setup.sh"
}

# --- Docker ------------------------------------------------------------------

check_docker() {
  step "Docker"
  has docker || fail "Docker introuvable" "https://docs.docker.com/get-docker/"
  docker info >/dev/null 2>&1 ||
    fail "Le démon Docker ne répond pas" \
      "Démarre Docker (Desktop ou 'sudo systemctl start docker'), et sous Linux ajoute-toi au groupe docker"
  docker compose version >/dev/null 2>&1 ||
    fail "Docker Compose v2 introuvable" "https://docs.docker.com/compose/install/"
  ok "$(docker compose version)"
}

# --- Configuration de l'API (api/.env) ---------------------------------------

ensure_env_file() {
  step "Configuration"
  if [ -f api/.env ]; then
    ok "api/.env existe déjà"
  else
    cp api/.env.example api/.env
    ok "api/.env créé à partir de api/.env.example"
  fi
}

# Dernière valeur de la clé $1 dans api/.env (vide si absente ou commentée)
env_value() { sed -n "s/^$1=//p" api/.env | tail -n 1; }

# Sans DATA_AI_URL, l'API sert le CSV de repli : utilisable, mais sans modèle
check_data_ai() {
  step "Données"
  if [ -n "$(env_value DATA_AI_URL)" ]; then
    ok "API Data/IA : $(env_value DATA_AI_URL) (CSV en repli si elle ne répond pas)"
  else
    warn "DATA_AI_URL vide dans api/.env : tendances lues dans le CSV, sans modèle"
  fi
}

# --- Ports -------------------------------------------------------------------

port_in_use() {
  if has ss; then
    ss -ltnH "sport = :$1" | grep -q .
  elif has lsof; then
    lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
  else
    return 1
  fi
}

# Une stack déjà lancée occupe ses propres ports : rien à vérifier dans ce cas
check_ports() {
  step "Ports"
  if [ -n "$(docker compose ps -q --status running)" ]; then
    ok "La stack tourne déjà, elle sera mise à jour"
    return 0
  fi
  for port in $PORTS; do
    port_in_use "$port" &&
      fail "Le port $port est déjà pris" "Libère-le (autre projet ?) puis relance ./setup.sh"
  done
  ok "Ports $PORTS libres"
}

# --- Démarrage ---------------------------------------------------------------

# Pas « dev » : c'est le poste de travail des éditeurs, qui le lancent eux-mêmes.
# db et install suivent via depends_on. --build : l'image de l'API est reconstruite
# si api/Dockerfile ou uv.lock ont changé (sinon, le cache la rend instantanée)
start_stack() {
  step "Démarrage de la stack (le premier lancement télécharge et construit les images)"
  docker compose up -d --build --wait api web ||
    fail "La stack n'a pas démarré" "Regarde les logs : docker compose logs install api web db"
  ok "Tous les services sont sains"
}

print_summary() {
  step "C'est prêt"
  printf '  Front        http://localhost:5173\n'
  printf '  API          http://localhost:3000/api/v1/health\n'
  printf '  Swagger      http://localhost:3000/api/docs\n'
  printf '  PostgreSQL   localhost:5433 (user/mdp : app)\n'
  printf '\n  Arrêter : docker compose down\n'
}

main() {
  check_host
  check_docker
  ensure_env_file
  check_data_ai
  check_ports
  start_stack
  print_summary
}

main "$@"
