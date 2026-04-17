#!/bin/bash
# Conformidade DCG — Preflight Check
# Verifica se tudo esta OK antes de lancar campanhas

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
OK=0
FAIL=0

check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK]${NC} $1"
    OK=$((OK+1))
  else
    echo -e "${RED}[FAIL]${NC} $1"
    FAIL=$((FAIL+1))
  fi
}

echo "============================================"
echo "  CONFORMIDADE DCG - PREFLIGHT CHECK"
echo "  $(date)"
echo "============================================"
echo ""

# 1. PM2 processos
pm2 list | grep -q "dcg-conformidade.*online" && check "API PM2 online" || check "API PM2 online"
pm2 list | grep -q "dcg-conformidade-worker.*online" && check "Worker PM2 online" || check "Worker PM2 online"

# 2. API responde
curl -s -f http://localhost:3060/api/health > /dev/null 2>&1
check "API /health responde (porta 3060)"

# 3. HTTPS publico
curl -s -f -o /dev/null https://conformidade.dcgseguros.com.br
check "Site HTTPS publico acessivel"

# 4. Paginas publicas
for PAGE in "" "app.html" "admin.html" "contadores.html" "como-usar.html" "parceiros-como-usar.html" "redefinir.html"; do
  curl -s -f -o /dev/null "https://conformidade.dcgseguros.com.br/$PAGE"
  check "Pagina /$PAGE carrega"
done

# 5. Database
PGPASSWORD='Cf@DCG2026!seguro' psql -U conformidade_user -d conformidade_dcg -h localhost -c "SELECT COUNT(*) FROM usuarios;" > /dev/null 2>&1
check "PostgreSQL conectando"

# 6. SMTP
node -e 'import("./backend/services/email.js").then(m => m.enviarEmail({para: "diniz@dcgseguros.com.br", assunto: "Preflight test", html: "<p>OK</p>"})).then(r => process.exit(r.ok?0:1))' 2>/dev/null
check "SMTP Gmail Workspace envia"

# 7. Zapi WhatsApp (envia mensagem real de teste)
node -e 'import("./backend/services/whatsapp.js").then(m => m.enviarWhatsApp("5511994104891", "Preflight check - " + new Date().toISOString())).then(r => process.exit(r.ok?0:1))' > /dev/null 2>&1
check "Zapi WhatsApp envia mensagem"

# 8. Mercado Pago
curl -s -f -H "Authorization: Bearer APP_USR-8799654875799159-040307-3d591827b477df7b00952f07a28cabd3-172676304" "https://api.mercadopago.com/users/me" > /dev/null 2>&1
check "Mercado Pago token valido"

# 9. SSL vencimento
DAYS_TO_EXPIRE=$(echo | openssl s_client -servername conformidade.dcgseguros.com.br -connect conformidade.dcgseguros.com.br:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2 | xargs -I {} date -d {} +%s 2>/dev/null | xargs -I {} echo "({} - $(date +%s)) / 86400" | bc 2>/dev/null)
if [ ! -z "$DAYS_TO_EXPIRE" ] && [ "$DAYS_TO_EXPIRE" -gt 30 ]; then
  echo -e "${GREEN}[OK]${NC} SSL valido ($DAYS_TO_EXPIRE dias)"
  OK=$((OK+1))
elif [ ! -z "$DAYS_TO_EXPIRE" ] && [ "$DAYS_TO_EXPIRE" -gt 0 ]; then
  echo -e "${YELLOW}[ATENCAO]${NC} SSL expira em $DAYS_TO_EXPIRE dias (renovar!)"
else
  echo -e "${RED}[FAIL]${NC} SSL: nao foi possivel verificar"
  FAIL=$((FAIL+1))
fi

# 10. Backup GitHub
cd /var/www/conformidade-dcg
git remote -v | grep -q github.com
check "Git remote GitHub configurado"

echo ""
echo "============================================"
echo "  RESULTADO: $OK OK / $FAIL FAIL"
if [ $FAIL -eq 0 ]; then
  echo -e "  ${GREEN}SISTEMA PRONTO PARA LANCAMENTO${NC}"
else
  echo -e "  ${RED}CORRIJA OS ITENS ACIMA ANTES DE LANCAR${NC}"
fi
echo "============================================"
exit $FAIL
