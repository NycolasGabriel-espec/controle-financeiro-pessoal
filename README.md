# Controle Financeiro Pessoal

Dashboard em português para registrar receitas e despesas, analisar hábitos de consumo e acompanhar o planejamento financeiro. Os valores são exibidos em reais (BRL).

## Estado do projeto

O dashboard inclui extrato completo, pagamentos e recebimentos pendentes, comparação mensal equivalente, previsão por compromissos registrados, contas, cartões e parcelas. As rotinas de recorrências e renovação de orçamentos são configuradas individualmente e executadas no banco mesmo com o site fechado. A implementação e a validação estão em [`docs/dashboard-e-automacoes.md`](docs/dashboard-e-automacoes.md).

## Funcionalidades

- Dashboard animado com saldo em destaque, transições de valores, gráficos interativos e navegação responsiva. As animações respeitam a preferência por movimento reduzido; a direção e a validação estão em [`docs/dashboard-animado.md`](docs/dashboard-animado.md).

- Criar, editar e excluir receitas e despesas, distinguindo pendente de pago/recebido. Confirmações exigem data até hoje; os indicadores usam a data de pagamento quando informada.
- Acessar todas as movimentações com paginação de 10, 25 ou 50 linhas, ordenação por data/valor e filtro por status.
- Importar CSV em UTF-8, reconhecer cabeçalhos e formatos brasileiros, mapear colunas, salvar formatos e selecionar individualmente as linhas. Possíveis duplicatas, inclusive dentro do arquivo, começam desmarcadas e podem ser incluídas após revisão.
- Filtrar por mês, tipo, categoria e texto. Os indicadores, gráficos e exportação refletem tipo, categoria e texto selecionados; os valores mensais usam o mês escolhido.
- Exibir receitas, despesas, saldo, taxa de economia, renda comprometida e participação das categorias.
- Comparar o mês em andamento até hoje com os mesmos dias do anterior, respeitando meses curtos; meses passados usam períodos completos. Os gráficos mostram valores realizados.
- Ver próximos vencimentos, atrasos e previsão de fechamento: resultado realizado + receitas pendentes − despesas pendentes. A previsão explicita que não contempla valores ainda não registrados nem saldos iniciais.
- Definir limites por categoria e receber alertas em 80% e 100%. Orçamentos e alertas consideram todas as despesas realizadas do mês, independentemente dos filtros do extrato.
- Criar metas com saldo inicial declarado, alvo e prazo; acompanhar aportes em despesas realizadas vinculadas e o valor mensal necessário para cumprir o prazo. O saldo inicial não deve incluir os mesmos aportes vinculados.
- Cadastrar recorrências, lançá-las como pendentes ou ativar a geração automática. A rotina evita repetir a recorrência no mês, inclusive se o vencimento do modelo mudar.
- Renovar limites do mês anterior uma vez por mês, preservando limites definidos e registros removidos após a geração.
- Salvar regras pessoais de categoria por palavra ou trecho da descrição. A regra mais específica preenche novos registros e importações; a pessoa pode ajustar a categoria.
- Cadastrar bancos e carteiras com saldo inicial e data; registrar transferências próprias sem somá-las às receitas ou despesas.
- Cadastrar cartões, dividir compras em parcelas com centavos preservados e consultar faturas por vencimento. Pagar uma fatura confirma as parcelas existentes na conta selecionada, sem criar outra despesa.
- Consultar resumo automático dos últimos sete dias, próximos compromissos e atrasos; atualizar os dados ao voltar ao app e a cada cinco minutos enquanto ele estiver visível.
- Gerar até cinco conclusões com base nos dados e filtros disponíveis. A tela informa quando não há registros suficientes para chegar a três conclusões.
- Marcar o mês atual como parcial, informar períodos futuros e explicar quando indicadores não podem ser calculados por falta de denominador.
- Acessar uma demonstração fictícia somente para leitura, sem salvar dados.

## Categorias de movimentação

As opções de despesas incluem Supermercado, Restaurantes e delivery, Moradia, Transporte, Saúde, Lazer, Educação, Assinaturas, Compras e vestuário, Cuidados pessoais, Impostos e taxas, Pets, Presentes e doações, Seguros, Cartão de crédito e Outros. Alimentação continua disponível para manter a compatibilidade com os registros existentes.

As opções de receitas são Salário, Freelance, Vendas, Rendimentos, Aluguéis recebidos, Benefícios, Bônus e comissões, 13º salário e férias, Participação nos lucros, Presentes e doações recebidas, Distribuição de lucros, Royalties e direitos autorais e Outros. As sugestões por descrição reconhecem termos dessas categorias, como comissão, décimo terceiro, PLR e royalties. Orçamentos e recorrências oferecem apenas as opções de despesas. Continua sendo possível digitar categorias personalizadas, e os registros já salvos não são reclassificados automaticamente.

## Indicadores e limites

Os valores armazenados são positivos; `tipo` distingue receitas e despesas. Apenas registros realizados até hoje entram nos indicadores. Compromissos pendentes ficam separados na previsão e nos vencimentos. Os cálculos somam valores em centavos:

| Indicador | Cálculo |
| --- | --- |
| Receitas | Soma dos valores classificados como receita |
| Despesas | Soma dos valores classificados como despesa |
| Saldo do período | Receitas − despesas |
| Taxa de economia | (Saldo do período ÷ receitas) × 100 |
| Renda comprometida | (Despesas ÷ receitas) × 100 |
| Participação da categoria | (Despesas da categoria ÷ despesas totais) × 100 |
| Variação mensal das despesas | ((Despesas atuais − despesas anteriores) ÷ despesas anteriores) × 100 |

Quando um denominador é zero, o indicador aparece como indisponível com o motivo. Uma taxa de economia negativa significa que as despesas passaram das receitas. O saldo não representa necessariamente o saldo bancário porque não há saldo inicial. Comparações do mês atual usam o acumulado até hoje.

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| Next.js 16 e React 19 | Aplicação web e dashboard |
| Supabase Auth e PostgreSQL | Autenticação e armazenamento de dados |
| Supabase Row Level Security | Isolamento de registros por usuário |
| JavaScript e CSS | Cálculos dos indicadores e gráficos da interface |
| Vercel | Hospedagem da aplicação |

O README de planejamento propõe Python, Pandas, Psycopg e FastAPI. Esta versão atende às funcionalidades com Next.js e o cliente Supabase autenticado, conforme a escolha de Supabase para banco e Vercel para site. Não há API FastAPI nem processamento Pandas neste projeto; os cálculos são feitos a partir das linhas autorizadas ao usuário pela RLS. Os gráficos são implementados na interface, sem Plotly.js.

## Executar localmente

O login usa o componente `components/ui/space-login.tsx`, adaptado ao tema grafite da Gestão Finance. Componentes reutilizáveis ficam em `components/ui`, com o alias `@/components/ui`; `components.json` mantém essa estrutura para integrações com shadcn. O projeto oferece TypeScript para os novos componentes e mantém os módulos JavaScript existentes.

Tailwind é configurado em `postcss.config.mjs` e `app/tailwind.css`, que compartilha os tokens do projeto. O reset global existente é preservado. Os estilos visuais do login ficam nos CSS Modules próximos aos componentes. `npm ci` instala TypeScript, Tailwind, Framer Motion, Lucide e as funções de classes; não é necessário executar uma configuração adicional. Para validar os tipos, execute `npm run typecheck`.

Referências de configuração: [Tailwind para Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs) e [estrutura manual do shadcn](https://ui.shadcn.com/docs/installation/manual).

Requisitos: Node.js 20.9 ou superior e um projeto Supabase.

1. Instale as dependências:

   ```bash
   npm ci
   ```

2. Copie `.env.example` para `.env.local` e informe a URL e a chave publicável do Supabase:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   A chave publicável pode estar no navegador; o acesso às linhas é controlado por autenticação e RLS. Não use uma chave `secret` ou `service_role` em uma variável `NEXT_PUBLIC_*`.

3. No SQL Editor do Supabase, execute os arquivos nesta ordem em um banco novo:

   - [`sql/schema.sql`](sql/schema.sql)
   - [`sql/migrations/2026-11-01-financial-planning.sql`](sql/migrations/2026-11-01-financial-planning.sql)
   - [`sql/migrations/2026-11-02-recurring-owner-index.sql`](sql/migrations/2026-11-02-recurring-owner-index.sql)
   - [`sql/migrations/20261103011831_dashboard_foundation.sql`](sql/migrations/20261103011831_dashboard_foundation.sql)
   - [`sql/migrations/20261103020759_financial_automations.sql`](sql/migrations/20261103020759_financial_automations.sql)
   - [`sql/migrations/20261103021346_account_owner_indexes.sql`](sql/migrations/20261103021346_account_owner_indexes.sql)

   Em bancos existentes, aplique apenas as migrações ainda não executadas. As migrações do dashboard são aditivas e preservam os lançamentos existentes como realizados. A migração de automações habilita `pg_cron`; as preferências individuais começam desativadas. O projeto Supabase conectado já recebeu as três novas migrações.

4. Habilite o acesso por e-mail e senha em Authentication. Se a confirmação de e-mail estiver ativa, confirme o endereço antes do login. Em **Authentication → URL Configuration**, inclua a origem local e a origem publicada nas URLs de redirecionamento.

5. Inicie o app:

   ```bash
   npm run dev
   ```

   Acesse `http://localhost:3000`.

## Banco e privacidade

`public.transactions` armazena data, descrição, valor, tipo, categoria e proprietário. `public.budgets` armazena limites por mês/categoria; `public.savings_goals` armazena alvo e progresso declarado; `public.recurring_expenses` armazena os modelos de despesas mensais. `transactions.recorrencia_id` vincula um lançamento ao modelo que o originou e impede que o vínculo aponte para outro proprietário.

As tabelas de planejamento, contas, cartões, transferências, regras, formatos e preferências têm RLS limitada a `auth.uid()`. Os vínculos de contas/cartões/metas/recorrências também verificam o proprietário por chaves estrangeiras compostas. O papel anônimo não recebe acesso. A aplicação usa somente a chave publicável no cliente, sem chave `service_role` nem senha de banco. Funções chamadas pelo navegador usam privilégios do chamador; o agendamento interno não é exposto na API.

A demonstração do botão “Explorar demonstração fictícia” funciona em memória, somente para leitura. “Carregar amostra” dentro da conta salva registros fictícios na conta autenticada e pode ser usado apenas quando ainda não há movimentações.

## CSV

O arquivo deve ser UTF-8, separado por vírgula ou ponto e vírgula, com até 2 MB e 500 linhas. São aceitos valores com ponto decimal ou formato brasileiro, inclusive `R$ 1.234,56`, e datas `AAAA-MM-DD` ou `DD/MM/AAAA`. Datas, descrição e valor são obrigatórios. Quando `tipo` não for mapeado, valores positivos são receitas e negativos são despesas. A prévia mostra a interpretação de cada linha. `status` e `data_pagamento` são opcionais; pagamentos futuros devem ser pendentes.

```csv
data,descricao,valor,tipo,categoria
2026-10-01,Salário,3000.00,receita,Salário
2026-10-02,Aluguel,900.00,despesa,Moradia
```

## Publicação

O projeto é uma aplicação Next.js hospedada na Vercel, com o Supabase como serviço de autenticação e PostgreSQL. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` nos ambientes Development, Preview e Production da Vercel. Configure no Supabase as URLs de callback correspondentes.

`.github/workflows/validate.yml` prepara testes, tipos e build para cada push/PR; `.github/dependabot.yml` prepara revisões semanais de dependências. Esses fluxos começam a funcionar quando os arquivos forem enviados ao GitHub. `npm run check` executa localmente as mesmas verificações. Não são usadas credenciais de produção no CI.

No painel “Seu acompanhamento automático”, ative as rotinas desejadas. Elas executam imediatamente e depois a cada hora no minuto 05, usando `America/Maceio` para datas. Recorrências geram somente compromissos do mês atual com vencimento a partir da ativação e da criação do modelo. Pagamentos não são confirmados pelo agendamento. Para pausar, desmarque a preferência; as contas pendentes existentes são preservadas.

## Estrutura

```text
app/
├── globals.css       # estilos responsivos da autenticação e dashboard
├── layout.js         # layout e metadados Next.js
└── page.js           # autenticação, dashboard e operações
lib/
└── supabase.js       # cliente Supabase publicável no navegador
sql/
├── schema.sql        # tabela de movimentações, grants e políticas RLS
└── migrations/
    ├── 2026-11-01-financial-planning.sql
    └── 2026-11-02-recurring-owner-index.sql
```

## Importação segura

Use apenas dados fictícios ou anonimizados em ambientes de demonstração. Nunca versione credenciais, extratos pessoais ou arquivos `.env`. Mantenha RLS habilitado ao alterar o modelo e as políticas de dados.
