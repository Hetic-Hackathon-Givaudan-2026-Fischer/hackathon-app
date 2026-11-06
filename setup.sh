#!/bin/sh
# Vérifie que la machine a tout ce qu'il faut, puis démarre toute la stack.
# Relançable sans risque : ce qui est déjà fait est sauté.
# Usage : ./setup.sh   (Linux, macOS, ou Git Bash / WSL sous Windows)
set -eu
cd "$(dirname "$0")"

PORTS="3000 5173 5433"
OLLAMA_PORT=11434

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

# Le script pilote Docker et Ollama de la machine : inutile dans le dev container
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

# Ollama local n'est utile qu'en mode 1, avec l'URL qui pointe sur l'hôte
needs_local_ollama() {
  [ -z "$(env_value DATA_AI_URL)" ] &&
    env_value AI_BASE_URL | grep -q 'host.docker.internal'
}

# --- Ollama ------------------------------------------------------------------

check_ollama_running() {
  has ollama || fail "Ollama introuvable" "https://ollama.com/download"
  ollama list >/dev/null 2>&1 ||
    fail "Ollama est installé mais ne tourne pas" "Lance l'app Ollama ou 'ollama serve'"
  ok "Ollama tourne"
}

# Sous Linux, le conteneur api ne joint Ollama que s'il écoute sur toutes les
# interfaces (voir README, section 1)
check_ollama_listen() {
  [ "$(uname -s)" = Linux ] || return 0
  if ! has ss; then
    warn "Impossible de vérifier l'écoute d'Ollama (ss absent)"
    return 0
  fi
  ss -ltn | grep -Eq "(0\.0\.0\.0|\*|\[::\]):$OLLAMA_PORT\b" ||
    fail "Ollama n'écoute que sur 127.0.0.1 : le conteneur api ne pourra pas le joindre" \
      "Voir README, section 1 : OLLAMA_HOST=0.0.0.0"
  ok "Ollama écoute sur toutes les interfaces"
}

ensure_model() {
  model=$(env_value AI_MODEL)
  [ -n "$model" ] || fail "AI_MODEL est vide dans api/.env"
  if ollama list | awk 'NR > 1 { print $1 }' | grep -qx "$model"; then
    ok "Modèle $model déjà téléchargé"
  else
    warn "Téléchargement du modèle $model (une seule fois)"
    ollama pull "$model"
  fi
}

check_ai() {
  step "IA"
  if ! needs_local_ollama; then
    ok "Ollama local inutile avec la config actuelle de api/.env"
    return 0
  fi
  check_ollama_running
  check_ollama_listen
  ensure_model
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
# db et install suivent via depends_on
start_stack() {
  step "Démarrage de la stack (le premier lancement télécharge les images)"
  docker compose up -d --wait api web ||
    fail "La stack n'a pas démarré" "Regarde les logs : docker compose logs install api web db"
  ok "Tous les services sont sains"
}

print_summary() {
  step "C'est prêt"
  printf '  Front        http://localhost:5173\n'
  printf '  API          http://localhost:3000/api/health\n'
  printf '  PostgreSQL   localhost:5433 (user/mdp : app)\n'
  printf '\n  Arrêter : docker compose down\n'
}

main() {
  check_host
  check_docker
  ensure_env_file
  check_ai
  check_ports
  start_stack
  print_summary
}

main "$@"
