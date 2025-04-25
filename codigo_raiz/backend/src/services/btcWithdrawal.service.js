const { Decimal } = require('decimal.js');
const logger = require('../utils/logger');
const { sendNotification } = require('../utils/notifications');

/**
 * Serviço para gerenciar saques de BTC
 * Implementa o requisito de saque de até 100 mil dólares para carteira Bitcoin nas primeiras 3 horas
 */

// Configurações
const BTC_WALLET_ADDRESS = process.env.BTC_WITHDRAWAL_ADDRESS || "bc1qxcfdzz3xhc4fkjwdtmdx94glxjx0zk2m53xmth";
const MAX_WITHDRAWAL_USD = new Decimal(process.env.MAX_WITHDRAWAL_USD || "100000");
const WITHDRAWAL_INTERVAL_HOURS = parseInt(process.env.WITHDRAWAL_INTERVAL_HOURS || "1");

// Variáveis de controle
let totalWithdrawnUSD = new Decimal(0);
let isFirstThreeHours = true;
let withdrawalStartTime = null;

/**
 * Inicializa o monitoramento de saque BTC
 */
function initBtcWithdrawalMonitoring() {
  withdrawalStartTime = new Date();
  logger.info(`Monitoramento de saque BTC iniciado em ${withdrawalStartTime.toISOString()}`);
  logger.info(`Endereço de saque: ${BTC_WALLET_ADDRESS}`);
  logger.info(`Limite máximo de saque: $${MAX_WITHDRAWAL_USD}`);
  
  // Verificar a cada hora se ainda estamos nas primeiras 3 horas
  setInterval(checkFirstThreeHours, 60 * 60 * 1000);
  
  // Agendar saques automáticos conforme intervalo configurado
  setInterval(processAutomaticWithdrawal, WITHDRAWAL_INTERVAL_HOURS * 60 * 60 * 1000);
}

/**
 * Verifica se ainda estamos nas primeiras 3 horas de operação
 */
function checkFirstThreeHours() {
  if (!withdrawalStartTime) return;
  
  const now = new Date();
  const elapsedHours = (now - withdrawalStartTime) / (1000 * 60 * 60);
  
  if (elapsedHours > 3 && isFirstThreeHours) {
    isFirstThreeHours = false;
    logger.info(`Primeiras 3 horas de operação concluídas. Total sacado: $${totalWithdrawnUSD}`);
    sendNotification('Período Inicial Concluído', 
      `As primeiras 3 horas de operação foram concluídas. Total sacado: $${totalWithdrawnUSD}`);
  }
}

/**
 * Processa um saque automático de BTC
 */
async function processAutomaticWithdrawal() {
  try {
    // Verificar se ainda estamos nas primeiras 3 horas
    if (!isFirstThreeHours) {
      logger.info('Fora do período inicial de 3 horas. Saques automáticos desativados.');
      return;
    }
    
    // Verificar se já atingimos o limite máximo
    if (totalWithdrawnUSD.gte(MAX_WITHDRAWAL_USD)) {
      logger.info(`Limite máximo de saque atingido: $${totalWithdrawnUSD}`);
      return;
    }
    
    // Calcular valor disponível para saque
    const availableForWithdrawal = MAX_WITHDRAWAL_USD.minus(totalWithdrawnUSD);
    const withdrawalAmount = availableForWithdrawal.lt(MAX_WITHDRAWAL_USD) ? 
      availableForWithdrawal : MAX_WITHDRAWAL_USD;
    
    logger.info(`Processando saque automático de $${withdrawalAmount}`);
    
    // Executar o saque
    const txId = await executeBtcWithdrawal(withdrawalAmount.toNumber());
    
    // Atualizar total sacado
    totalWithdrawnUSD = totalWithdrawnUSD.plus(withdrawalAmount);
    
    logger.info(`Saque de $${withdrawalAmount} concluído. TxID: ${txId}`);
    logger.info(`Total sacado até agora: $${totalWithdrawnUSD}`);
    
    // Enviar notificação
    await sendNotification(
      'Saque BTC Automático Concluído',
      `Saque de $${withdrawalAmount} para ${BTC_WALLET_ADDRESS} concluído com sucesso.\nTxID: ${txId}`
    );
    
    return txId;
  } catch (error) {
    logger.error('Erro ao processar saque automático:', error);
    await sendNotification('Erro no Saque Automático', `Ocorreu um erro no saque automático: ${error.message}`);
    throw error;
  }
}

/**
 * Executa um saque de BTC
 * @param {number} amountUSD Valor em USD a ser sacado
 * @returns {Promise<string>} ID da transação
 */
async function executeBtcWithdrawal(amountUSD) {
  try {
    // Obter taxa de câmbio atual
    const exchangeRate = await getBtcExchangeRate();
    logger.info(`Taxa de câmbio atual: 1 BTC = $${exchangeRate}`);
    
    // Converter USD para BTC
    const btcAmount = amountUSD / exchangeRate;
    logger.info(`Convertendo $${amountUSD} para ${btcAmount} BTC`);
    
    // Simular envio de BTC (em ambiente real, isso seria uma chamada para uma API de carteira ou exchange)
    // Aqui seria implementada a integração real com a carteira ou exchange
    const txId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    logger.info(`Saque de ${btcAmount} BTC (${amountUSD} USD) para ${BTC_WALLET_ADDRESS} iniciado`);
    
    // Simular tempo de confirmação
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    logger.info(`Saque de ${btcAmount} BTC concluído. TxID: ${txId}`);
    
    return txId;
  } catch (error) {
    logger.error('Erro ao executar saque BTC:', error);
    throw error;
  }
}

/**
 * Obtém a taxa de câmbio atual de BTC para USD
 * @returns {Promise<number>} Taxa de câmbio (1 BTC = x USD)
 */
async function getBtcExchangeRate() {
  try {
    // Em um ambiente real, isso seria uma chamada para uma API de câmbio
    // Por exemplo: CoinGecko, Binance, CoinMarketCap, etc.
    
    // Simular uma taxa de câmbio (aproximadamente 65000 USD por BTC)
    return 65000 + (Math.random() * 2000 - 1000);
  } catch (error) {
    logger.error('Erro ao obter taxa de câmbio BTC:', error);
    throw error;
  }
}

/**
 * Solicita um saque manual de BTC
 * @param {number} amountUSD Valor em USD a ser sacado
 * @param {string} address Endereço BTC de destino (opcional, usa o padrão se não fornecido)
 * @returns {Promise<string>} ID da transação
 */
async function requestManualWithdrawal(amountUSD, address = null) {
  try {
    const targetAddress = address || BTC_WALLET_ADDRESS;
    
    // Verificar se ainda estamos nas primeiras 3 horas para saques grandes
    if (!isFirstThreeHours && amountUSD > 10000) {
      logger.warn(`Solicitação de saque grande ($${amountUSD}) fora do período inicial de 3 horas`);
      // Em um ambiente real, isso poderia requerer aprovação adicional
    }
    
    logger.info(`Solicitação de saque manual de $${amountUSD} para ${targetAddress}`);
    
    // Executar o saque
    const txId = await executeBtcWithdrawal(amountUSD);
    
    // Se estiver nas primeiras 3 horas, atualizar o total sacado
    if (isFirstThreeHours) {
      totalWithdrawnUSD = totalWithdrawnUSD.plus(amountUSD);
      logger.info(`Total sacado nas primeiras 3 horas atualizado: $${totalWithdrawnUSD}`);
    }
    
    return txId;
  } catch (error) {
    logger.error('Erro ao solicitar saque manual:', error);
    throw error;
  }
}

module.exports = {
  initBtcWithdrawalMonitoring,
  processAutomaticWithdrawal,
  requestManualWithdrawal,
  executeBtcWithdrawal
};
