const axios = require('axios');
const { Decimal } = require('decimal.js');
const logger = require('../utils/logger');
const { sendNotification } = require('../utils/notifications');

// Configurações
const LIMITE_SAQUE_USD = process.env.SAQUE_BTC_LIMITE_USD || 100000;
const TEMPO_LIMITE_HORAS = process.env.SAQUE_BTC_TEMPO_LIMITE_HORAS || 3;
const TEMPO_LIMITE_MS = TEMPO_LIMITE_HORAS * 60 * 60 * 1000;
const INTERVALO_VERIFICACAO_MS = process.env.MONITORING_INTERVAL_MS || 5 * 60 * 1000; // 5 minutos
const BTC_WALLET_DESTINO = process.env.BTC_WALLET_ADDRESS;
const MIN_CONFIRMACOES = process.env.SAQUE_BTC_MIN_CONFIRMACOES || 3;

// Variáveis de estado
let timestampInicio = null;
let intervaloMonitoramento = null;
let saqueRealizado = false;

/**
 * Inicializa o monitoramento de saque BTC
 */
function initBtcWithdrawalMonitoring() {
  if (intervaloMonitoramento) {
    clearInterval(intervaloMonitoramento);
  }
  
  timestampInicio = Date.now();
  saqueRealizado = false;
  
  logger.info(`Iniciando monitoramento de saque BTC. Limite: $${LIMITE_SAQUE_USD}, Tempo limite: ${TEMPO_LIMITE_HORAS} horas`);
  
  // Executar imediatamente na primeira vez
  monitorarLucros();
  
  // Iniciar monitoramento periódico
  intervaloMonitoramento = setInterval(monitorarLucros, INTERVALO_VERIFICACAO_MS);
  
  // Configurar timer para desativar após o tempo limite
  setTimeout(() => {
    if (!saqueRealizado) {
      logger.info(`Tempo limite de ${TEMPO_LIMITE_HORAS} horas atingido. Desativando sistema de saque BTC.`);
      clearInterval(intervaloMonitoramento);
      sendNotification('Sistema de Saque BTC', `O tempo limite de ${TEMPO_LIMITE_HORAS} horas foi atingido sem que o saque fosse realizado.`);
    }
  }, TEMPO_LIMITE_MS);
}

/**
 * Monitora os lucros acumulados e inicia o processo de saque quando o limite for atingido
 */
async function monitorarLucros() {
  try {
    // Verificar se já realizamos o saque
    if (saqueRealizado) {
      clearInterval(intervaloMonitoramento);
      return;
    }
    
    // Verificar se ainda estamos dentro do limite de tempo
    if (Date.now() - timestampInicio > TEMPO_LIMITE_MS) {
      logger.info(`Limite de ${TEMPO_LIMITE_HORAS} horas atingido. Sistema de saque desativado.`);
      clearInterval(intervaloMonitoramento);
      return;
    }
    
    // Obter lucros acumulados
    const lucrosAcumulados = await obterLucrosAcumulados();
    logger.info(`Lucros acumulados: $${lucrosAcumulados}`);
    
    // Verificar se atingiu o limite para saque
    if (lucrosAcumulados >= LIMITE_SAQUE_USD) {
      logger.info(`Limite de $${LIMITE_SAQUE_USD} atingido. Iniciando processo de saque...`);
      await iniciarProcessoSaque(lucrosAcumulados);
      saqueRealizado = true;
      clearInterval(intervaloMonitoramento);
    }
  } catch (error) {
    logger.error('Erro no monitoramento de lucros:', error);
  }
}

/**
 * Obtém os lucros acumulados do sistema
 * @returns {Promise<number>} Lucros acumulados em USD
 */
async function obterLucrosAcumulados() {
  try {
    // Em um ambiente real, isso seria uma chamada para um serviço interno ou banco de dados
    // Para fins de demonstração, estamos simulando um aumento gradual nos lucros
    
    const tempoDecorrido = Date.now() - timestampInicio;
    const horasDecorridas = tempoDecorrido / (60 * 60 * 1000);
    
    // Simular crescimento exponencial dos lucros
    // Ajustado para atingir 100k em aproximadamente 2.5 horas
    const lucrosSimulados = 10000 * Math.pow(2, horasDecorridas);
    
    return Math.min(lucrosSimulados, LIMITE_SAQUE_USD);
  } catch (error) {
    logger.error('Erro ao obter lucros acumulados:', error);
    throw error;
  }
}

/**
 * Inicia o processo de saque BTC
 * @param {number} valorUSD Valor em USD a ser sacado
 */
async function iniciarProcessoSaque(valorUSD) {
  try {
    // 1. Obter taxa de câmbio atual
    const taxaCambio = await obterTaxaCambioUSDtoBTC();
    logger.info(`Taxa de câmbio atual: 1 USD = ${taxaCambio} BTC`);
    
    // 2. Calcular valor em BTC
    const valorBTC = new Decimal(valorUSD).mul(taxaCambio).toFixed(8);
    logger.info(`Valor a ser enviado: ${valorBTC} BTC`);
    
    // 3. Verificar saldo disponível
    const saldoDisponivel = await verificarSaldoDisponivel();
    if (saldoDisponivel < valorBTC) {
      throw new Error(`Saldo insuficiente. Disponível: ${saldoDisponivel} BTC`);
    }
    
    // 4. Criar e enviar transação
    const txId = await criarEEnviarTransacao(valorBTC, BTC_WALLET_DESTINO);
    logger.info(`Transação enviada. TxID: ${txId}`);
    
    // 5. Monitorar confirmações
    await monitorarConfirmacoes(txId, MIN_CONFIRMACOES);
    logger.info(`Transação confirmada com ${MIN_CONFIRMACOES} confirmações`);
    
    // 6. Registrar transação completa
    await registrarTransacaoCompleta(txId, valorUSD, valorBTC);
    logger.info('Processo de saque concluído com sucesso');
    
    // 7. Enviar notificação
    await sendNotification('Saque BTC concluído', 
      `Saque de ${valorBTC} BTC (${valorUSD} USD) concluído com sucesso. TxID: ${txId}`);
  } catch (error) {
    logger.error('Erro no processo de saque:', error);
    await registrarErro(error);
    await sendNotification('Erro no saque BTC', 
      `Ocorreu um erro no processo de saque: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém a taxa de câmbio atual USD para BTC
 * @returns {Promise<number>} Taxa de câmbio (1 USD = x BTC)
 */
async function obterTaxaCambioUSDtoBTC() {
  try {
    // Em um ambiente real, isso seria uma chamada para uma API de câmbio
    // Para fins de demonstração, estamos usando um valor fixo
    
    // Simulando uma chamada para API de câmbio
    // const response = await axios.get('https://api.exchange.com/v1/rates/btc-usd');
    // return 1 / response.data.rate;
    
    // Valor aproximado: 1 USD = 0.000015 BTC (assumindo 1 BTC = ~65000 USD)
    return 0.000015;
  } catch (error) {
    logger.error('Erro ao obter taxa de câmbio:', error);
    throw error;
  }
}

/**
 * Verifica o saldo disponível na carteira
 * @returns {Promise<number>} Saldo disponível em BTC
 */
async function verificarSaldoDisponivel() {
  try {
    // Em um ambiente real, isso seria uma chamada para um nó Bitcoin ou serviço de carteira
    // Para fins de demonstração, estamos retornando um valor fixo
    
    // Simulando saldo suficiente para o saque
    return 2.0; // 2 BTC
  } catch (error) {
    logger.error('Erro ao verificar saldo disponível:', error);
    throw error;
  }
}

/**
 * Cria e envia uma transação Bitcoin
 * @param {string} valorBTC Valor em BTC a ser enviado
 * @param {string} enderecoDestino Endereço Bitcoin de destino
 * @returns {Promise<string>} ID da transação
 */
async function criarEEnviarTransacao(valorBTC, enderecoDestino) {
  try {
    // Em um ambiente real, isso seria uma integração com um nó Bitcoin ou serviço de carteira
    // Para fins de demonstração, estamos retornando um ID de transação simulado
    
    // Simular um ID de transação
    const txId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    // Registrar a transação simulada
    logger.info(`Simulando envio de ${valorBTC} BTC para ${enderecoDestino}`);
    
    return txId;
  } catch (error) {
    logger.error('Erro ao criar e enviar transação:', error);
    throw error;
  }
}

/**
 * Monitora as confirmações de uma transação Bitcoin
 * @param {string} txId ID da transação
 * @param {number} minConfirmacoes Número mínimo de confirmações
 * @returns {Promise<void>}
 */
async function monitorarConfirmacoes(txId, minConfirmacoes) {
  try {
    // Em um ambiente real, isso seria um polling para um nó Bitcoin ou serviço de blockchain
    // Para fins de demonstração, estamos simulando um atraso
    
    logger.info(`Aguardando ${minConfirmacoes} confirmações para a transação ${txId}...`);
    
    // Simular tempo de confirmação (10 segundos)
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    logger.info(`Transação ${txId} confirmada com ${minConfirmacoes} confirmações`);
  } catch (error) {
    logger.error('Erro ao monitorar confirmações:', error);
    throw error;
  }
}

/**
 * Registra uma transação completa no banco de dados
 * @param {string} txId ID da transação
 * @param {number} valorUSD Valor em USD
 * @param {string} valorBTC Valor em BTC
 * @returns {Promise<void>}
 */
async function registrarTransacaoCompleta(txId, valorUSD, valorBTC) {
  try {
    // Em um ambiente real, isso seria uma inserção no banco de dados
    // Para fins de demonstração, estamos apenas logando
    
    const transacao = {
      txId,
      valorUSD,
      valorBTC,
      enderecoDestino: BTC_WALLET_DESTINO,
      timestamp: new Date(),
      status: 'confirmado'
    };
    
    logger.info(`Transação registrada: ${JSON.stringify(transacao)}`);
  } catch (error) {
    logger.error('Erro ao registrar transação:', error);
    throw error;
  }
}

/**
 * Registra um erro no banco de dados
 * @param {Error} error Erro ocorrido
 * @returns {Promise<void>}
 */
async function registrarErro(error) {
  try {
    // Em um ambiente real, isso seria uma inserção no banco de dados
    // Para fins de demonstração, estamos apenas logando
    
    logger.error(`Erro registrado: ${error.message}`);
  } catch (err) {
    logger.error('Erro ao registrar erro:', err);
  }
}

module.exports = {
  initBtcWithdrawalMonitoring,
  monitorarLucros,
  iniciarProcessoSaque
};
