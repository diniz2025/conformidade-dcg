#!/bin/bash
cd /var/www/conformidade-dcg
CHANGES=$(git status --porcelain | wc -l)
if [ "$CHANGES" -gt 0 ]; then
  git add .
  git -c user.email="diniz@dcgseguros.com.br" -c user.name="Diniz DCG" commit -m "Auto-backup $(date +%Y-%m-%d_%H:%M)"
  git push origin main
  echo "[$(date)] Backup: $CHANGES arquivos alterados"
else
  echo "[$(date)] Backup: sem alteracoes"
fi
