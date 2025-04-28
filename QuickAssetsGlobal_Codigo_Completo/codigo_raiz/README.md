# QuickAssetsGlobal - Código Raiz

Este repositório contém a estrutura base do projeto QuickAssetsGlobal, um sistema de mineração institucional descentralizado e interoperável com capacidade de gerar lucros diários superiores a USD 400 milhões.

## Estrutura do Projeto

```
codigo_raiz/
├── backend/             # API e serviços backend
│   ├── src/
│   │   ├── controllers/ # Controladores da API
│   │   ├── models/      # Modelos de dados
│   │   ├── routes/      # Rotas da API
│   │   ├── services/    # Serviços de negócios
│   │   ├── utils/       # Utilitários
│   │   ├── middleware/  # Middlewares
│   │   └── config/      # Configurações
│   └── package.json     # Dependências do backend
├── frontend/            # Interface web
├── infra/               # Configuração de infraestrutura AWS/GCP
├── mobile/              # Aplicativos Android/iOS
├── desktop/             # Aplicativos Windows/macOS
└── docs/                # Documentação adicional
```

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- Docker e Docker Compose
- AWS CLI ou GCP CLI (para deploy)

## Configuração do Backend

1. Instale as dependências:
```bash
cd backend
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Distribuição de Lucros

O sistema está configurado para distribuir lucros automaticamente:

- 70% do lucro líquido a cada 6 horas para carteira Bitcoin: `bc1qxcfdzz3xhc4fkjwdtmdx94glxjx0zk2m53xmth`
- 20% para carteira Metamask distribuídos entre múltiplas redes (Ethereum, Linea, Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, zkSync)
- Saque de até 100 mil dólares a cada hora para carteira USDC na rede ETH

## Próximos Passos

1. Completar a implementação dos serviços de backend
2. Desenvolver a interface frontend com React
3. Configurar a infraestrutura AWS/GCP com Terraform
4. Implementar os aplicativos mobile e desktop
5. Configurar CI/CD para deploy automático

Para mais detalhes, consulte o documento completo do projeto: `QuickAssetsGlobal_Documento_Final.md`
