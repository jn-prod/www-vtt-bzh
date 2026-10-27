#!/usr/bin/env bash
# Fenêtre protégée en CI : attend le prochain créneau au lieu d'échouer. Même règle que
# corp-ai/hooks/fenetre-protegee.sh (en semaine de 08:00 à 13:00 et de 14:00 à 20:00, heure
# de Paris), sans les fériés ni les congés : corp-ai est privé, d'où la case « maintenant ».
# Attente plafonnée à 350 min, sous la limite de 6 h d'un job : le job suivant attend le reste.
set -eu

now=$(date +%s)
jour=$(TZ=Europe/Paris date +%F)
hm=$((10#$(TZ=Europe/Paris date +%H%M)))
fin=""
if [ "$(TZ=Europe/Paris date +%u)" -le 5 ]; then
  if [ "$hm" -ge 800 ] && [ "$hm" -lt 1300 ]; then fin="13:00"; fi
  if [ "$hm" -ge 1400 ] && [ "$hm" -lt 2000 ]; then fin="20:00"; fi
fi
if [ -z "$fin" ]; then
  echo "Hors fenêtre protégée : on y va."
  exit 0
fi

attente=$(($(TZ=Europe/Paris date -d "$jour $fin" +%s) - now))
[ "$attente" -gt 21000 ] && attente=21000
echo "::notice::Fenêtre protégée : départ à $fin (heure de Paris). Annuler le run pour renoncer."
sleep "$attente"
