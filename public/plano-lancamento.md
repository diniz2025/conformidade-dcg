# PLANO DE LANCAMENTO — CONFORMIDADE DCG
## Redes Sociais + Monetizze + Hotmart + Programa de Afiliados

Data: 17/04/2026

---

## 1. MODELO DE COMISSOES ATUALIZADO

### Planos de Saude Empresariais

A DCG recebe as 3 primeiras parcelas como comissao das operadoras.

| Parcela | Destino |
|---|---|
| 1a parcela | 50% Contador + 50% Revendedor Hotmart/Monetizze |
| 2a parcela | 100% DCG |
| 3a parcela | 100% DCG |
| 4a em diante | Comissao recorrente DCG |

Exemplo: Empresa 10 funcionarios, PME R$ 750/vida
- Faturamento mensal: R$ 7.500
- 1a parcela comissao (~8%): R$ 600
- Contador recebe: R$ 300 (50%)
- Revendedor recebe: R$ 300 (50%)
- DCG fica com 2a e 3a: R$ 1.200

### Conformidade DCG (SaaS):

| Canal | Comissao | Recorrencia |
|---|---|---|
| Contador direto | 20% | Mensal permanente |
| Contador especial | 25% | Mensal permanente |
| Revendedor Hotmart/Monetizze | 30% | Mensal permanente |
| Afiliado organico | 20% | Mensal permanente |

### Seguros em geral — mesma logica 50/50 da 1a parcela

---

## 2. ESTRATEGIA HOTMART

Nome: Conformidade DCG — Monitoramento de Obrigacoes Empresariais
Tipo: Assinatura recorrente
Categoria: Negocios e Carreira

Planos Hotmart (precos maiores para cobrir taxas):
- Starter: R$ 29,90/mes (afiliado ganha 30% = R$ 8,97)
- Pro: R$ 79,90/mes (afiliado ganha 30% = R$ 23,97)
- Agency: R$ 197,00/mes (afiliado ganha 30% = R$ 59,10)

Free NAO entra na Hotmart — exclusivo do site.
Garantia: 7 dias reembolso incondicional.

Webhook: POST /api/webhook/hotmart
Eventos: PURCHASE_COMPLETE, SUBSCRIPTION_CANCELLATION, PURCHASE_REFUNDED

## 3. ESTRATEGIA MONETIZZE

Mesmo produto, mesmos precos, mesmos webhooks.
Webhook: POST /api/webhook/monetizze
Comissao afiliado: 30%
Taxa Monetizze menor (~8% vs 10% Hotmart)
Base de afiliados mais qualificada para B2B.

---

## 4. CALENDARIO REDES SOCIAIS (14 DIAS)

### SEMANA 1 — AQUECIMENTO

Dia 1 (Qui): LinkedIn — Post autoridade Diniz (historia pessoal)
Dia 2 (Sex): Instagram — Carrossel "3 obrigacoes que podem fechar sua empresa"
Dia 3 (Sab): WhatsApp Status — Bastidores: "construi um SaaS em uma noite"
Dia 4 (Dom): Facebook — Post educativo DTE com base legal
Dia 5 (Seg): LinkedIn — Post curto: "Contadores: 20% recorrente"
Dia 6 (Ter): Instagram Reels — Video 30s demonstracao do painel
Dia 7 (Qua): TODOS — LANCAMENTO OFICIAL

### SEMANA 2 — ESCALA

Dia 8 (Qui): LinkedIn + Google Ads (R$ 30/dia)
Dia 9 (Sex): Instagram Stories — Depoimento testadores
Dia 10 (Sab): YouTube — Video tutorial 5 min
Dia 11 (Dom): Facebook Ads — Carrossel retargeting (R$ 40/dia)
Dia 12 (Seg): LinkedIn — Caso de uso: restaurante evitou multa
Dia 13 (Ter): Hotmart/Monetizze — Ativacao de afiliados
Dia 14 (Qua): Email marketing — Campanha SIAV/SINCOR

---

## 5. FUNIL INTEGRADO

TOPO (Awareness):
LinkedIn + Instagram + Facebook + TikTok + Google Ads + YouTube
Conteudo educativo: DTE, DJE, e-BEF
Meta: 10.000 impressoes/semana

MEIO (Consideracao):
Site conformidade.dcgseguros.com.br
Consulta CNPJ gratuita + pagina de planos + tutorial
Meta: 500 visitas/semana

FUNDO (Conversao):
Cadastro Free (direto) + Hotmart/Monetizze (afiliados) + WhatsApp
Meta: 50 cadastros/semana

POS-VENDA (Expansao):
Upgrade Free para Pago
Cross-sell: Plano de Saude Empresarial
Cross-sell: Seguros (Vida, Patrimonial, RC)
Meta: 20% conversao Free para Pago em 30 dias
Meta: 10% conversao para plano de saude

---

## 6. ORCAMENTO MARKETING (30 DIAS)

| Canal | Investimento | Retorno esperado |
|---|---|---|
| Google Ads | R$ 900/mes | 15-30 cadastros |
| Facebook/Instagram Ads | R$ 1.200/mes | 20-40 cadastros |
| LinkedIn Ads (opcional) | R$ 600/mes | 50-100 cliques B2B |
| Producao conteudo | R$ 0 (Diniz + IA) | Organico constante |
| Hotmart/Monetizze | R$ 0 (comissao no sucesso) | Escala via afiliados |
| TOTAL | R$ 2.700/mes | 35-70 cadastros pagos |

ROI esperado:
- 50 clientes pagos (mix): ~R$ 3.500/mes receita
- Investimento: R$ 2.700/mes
- ROI mes 1: 30% positivo
- ROI mes 3: 200%+ (base recorrente)

## 7. METAS

Cadastros Free: Mes 1=200, Mes 3=1000, Mes 6=5000
Clientes pagos: Mes 1=30, Mes 3=150, Mes 6=500
MRR: Mes 1=R$2000, Mes 3=R$10000, Mes 6=R$35000
Parceiros: Mes 1=10, Mes 3=50, Mes 6=150
Afiliados: Mes 1=20, Mes 3=100, Mes 6=300

## 8. CRONOGRAMA

Sem 1: Corrigir site + feedback testadores
Sem 2: Contas Hotmart e Monetizze + webhooks
Sem 3: Lancamento redes + Google Ads
Sem 4: Email SIAV SINCOR + Facebook Ads

## 9. WEBHOOKS

Hotmart: POST /api/webhook/hotmart
Monetizze: POST /api/webhook/monetizze
Prazo: 3-4 dias

Compliance e a porta. Saude e seguros sao a casa.
