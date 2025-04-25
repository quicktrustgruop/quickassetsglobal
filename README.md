# QuickAssetsGlobal - Backend

Este é o backend do sistema QuickAssetsGlobal, uma plataforma de mineração institucional e DeFi com capacidade de gerar lucros diários superiores a USD 400 milhões.

## Visão Geral

O backend do QuickAssetsGlobal é construído com Node.js e Express, fornecendo uma API RESTful para os aplicativos cliente (Windows, macOS, Android e iOS). Ele gerencia operações de mineração, estratégias DeFi, distribuição de lucros e segurança.

## Funcionalidades Principais

- **Mineração**: Gerenciamento de operações de mineração de criptomoedas (BTC, ETH, KASPA, FLUX, etc.)
- **DeFi**: Gerenciamento de estratégias DeFi (Yield Farming, Staking, Flash Loans, Arbitragem)
- **Distribuição de Lucros**: Distribuição automática de lucros para carteiras BTC e ETH
- **Saque BTC**: Sistema automático para saque de até 100 mil dólares em BTC nas primeiras 3 horas
- **Segurança**: Monitoramento de segurança e detecção de anomalias
- **Dashboard**: API para dados de dashboard em tempo real

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- Docker e Docker Compose (para implantação)

## Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/    # Controladores da aplicação
│   ├── middleware/     # Middlewares (auth, errorHandler, etc.)
│   ├── models/         # Modelos de dados
│   ├── routes/         # Rotas da API
│   ├── services/       # Serviços de negócio
│   ├── utils/          # Utilitários
│   └── index.js        # Ponto de entrada da aplicação
├── config/             # Configurações
├── tests/              # Testes
├── .env.example        # Exemplo de variáveis de ambiente
├── docker-compose.yml  # Configuração Docker Compose
├── Dockerfile          # Configuração Docker
├── init.sql            # Script de inicialização do banco de dados
├── package.json        # Dependências e scripts
└── prometheus.yml      # Configuração do Prometheus
```

## Instalação e Execução

### Desenvolvimento Local

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente
4. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```

### Produção com Docker

1. Configure as variáveis de ambiente no arquivo `.env`
2. Execute o Docker Compose:
   ```
   docker-compose up -d
   ```

## API Endpoints

### Autenticação

- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/me` - Obter informações do usuário atual
- `POST /api/auth/logout` - Logout do usuário

### Mineração

- `GET /api/mining/status` - Obter status das operações de mineração
- `POST /api/mining/switch` - Alternar mineração entre moedas
- `GET /api/mining/profit` - Obter estatísticas de lucro de mineração
- `GET /api/mining/workers` - Obter estatísticas de workers de mineração

### DeFi

- `GET /api/defi/status` - Obter status das operações DeFi
- `POST /api/defi/rebalance` - Rebalancear investimentos DeFi entre estratégias
- `GET /api/defi/profit` - Obter estatísticas de lucro DeFi
- `GET /api/defi/platforms` - Obter informações sobre plataformas DeFi

### Distribuição

- `GET /api/distribution/status` - Obter status da distribuição de lucros
- `POST /api/distribution/manual` - Iniciar distribuição manual de lucros
- `POST /api/distribution/btc-withdrawal/init` - Iniciar monitoramento de saque BTC
- `GET /api/distribution/btc-withdrawal/status` - Obter status do monitoramento de saque BTC
- `POST /api/distribution/btc-withdrawal/force` - Forçar saque BTC imediatamente

### Segurança

- `GET /api/security/status` - Obter status do sistema de segurança
- `GET /api/security/alerts` - Obter alertas de segurança
- `GET /api/security/anomalies` - Obter anomalias detectadas pelo sistema de IA
- `POST /api/security/scan` - Iniciar verificação de segurança

### Dashboard

- `GET /api/dashboard/summary` - Obter resumo geral para o dashboard
- `GET /api/dashboard/profit-chart` - Obter dados para gráfico de lucros
- `GET /api/dashboard/distribution-chart` - Obter dados para gráfico de distribuição de lucros
- `GET /api/dashboard/mining-distribution` - Obter dados para gráfico de distribuição de mineração por moeda
- `GET /api/dashboard/defi-distribution` - Obter dados para gráfico de distribuição de investimentos DeFi

## Monitoramento

O sistema inclui monitoramento com Prometheus e Grafana, acessíveis nas seguintes URLs:

- Grafana: http://localhost:3001 (usuário: admin, senha: admin)
- Prometheus: http://localhost:9090

## Segurança

- Autenticação JWT
- Proteção contra ataques de força bruta com rate limiting
- Logs detalhados para auditoria
- Detecção de anomalias com IA

## Licença

Este projeto é privado e não deve ser comercializado em ambiente de produção real.
