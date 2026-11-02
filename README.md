# Controle Financeiro Pessoal

Dashboard em português para registrar receitas e despesas, analisar hábitos de consumo e acompanhar o planejamento financeiro. Os valores são exibidos em reais (BRL).

## Estado do projeto

O MVP e as evoluções funcionais deste documento estão implementados: movimentações, importação e exportação CSV, filtros, indicadores, gráficos, comparação mensal, orçamentos, metas de economia, despesas recorrentes, sugestão de categorias e autenticação com dados isolados por usuário.

## Funcionalidades

- Dashboard animado com saldo em destaque, transições de valores, gráficos interativos e navegação responsiva. As animações respeitam a preferência por movimento reduzido; a direção e a validação estão em [`docs/dashboard-animado.md`](docs/dashboard-animado.md).

- Criar, editar e excluir receitas e despesas.
- Importar CSV em UTF-8, validar linhas e revisar erros e possíveis duplicatas antes de confirmar. Duplicatas não são excluídas automaticamente.
- Filtrar por mês, tipo, categoria e texto. Os indicadores, gráficos e exportação refletem tipo, categoria e texto selecionados; os valores mensais usam o mês escolhido.
- Exibir receitas, despesas, saldo, taxa de economia, renda comprometida e participação das categorias.
- Comparar despesas com o mês anterior e ver os seis meses mais recentes em gráficos de receitas/despesas e saldo.
- Definir limites mensais por categoria e acompanhar o valor usado. O progresso respeita os filtros de movimentação ativos.
- Criar metas de economia com valor atual, alvo e prazo opcional; o progresso é atualizado manualmente.
- Cadastrar despesas recorrentes e, quando solicitado, lançá-las no mês escolhido. Nenhum lançamento automático é feito.
- Mostrar categorias de acordo com o tipo de movimentação e sugerir uma categoria a partir de termos conhecidos na descrição; a pessoa confirma ou escolhe outra categoria.
- Gerar até cinco conclusões com base nos dados e filtros disponíveis. A tela informa quando não há registros suficientes para chegar a três conclusões.
- Marcar o mês atual como parcial, informar períodos futuros e explicar quando indicadores não podem ser calculados por falta de denominador.
- Acessar uma demonstração fictícia somente para leitura, sem salvar dados.

## Categorias de movimentação

As opções de despesas incluem Supermercado, Restaurantes e delivery, Moradia, Transporte, Saúde, Lazer, Educação, Assinaturas, Compras e vestuário, Cuidados pessoais, Impostos e taxas, Pets, Presentes e doações, Seguros, Cartão de crédito e Outros. Alimentação continua disponível para manter a compatibilidade com os registros existentes.

As opções de receitas são Salário, Freelance, Vendas, Rendimentos, Aluguéis recebidos, Benefícios, Bônus e comissões, 13º salário e férias, Participação nos lucros, Presentes e doações recebidas, Distribuição de lucros, Royalties e direitos autorais e Outros. As sugestões por descrição reconhecem termos dessas categorias, como comissão, décimo terceiro, PLR e royalties. Orçamentos e recorrências oferecem apenas as opções de despesas. Continua sendo possível digitar categorias personalizadas, e os registros já salvos não são reclassificados automaticamente.

## Indicadores e limites

Os valores registrados são sempre positivos; `tipo` distingue receitas e despesas. Os cálculos seguem as fórmulas do planejamento:

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

   Em um banco que já tem `public.transactions`, execute as duas migrações. A primeira cria as tabelas de planejamento e vincula lançamentos às recorrências; a segunda adiciona o índice de cobertura dessa chave estrangeira.

4. Habilite o acesso por e-mail e senha em Authentication. Se a confirmação de e-mail estiver ativa, confirme o endereço antes do login. Em **Authentication → URL Configuration**, inclua a origem local e a origem publicada nas URLs de redirecionamento.

5. Inicie o app:

   ```bash
   npm run dev
   ```

   Acesse `http://localhost:3000`.

## Banco e privacidade

`public.transactions` armazena data, descrição, valor, tipo, categoria e proprietário. `public.budgets` armazena limites por mês/categoria; `public.savings_goals` armazena alvo e progresso declarado; `public.recurring_expenses` armazena os modelos de despesas mensais. `transactions.recorrencia_id` vincula um lançamento ao modelo que o originou e impede que o vínculo aponte para outro proprietário.

As quatro tabelas têm RLS e políticas de leitura, inserção, atualização e exclusão limitadas a `auth.uid()`. O papel anônimo não recebe acesso. A aplicação usa apenas a chave publicável no cliente e não contém chave `service_role` nem senha de banco.

A demonstração do botão “Explorar demonstração fictícia” funciona em memória, somente para leitura. “Carregar amostra” dentro da conta salva registros fictícios na conta autenticada e pode ser usado apenas quando ainda não há movimentações.

## CSV

O arquivo deve ser UTF-8, separado por vírgulas, ter no máximo 2 MB e 500 linhas, com valores usando ponto decimal e sem símbolo monetário. Datas usam `AAAA-MM-DD`; `tipo` aceita `receita` ou `despesa`; o valor deve ser positivo.

```csv
data,descricao,valor,tipo,categoria
2026-10-01,Salário,3000.00,receita,Salário
2026-10-02,Aluguel,900.00,despesa,Moradia
```

## Publicação

O projeto é uma aplicação Next.js hospedada na Vercel, com o Supabase como serviço de autenticação e PostgreSQL. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` nos ambientes Development, Preview e Production da Vercel. Configure no Supabase as URLs de callback correspondentes.

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
