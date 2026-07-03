## Plano de implementação — CognIA (onda 4)

Vou executar em **4 fases** para reduzir risco de regressão. Cada fase é um bloco independente e testável. Todos os dados continuam mockados, sem integrações externas.

---

### Fase 0 — Correções rápidas + Login (entrega imediata)

1. **Background da tela de login**
   - Copiar `user-uploads://ChatGPT_Image_2_de_jul._de_2026_11_40_50.png` para `src/assets/login-bg.jpg`.
   - Aplicar como `background-image` em `src/routes/login.tsx` com overlay escuro + gradiente radial azul/ciano/roxo por cima, mantendo o card de login em glass.

2. **Bug do menu Matriz de Confrontos Fiscais**
   - Em `src/components/cognia/Sidebar.tsx`, a regra atual `path === to || (to !== "/dashboard" && path.startsWith(to))` faz `/tax-confrontation-matrix` casar com `/tax`.
   - Trocar por match **exato** por padrão, com uma allowlist explícita para rotas que têm filhos (`/legal`, `/tax`, `/radar` — apenas com `/legal/`, `/tax/`, `/radar/` seguido de `/`, nunca prefixo puro).

3. **Destaque da aba "Sugestões da IA" em `/jurimetry`**
   - Badge com contagem no TabsTrigger, ícone `Sparkles`, glow ciano/roxo.
   - Card de call-to-action no topo da aba "Visão Geral" apontando para Sugestões.
   - Alerta executivo quando houver sugestões críticas.

---

### Fase 1 — Fundação de dados + tipos

Criar `src/lib/cognia/operationsMock.ts` (novo arquivo, sem tocar nos existentes) com:
- 50 movimentações processuais mockadas
- 20 minutas/petições
- 40 eventos de Agenda Geral
- 30 pendências operacionais
- 20 sugestões de peças
- 8 fontes externas simuladas (Jusbrasil, PJe, Projudi, e-SAJ, TRT, TST, Diários Oficiais, CSV)
- Logs pré-populados dos novos módulos

Estender `src/lib/cognia/types.ts` com: `ProcessMovement`, `LegalDraft`, `AgendaEvent`, `WorkQueueItem`, `SyncSource`, `ClientPole`, `LegalStrategy`.

Estender `src/lib/cognia/store.ts` adicionando os arrays acima ao state (versão do storage bump para `cognia.state.v3` com migração que preserva o v2 anterior — nada apagado).

Adicionar campos `clientPole` e `strategy` (opcionais, retrocompatíveis) em `LegalAnalysis`.

---

### Fase 2 — Módulos operacionais

Criar 4 rotas novas + entradas de menu na Sidebar:

1. **`/admin/process-update-engine`** — Motor Atualizador de Processos (Admin only)
   - KPIs, cards de fontes com "Executar sincronização mockada", tabela de movimentações, painel lateral de reprocessamento com risco anterior vs recalculado, ações que geram logs `process_update_engine.*`.

2. **`/legal-drafts`** — Gera Minutas e Petições
   - KPIs, botão "Nova minuta", wizard de 5 etapas (Tipo de atuação → Dados → Pedidos/valores → Estratégia → Geração), editor com histórico, tabela de minutas, aviso permanente de "minuta para revisão humana", logs `legal_draft.*`.
   - Botão "Gerar minuta ou petição" nas telas de processo (`/legal/$id`).

3. **`/general-agenda`** — Agenda Geral
   - KPIs, alternância Hoje/Semana/Mês/Lista/Kanban, painel "O que vence hoje", alertas, integração visual com origem (Motor Atualizador, Sugestões IA, Malha Fiscal, etc.), logs `general_agenda.*`.

4. **`/work-queue`** — Central de Pendências
   - Cards de resumo, filtros (área, prioridade, responsável, origem, status), tabela com ações (abrir, concluir, delegar, criar tarefa, enviar validação, abrir na Agenda).

---

### Fase 3 — Ajustes transversais

1. **Polo ativo × polo passivo** no Legal Engine, Jurimetria, Gera Minutas e Agenda:
   - Campo "Posição do cliente" e "Estratégia principal" nos formulários.
   - Ajuste de linguagem condicional (tese inicial/pedidos vs tese defensiva/contestação).
   - Filtro "Perspectiva" (Todos/Ativo/Passivo) na Jurimetria + novos indicadores (êxito como autor, valor médio pleiteado, recuperação estimada em ações ativas).

2. **Dashboard principal** — adicionar 5 widgets:
   - Motor Atualizador (Admin only), Agenda Geral, Sugestões da IA, Gera Minutas, Central de Pendências.

3. **Permissões mockadas** — helper `canAccess(route, role)` em `store.ts`; itens de menu ocultados quando o perfil ativo não tem acesso.

4. **Topbar breadcrumbs** — mapear novas rotas.

---

### Detalhes técnicos

- **Arquivos novos:** 4 rotas + 1 mock + 1 widget de dashboard + editor de minuta (componente).
- **Arquivos alterados:** `Sidebar.tsx`, `Topbar.tsx`, `store.ts`, `types.ts`, `login.tsx`, `dashboard.tsx`, `jurimetry.tsx`, `legal.$id.tsx`, `settings.tsx` (para trocar de perfil mockado).
- **Padrão visual:** glass-card, tokens `--cyan/--primary/--purple/--risk/--warning/--success`, `fmtBRL`, `fmtDate`, `fmtDateTime`, toasts sonner, badges existentes.
- **Migração de storage:** ler v2 existente, mesclar com defaults dos novos campos, gravar como v3. Nenhum dado do usuário é perdido.
- **Verificação:** build + navegação Playwright pelas rotas novas + screenshot da tela de login com o novo background.

---

### O que **não** vou fazer

- Nenhuma remoção de rota, componente ou dado atual.
- Nenhuma integração real com Jusbrasil/PJe/tribunais/Receita.
- Nenhuma alteração no visual das telas já entregues além dos widgets/badges pedidos.
- Nada de export DOCX real (apenas toast mockado, conforme instrução).

---

### Tamanho e ordem de entrega

Como o escopo é grande, sugiro entregar **Fase 0 sozinha primeiro** (background + bug do menu + destaque Sugestões IA — resolve as dores visíveis imediatas e o pedido explícito do print), e depois seguir Fases 1→2→3 em sequência num próximo turno.

**Confirma essa ordem?** Se preferir que eu vá direto até a Fase 3 num único turno, também posso — só será uma resposta bem mais longa e com mais chance de precisar de ajustes finos depois.
