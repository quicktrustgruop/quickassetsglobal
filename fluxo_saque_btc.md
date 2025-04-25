# Fluxo de Saque de 100 mil dólares para carteira Bitcoin

## Visão Geral

Este documento detalha o fluxo específico para implementação do requisito de saque de até 100 mil dólares para carteira Bitcoin BTC nas primeiras 3 horas de operações do sistema QuickAssetsGlobal.

## Arquitetura do Fluxo de Saque

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SISTEMA DE SAQUE BTC                            │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │  Monitoramento│───▶│  Conversão   │───▶│   Transação  │           │
│  │   de Lucros   │    │   USD→BTC    │    │     BTC      │           │
│  └──────────────┘    └──────────────┘    └──────┬───────┘           │
│         ▲                                        │                   │
│         │                                        ▼                   │
│  ┌──────┴───────┐                      ┌──────────────┐             │
│  │  Temporizador │                      │  Confirmação │             │
│  │   (3 horas)   │                      │  e Registro  │             │
│  └──────────────┘                      └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## Componentes do Sistema de Saque

### 1. Monitoramento de Lucros
- **Função**: Monitorar continuamente os lucros gerados pelo sistema
- **Implementação**: 
  - Serviço Node.js que consulta a API de lucros a cada 5 minutos
  - Armazena os valores acumulados em banco de dados
  - Verifica se o limite de 100 mil dólares foi atingido

### 2. Temporizador (3 horas)
- **Função**: Garantir que o saque ocorra apenas nas primeiras 3 horas de operação
- **Implementação**:
  - Cronômetro iniciado no momento da primeira execução do sistema
  - AWS EventBridge para agendamento preciso
  - Desativa o sistema de saque após 3 horas

### 3. Conversão USD→BTC
- **Função**: Converter o valor em dólares para Bitcoin usando taxa de câmbio atual
- **Implementação**:
  - Integração com APIs de câmbio (Coinbase, Binance, etc.)
  - Cálculo do valor em BTC baseado na taxa atual
  - Verificação de liquidez suficiente

### 4. Transação BTC
- **Função**: Realizar a transferência de Bitcoin para a carteira especificada
- **Implementação**:
  - Integração com nó Bitcoin ou serviço de carteira
  - Assinatura da transação com chave privada segura (AWS KMS)
  - Envio da transação para a rede Bitcoin

### 5. Confirmação e Registro
- **Função**: Verificar a confirmação da transação e registrar para auditoria
- **Implementação**:
  - Monitoramento da transação na blockchain
  - Registro em banco de dados e logs
  - Notificação para administradores

## Fluxo de Execução Detalhado

1. **Inicialização**:
   - Sistema inicia e marca o timestamp de início
   - Temporizador de 3 horas é iniciado
   - Sistema de monitoramento de lucros é ativado

2. **Monitoramento Contínuo**:
   - A cada 5 minutos, o sistema verifica os lucros acumulados
   - Se os lucros atingirem 100 mil dólares, o processo de saque é iniciado
   - Se o temporizador de 3 horas expirar, o sistema de saque é desativado

3. **Processo de Saque**:
   - O sistema obtém a taxa de câmbio atual USD/BTC
   - Calcula o valor equivalente em BTC
   - Prepara a transação para a carteira BTC especificada
   - Assina a transação usando a chave privada segura
   - Envia a transação para a rede Bitcoin

4. **Confirmação**:
   - O sistema monitora a transação na blockchain
   - Aguarda pelo menos 3 confirmações
   - Registra a transação completa no banco de dados
   - Gera logs detalhados para auditoria
   - Envia notificação de conclusão

5. **Finalização**:
   - O sistema de saque é desativado após conclusão bem-sucedida
   - Todos os registros são armazenados para compliance
   - O sistema retorna à operação normal

## Considerações de Segurança

- **Proteção de Chaves**: A chave privada para assinatura de transações é armazenada no AWS KMS
- **Verificação de Endereço**: Validação dupla do endereço da carteira de destino
- **Limites de Transação**: Implementação de limites para evitar erros de cálculo
- **Monitoramento de Anomalias**: Detecção de comportamentos suspeitos durante o processo
- **Fallback**: Mecanismo de recuperação em caso de falha na transação

## Implementação Técnica

### Código de Monitoramento de Lucros (Node.js)

```javascript
// monitorLucros.js
const axios = require('axios');
const AWS = require('aws-sdk');
const db = require('./database');

// Configuração
const LIMITE_SAQUE_USD = 100000;
const INTERVALO_VERIFICACAO_MS = 5 * 60 * 1000; // 5 minutos
const TEMPO_LIMITE_MS = 3 * 60 * 60 * 1000; // 3 horas

// Timestamp de início
const timestampInicio = Date.now();

// Função principal de monitoramento
async function monitorarLucros() {
  try {
    // Verificar se ainda estamos dentro do limite de 3 horas
    if (Date.now() - timestampInicio > TEMPO_LIMITE_MS) {
      console.log('Limite de 3 horas atingido. Sistema de saque desativado.');
      clearInterval(intervaloMonitoramento);
      return;
    }

    // Obter lucros acumulados
    const lucrosAcumulados = await obterLucrosAcumulados();
    console.log(`Lucros acumulados: $${lucrosAcumulados}`);

    // Verificar se atingiu o limite para saque
    if (lucrosAcumulados >= LIMITE_SAQUE_USD) {
      console.log('Limite de $100,000 atingido. Iniciando processo de saque...');
      await iniciarProcessoSaque(lucrosAcumulados);
      clearInterval(intervaloMonitoramento);
    }
  } catch (error) {
    console.error('Erro no monitoramento de lucros:', error);
  }
}

// Iniciar monitoramento periódico
const intervaloMonitoramento = setInterval(monitorarLucros, INTERVALO_VERIFICACAO_MS);

// Executar imediatamente na primeira vez
monitorarLucros();
```

### Código de Saque BTC (Node.js)

```javascript
// processarSaqueBTC.js
const axios = require('axios');
const bitcoin = require('bitcoinjs-lib');
const AWS = require('aws-sdk');
const db = require('./database');

// Configuração
const BTC_WALLET_DESTINO = 'bc1qhzg6zqz3ud4eg82dzyux384va5zqced5fqyhcr';
const MIN_CONFIRMACOES = 3;

// AWS KMS para gerenciamento seguro de chaves
const kms = new AWS.KMS({ region: 'us-east-1' });

async function iniciarProcessoSaque(valorUSD) {
  try {
    // 1. Obter taxa de câmbio atual
    const taxaCambio = await obterTaxaCambioUSDtoBTC();
    console.log(`Taxa de câmbio atual: 1 USD = ${taxaCambio} BTC`);

    // 2. Calcular valor em BTC
    const valorBTC = valorUSD * taxaCambio;
    console.log(`Valor a ser enviado: ${valorBTC} BTC`);

    // 3. Verificar saldo disponível
    const saldoDisponivel = await verificarSaldoDisponivel();
    if (saldoDisponivel < valorBTC) {
      throw new Error(`Saldo insuficiente. Disponível: ${saldoDisponivel} BTC`);
    }

    // 4. Criar e assinar transação
    const txId = await criarEEnviarTransacao(valorBTC, BTC_WALLET_DESTINO);
    console.log(`Transação enviada. TxID: ${txId}`);

    // 5. Monitorar confirmações
    await monitorarConfirmacoes(txId, MIN_CONFIRMACOES);
    console.log(`Transação confirmada com ${MIN_CONFIRMACOES} confirmações`);

    // 6. Registrar transação completa
    await registrarTransacaoCompleta(txId, valorUSD, valorBTC);
    console.log('Processo de saque concluído com sucesso');

    // 7. Enviar notificação
    await enviarNotificacao('Saque BTC concluído', 
      `Saque de ${valorBTC} BTC (${valorUSD} USD) concluído com sucesso. TxID: ${txId}`);
  } catch (error) {
    console.error('Erro no processo de saque:', error);
    await registrarErro(error);
    await enviarNotificacao('Erro no saque BTC', 
      `Ocorreu um erro no processo de saque: ${error.message}`);
  }
}
```

## Testes e Validação

1. **Teste de Integração**: Verificar a integração com APIs de câmbio e serviços Bitcoin
2. **Teste de Tempo**: Validar o funcionamento correto do temporizador de 3 horas
3. **Teste de Limites**: Testar o comportamento com diferentes valores de lucro
4. **Teste de Falha**: Simular falhas de rede e verificar mecanismos de recuperação
5. **Teste de Segurança**: Validar a proteção das chaves privadas e autenticação

## Monitoramento e Alertas

- **CloudWatch Alarms**: Configurar alertas para monitorar o processo de saque
- **Logs Detalhados**: Manter logs detalhados de todas as etapas do processo
- **Notificações**: Enviar notificações em tempo real para administradores
- **Dashboard**: Incluir status do saque no dashboard principal do sistema
