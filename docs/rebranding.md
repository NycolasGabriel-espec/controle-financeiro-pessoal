# Gestão Finance — direção do rebranding

## Brief

Rebranding da aplicação web de controle financeiro pessoal. O pedido do usuário orienta a identidade: tons escuros e sóbrios, letras claras para destacar a informação e aparência profissional. A interface deve facilitar a leitura de receitas, despesas, saldo e planejamento financeiro.

O nome da aplicação é Gestão Finance e os fluxos existentes são mantidos. O trabalho segue diretamente para implementação na interface atual.

## Referências de execução

As decisões foram fundamentadas no pedido do usuário e nas referências incluídas na skill `refero-design`:

- `references/color.md`, seções 0, 2–5: dashboards com mais neutros, acentos discretos, cores com função semântica, contraste e elevação no tema escuro.
- `references/typography.md`, seções 0, 3–6, 8, 10 e 12: tipografia neutra para ferramentas, uma família com pesos distintos, hierarquia, numerais tabulares e stack de sistema.

Essas referências de craft fundamentam as regras; a paleta concreta abaixo é uma adaptação ao pedido, não uma reprodução de outra marca.

## Reference lock

**Direção principal:** grafite sóbrio, texto claro e destaque por hierarquia tipográfica e contraste entre superfícies.

**Preservar:**

1. Base escura quase neutra, sem preto absoluto.
2. Superfícies em camadas discretamente mais claras que o fundo.
3. Títulos e valores destacados em off-white; textos de apoio legíveis.
4. Ação principal clara com texto escuro.
5. Cores de dados contidas e consistentes com sua função.

**Detalhes adotados das referências:** família sans de sistema, pesos para criar hierarquia e numerais tabulares para alinhar os dados financeiros; separação de camadas por superfícies e bordas finas.

**Regras de papel:** off-white representa texto principal e CTA; sálvia e rosé distinguem estados positivos e negativos. Conforme o ajuste solicitado pelo usuário, o fluxo financeiro usa verde-claro `#a7d8b8` para receitas e vermelho-claro `#e6aaaa` para despesas, com legendas nas mesmas cores; despesas comuns na tabela permanecem neutras. Esses acentos não devem ocupar grandes áreas da interface nem competir com a ação principal.

**Estratégia de mídia:** interface nativa em CSS, ícones e gráficos já presentes. Nenhuma fotografia ou ilustração é necessária para esta direção.

**Evitar:** neon, brilhos coloridos, gradientes decorativos, múltiplos acentos disputando atenção e tipografia monoespaçada como voz principal da marca.

| Papel | Compromisso de token |
| --- | --- |
| Fundo | `#101113` |
| Superfície | `#181a1d` |
| Superfície elevada | `#202226` |
| Borda | `#303339` |
| Texto principal | `#f1f2f3` |
| Texto secundário | `#afb3b9` |
| Texto auxiliar | `#90969e` |
| Ação principal | Off-white com texto escuro |
| Receita / positivo | Sálvia `#a8c1b1` |
| Indicador de despesa / negativo | Rosé `#d0aaa6` |
| Apoio informativo | Azul acinzentado `#a8b6c8` |
| Tipografia | Sans de sistema, numerais tabulares nos valores |
| Profundidade | Bordas finas, superfícies graduadas e ausência de glow |

## Decision ledger

| Decisão | Fonte | Regra / papel | Motivo |
| --- | --- | --- | --- |
| Fundo grafite e superfícies neutras | Pedido do usuário; `color.md` §§0, 5 | Tema escuro com escala própria e camadas ligeiramente mais claras | Produzir sobriedade sem perder a separação dos blocos |
| Texto claro em três níveis | Pedido do usuário; `color.md` §4; `typography.md` §4 | Hierarquia por papel com contraste verificável | Destacar os números e manter descrições legíveis |
| CTA off-white com texto escuro | Pedido do usuário; `color.md` §§2–4 | Uma ação principal com contraste forte e estados previsíveis | Diferenciar a ação sem introduzir um acento saturado |
| Sálvia, rosé e azul acinzentado em áreas limitadas | `color.md` §§0, 2–3; contexto financeiro | Cores semânticas e de dados subordinadas aos neutros | Distinguir os dados sem transformar o dashboard em uma composição multicolorida |
| Sans de sistema e pesos consistentes | `typography.md` §§0, 3, 5, 12 | Uma família neutra, carregamento imediato e hierarquia por peso | Aumentar a clareza e reforçar a aparência profissional |
| Numerais tabulares | `typography.md` §10 | Algarismos com largura consistente | Facilitar comparação entre valores monetários e indicadores |
| Bordas discretas e remoção de brilhos | `color.md` §§2, 5 | Elevação por superfície e contorno | Separar componentes mantendo o visual sóbrio |
| Metadados com linguagem objetiva | Pedido do usuário | Descrição alinhada ao propósito financeiro | Retirar a referência anterior ao “visual elétrico” |

## Validação

Validado em 2 de novembro de 2026:

- `npm run build` e `git diff --check` passaram.
- Login e demonstração inspecionados no navegador; layout verificado em 320, 390, 768, 1024 e 1440 px sem transbordamento horizontal da página ou dos painéis. A tabela mantém rolagem horizontal própria nas telas pequenas.
- Busca por Farmácia retornou uma despesa de R$ 95,00; filtro de receitas retornou R$ 6.000,00; filtro Moradia retornou R$ 2.000,00 em despesas. Troca para setembro exibiu receitas de R$ 5.600,00, despesas de R$ 3.775,00 e saldo de R$ 1.825,00.
- Navegação inferior até o extrato confirmada na demonstração, sem gravar dados.
- Revisão independente confirmou contraste de textos auxiliares acima de 5:1 nas superfícies e CTA acima de 14:1. Bordas de campos reforçadas para melhorar a identificação dos controles.
- Formulários e modais compartilham os mesmos tokens e foram revisados no código; gravação autenticada e importação no banco não foram executadas nesta alteração visual.
