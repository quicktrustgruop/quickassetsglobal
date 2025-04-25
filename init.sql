-- Criação da tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserção de usuários padrão
INSERT INTO usuarios (username, password, name, email, role)
VALUES 
    ('admin', '$2b$10$X7o4c5/QR6QFmrdgGOIXO.3IOl7qVgQMG8HDYfcHW9Nbp9jKcNoqq', 'Administrador', 'admin@quickassets.global', 'admin'),
    ('user', '$2b$10$X7o4c5/QR6QFmrdgGOIXO.3IOl7qVgQMG8HDYfcHW9Nbp9jKcNoqq', 'Usuário Padrão', 'user@quickassets.global', 'user')
ON CONFLICT (username) DO NOTHING;

-- Criação da tabela de transações de mineração
CREATE TABLE IF NOT EXISTS mineracao_transacoes (
    id SERIAL PRIMARY KEY,
    moeda VARCHAR(20) NOT NULL,
    hashrate DECIMAL(20, 2) NOT NULL,
    lucro_usd DECIMAL(20, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de transações DeFi
CREATE TABLE IF NOT EXISTS defi_transacoes (
    id SERIAL PRIMARY KEY,
    estrategia VARCHAR(50) NOT NULL,
    plataforma VARCHAR(50) NOT NULL,
    valor_investido_usd DECIMAL(20, 2) NOT NULL,
    lucro_usd DECIMAL(20, 2) NOT NULL,
    apy DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de distribuição de lucros
CREATE TABLE IF NOT EXISTS distribuicao_lucros (
    id SERIAL PRIMARY KEY,
    lucro_total_usd DECIMAL(20, 2) NOT NULL,
    btc_valor_usd DECIMAL(20, 2) NOT NULL,
    btc_endereco VARCHAR(100) NOT NULL,
    btc_txid VARCHAR(100),
    eth_valor_usd DECIMAL(20, 2) NOT NULL,
    eth_endereco VARCHAR(100) NOT NULL,
    eth_txid VARCHAR(100),
    reinvestimento_valor_usd DECIMAL(20, 2) NOT NULL,
    operacional_valor_usd DECIMAL(20, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de saques BTC
CREATE TABLE IF NOT EXISTS saques_btc (
    id SERIAL PRIMARY KEY,
    valor_usd DECIMAL(20, 2) NOT NULL,
    valor_btc DECIMAL(20, 8) NOT NULL,
    endereco_destino VARCHAR(100) NOT NULL,
    txid VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    confirmacoes INT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de alertas de segurança
CREATE TABLE IF NOT EXISTS alertas_seguranca (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    severidade VARCHAR(20) NOT NULL,
    descricao TEXT NOT NULL,
    origem_ip VARCHAR(50),
    origem_pais VARCHAR(50),
    origem_usuario VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    resolucao TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de logs do sistema
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserção de configurações padrão
INSERT INTO system_config (key, value, description)
VALUES 
    ('saque_btc_limite_usd', '100000', 'Limite de saque BTC em USD'),
    ('saque_btc_tempo_limite_horas', '3', 'Tempo limite para saque BTC em horas'),
    ('saque_btc_min_confirmacoes', '3', 'Número mínimo de confirmações para saque BTC'),
    ('distribuicao_btc_percentual', '35', 'Percentual de distribuição para BTC'),
    ('distribuicao_eth_percentual', '20', 'Percentual de distribuição para ETH'),
    ('distribuicao_reinvestimento_percentual', '20', 'Percentual de distribuição para reinvestimento'),
    ('monitoring_interval_ms', '300000', 'Intervalo de monitoramento em milissegundos')
ON CONFLICT (key) DO NOTHING;
