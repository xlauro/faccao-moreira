# GUIA COMPLETO DO PROJETO WELTH (EXPO SDK 54)

> **AVISO CRÍTICO SOBRE O EXPO:**
> **O Expo mudou!** Sempre consulte a documentação oficial da versão exata **v54.0.0** antes de escrever ou refatorar qualquer código:
> [Documentação do Expo v54.0.0](https://docs.expo.dev/versions/v54.0.0/)

---

## 1. VISÃO GERAL E DOMÍNIO DA APLICAÇÃO

O **Welth** (baseado no projeto de referência Flutter `faccao-moreira/`) é um aplicativo móvel projetado para **gerenciamento de produção em facções de costura e oficinas têxteis**.

### Principais Objetivos do Negócio:
1. **Lotes de Serviço (Services)**: Cadastro e acompanhamento de lotes de peças de vestuário enviados por fornecedores.
2. **Variações de Peça (Service Variations)**: Cada lote possui variações de **cor** e **tamanho** (ex: Azul / M, Preto / G), além da quantidade de peças originais, processos concluídos e defeitos.
3. **Processos por Peça**: Definição de quantas etapas/operações de costura cada peça exige (ex: 3 processos por camiseta).
4. **Apontamento de Produção (Service Logs)**: Lançamento de produção por costureira/operador, registrando quantos processos foram concluídos em cada variação.
5. **Controle de Defeitos**: Abatimento de peças com defeito, recalculando a quantidade efetiva de peças aproveitáveis.
6. **Gestão de Fornecedores (Suppliers)**: Cadastro e vinculação de fornecedores aos lotes de serviço.
7. **Autenticação de Costureiras/Usuários**: Login e cadastro de usuários com suporte a biometria/local authentication.

---

## 2. STACK TECNOLÓGICA & DEPENDÊNCIAS

- **Framework**: React Native `0.81.5` + Expo SDK `~54.0.35` + React `19.1.0`.
- **Roteamento**: Expo Router `~6.0.24` (File-based navigation no diretório `app/`).
- **Estilização**: **NativeWind v4** (`nativewind` `^4.2.6`, Tailwind CSS `^3.4.19`).
- **Banco de Dados**: **Neon PostgreSQL Serverless** (`@neondatabase/serverless` `^1.1.0`).
- **Segurança & Criptografia**: `expo-secure-store` `~15.0.8`, `expo-crypto` `~15.0.9`, `expo-local-authentication` `~17.0.8`.
- **Animações & UI**: `react-native-reanimated` `~4.1.1`, `react-native-gesture-handler` `~2.28.0`, `@expo/vector-icons` `^15.0.3` (Ionicons).
- **Linter & Qualidade**: ESLint `^9.25.0`, TypeScript `~5.9.2`.

---

## 3. ARQUITETURA DO PROJETO & SITEMAP

```
welth/
├── app/                        # Rotas do Expo Router (File-based Routing)
│   ├── (auth)/                 # Grupo de rotas não autenticadas
│   │   ├── login.tsx           # Tela de Login de costureira/usuário
│   │   └── register.tsx        # Tela de Cadastro de nova costureira
│   ├── _layout.tsx             # Layout raiz (AuthProvider + Stack Navigator + Redirecionamento de Auth)
│   ├── index.tsx               # Dashboard Principal (Filtros, Estatísticas, Lista de Lotes)
│   ├── create-service.tsx      # Formulário de Criação de Lote de Serviço com Variações
│   ├── edit-service.tsx        # Edição de Lote de Serviço e Variações existentes
│   ├── start-service.tsx       # Tela de Apontamento de Processos Concluídos por Variação
│   └── suppliers.tsx          # Gestão e Cadastro de Fornecedores (CRUD)
├── src/                        # Código-fonte da aplicação
│   ├── components/             # Componentes reutilizáveis
│   │   ├── common/             # Componentes comuns (HeaderBar)
│   │   ├── home/               # Componentes da Home (WelcomeHeaderCard, SummaryStatsOverview, HomeActionButtons, ServiceCard, VariationItem)
│   │   └── modals/             # Modais (ProcessInputModal, DefectInputModal, HistoryLogModal)
│   ├── context/                # Contextos globais
│   │   └── AuthContext.tsx     # Contexto de Autenticação (Login, Logout, Sessão no SecureStore)
│   ├── core/                   # Núcleo de infraestrutura
│   │   └── database.ts         # Conexão com Neon PostgreSQL serverless e inicialização de schemas SQL
│   ├── hooks/                  # Hooks customizados
│   │   ├── useServices.ts      # Busca, filtro e estado global da lista de serviços
│   │   └── useServiceActions.ts# Ações sobre serviços (apontamento de processo, registro de defeito, exclusão)
│   ├── models/                 # Modelos de dados e lógica matemática pura
│   │   └── types.ts            # Interfaces TypeScript e funções de cálculo derivadas
│   ├── repositories/           # Camada de Acesso a Dados (Data Access Layer)
│   │   ├── userRepository.ts   # Autenticação e cadastro de usuários no NeonDB
│   │   ├── supplierRepository.ts # Operações de fornecedores no NeonDB
│   │   └── serviceRepository.ts  # Operações de lotes, variações e logs no NeonDB
│   └── utils/                  # Utilitários e helpers
│       ├── currencyFormatter.ts # Formatação monetária (BRL / R$)
│       └── garmentIconHelper.ts # Mapeamento de nomes de roupas para ícones
├── faccao-moreira/             # Código legado em Flutter (apenas para consulta de regras de negócio)
├── globals.css                 # Importações do NativeWind/Tailwind (@tailwind base, components, utilities)
├── tailwind.config.js          # Configuração do Tailwind CSS e caminhos de conteúdo
└── AGENTS.md                   # Este guia de orientação
```

---

## 4. BANCO DE DADOS (NEON POSTGRESQL) & ESTRUTURA DDL

A conexão utiliza `@neondatabase/serverless` via driver HTTP/Websocket instanciado em `src/core/database.ts`.

### Tabelas Principais:
1. `users`: Registro de costureiras/usuários (`id`, `name`, `email`, `password_hash`, `created_at`).
2. `suppliers`: Registro de fornecedores (`id`, `name`, `phone`, `created_at`).
3. `services`: Lotes de serviço (`id`, `supplier_id`, `supplier_name`, `piece_name`, `processes_per_piece`, `price_per_piece`, `status`, `created_at`).
4. `service_variations`: Variações do lote por cor/tamanho (`id`, `service_id`, `color`, `size`, `quantity`, `completed_processes`, `defects`).
5. `service_logs`: Histórico de apontamentos de processo (`id`, `service_id`, `variation_id`, `seamstress_name`, `processes_count`, `variation_description`, `created_at`).

> **Regra de Consulta ao Banco:** Sempre utilize a tag parametrizada `sql` exportada de `src/core/database.ts` para evitar SQL Injection. Exemplo:
> ```ts
> import { sql } from '../core/database';
> const result = await sql`SELECT * FROM services WHERE id = ${serviceId}`;
> ```

---

## 5. FÓRMULAS MATEMÁTICAS E REGRAS DE NEGÓCIO

Todas as fórmulas numéricas são centralizadas em `src/models/types.ts`. **Nunca recrie estes cálculos inline nos componentes UI!**

1. **Quantidade Efetiva de Peças (`getEffectiveQuantity`)**:
   $$\text{Quantidade Efetiva} = \max(0, \text{quantidade} - \text{defeitos})$$
2. **Total de Processos da Variação (`getVariationTotalProcesses`)**:
   $$\text{Total Processos Variação} = \text{Quantidade Efetiva} \times \text{processos\_por\_peça}$$
3. **Progresso da Variação (`getVariationProgressPercentage`)**:
   $$\text{Progresso Variação (\%)} = \min\left(100, \frac{\text{completed\_processes}}{\text{Total Processos Variação}} \times 100\right)$$
4. **Total de Peças do Serviço (`getServiceTotalPieces`)**:
   Soma das quantidades efetivas de todas as variações do lote.
5. **Progresso Geral do Lote (`getServiceOverallProgressPercentage`)**:
   $$\text{Progresso Geral (\%)} = \min\left(100, \frac{\sum \text{completed\_processes}}{\sum \text{Total Processos Variação}} \times 100\right)$$
6. **Preço Total do Lote (`getServiceTotalPrice`)**:
   $$\text{Preço Total} = \text{Total de Peças Efetivas do Serviço} \times \text{preço\_por\_peça}$$
7. **Status do Lote (`status`)**:
   - `Pendente`: 0% de progresso geral.
   - `Em Andamento`: Maior que 0% e menor que 100% de progresso.
   - `Concluído`: 100% de progresso atingido.

---

## 6. REGRAS ARQUITETURAIS E PADRÕES DE CÓDIGO

### 🎨 1. Estilização Estrita com NativeWind v4 (Tailwind CSS)
- **PROIBIDO** o uso de estilos inline ad-hoc no formato `style={{ margin: 10, backgroundColor: '#...' }}`.
- **OBRIGATÓRIO** utilizar o atributo `className="..."` com classes do Tailwind CSS.
- **Paleta de Cores do Tema (Dark Purple)**:
  - Fundo Principal da Tela: `bg-[#2C1435]`
  - Cards e Seções: `bg-[#3B1B47]` ou `bg-[#4A2058]`
  - Botões Primários / Destaques: `bg-[#6B224F]` ou `bg-[#8B2E67]`
  - Destaques Verdes (Concluído/Sucesso): `text-emerald-400`, `bg-emerald-500/20`
  - Destaques Azuis (Progresso/Info): `text-sky-400`, `bg-sky-500/20`
  - Destaques Vermelhos (Defeito/Erro): `text-red-400`, `bg-red-500/20`
  - Texto Principal: `text-white`
  - Texto Secundário: `text-gray-300` ou `text-gray-400`

### 🔀 2. Roteamento com Expo Router 6
- Utilize as funções de controle de navegação do `expo-router`: `useRouter`, `useSegments`, `Link`, `Stack`.
- A rota raiz `app/_layout.tsx` gerencia automaticamente a proteção de rotas com base no estado `isAuthenticated` do `AuthContext`.

### 🔄 3. Fluxo de Trabalho Git (Commits & Pushs Frequentes)
- **A cada alteração ou refatoração bem-sucedida** (ex: adição de funcionalidade, migração de telas para NativeWind, ajuste de modelo), deve-se executar o commit e push:
  ```bash
  git add .
  git commit -m "feat/fix/refactor: descrição da mudança"
  git push
  ```

---

## 7. COMANDOS ÚTEIS E SCRIPTS

- **Iniciar o servidor de desenvolvimento Expo**: `npm start` ou `npx expo start`
- **Executar no Android**: `npm run android`
- **Executar no iOS**: `npm run ios`
- **Executar na Web**: `npm run web`
- **Executar a verificação de Linter**: `npm run lint`
- **Verificação de Tipos TypeScript**: `npx tsc --noEmit`
