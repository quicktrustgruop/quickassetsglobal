const cron = require('node-cron');
const { Decimal } = require('decimal.js');
const logger = require('../utils/logger');
const { sendNotification } = require('../utils/notifications');
const { transferBTC } = require('./btcTransfer.service');
const { transferETH } = require('./ethTransfer.service');
const { transferUSDC } = require('./usdcTransfer.service');
const { getLucroAcumulado } = require('./lucro.service');

// Configurações
const BTC_WALLET_ADDRESS = process.env.BTC_WALLET_ADDRESS || "bc1qxcfdzz3xhc4fkjwdtmdx94glxjx0zk2m53xmth";
const ETH_WALLET_ADDRESS = process.env.ETH_WALLET_ADDRESS || "0x9146A9A5EFb565BF150607170CAc7C8A1b210F69";
const ETH_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY || "4af10da5e78257fecae8dfbc03cbaf101e7e3560bba96082fc6decfc6601b989";
const USDC_WALLET_ADDRESS = process.env.USDC_WALLET_ADDRESS || "0x57E0b47bA8308F1A40f95bB4D3aA867cd1C08760";

const DISTRIBUICAO_BTC_PERCENTUAL = parseFloat(process.env.DISTRIBUICAO_BTC_PERCENTUAL) || 70;
const DISTRIBUICAO_ETH_PERCENTUAL = parseFloat(process.env.DISTRIBUICAO_ETH_PERCENTUAL) || 20;
const DISTRIBUICAO_REINVESTIMENTO_PERCENTUAL = parseFloat(process.env.DISTRIBUICAO_REINVESTIMENTO_PERCENTUAL) || 10;

const DISTRIBUICAO_INTERVALO_HORAS = parseInt(process.env.DISTRIBUICAO_INTERVALO_HORAS) || 6;
const SAQUE_USDC_INTERVALO_HORAS = parseInt(process.env.SAQUE_USDC_INTERVALO_HORAS) || 1;
const SAQUE_USDC_LIMITE_USD = parseFloat(process.env.SAQUE_USDC_LIMITE_USD) || 100000;

// Redes suportadas para distribuição ETH
const REDES_ETH = [
  'ethereum',
  'linea',
  'arbitrum',
  'avalanche',
  'base',
  'bsc',
  'optimism',
  'polygon',
  'zksync'
];

/**
 * Inicializa os agendadores de distribuição
 */
function initDistributionSchedulers() {
  // Agendador de distribuição principal (a cada 6 horas)
  cron.schedule(`0 */${DISTRIBUICAO_INTERVALO_HORAS} * * *`, async () => {
    try {
      logger.info(`Iniciando distribuição de lucros agendada (intervalo: ${DISTRIBUICAO_INTERVALO_HORAS} horas)`);
      await executarDistribuicaoLucros();
    } catch (error) {
      logger.error('Erro na distribuição de lucros agendada:', error);
      await sendNotification('Erro na Distribuição', `Ocorreu um erro na distribuição de lucros: ${error.message}`);
    }
  });

  // Agendador de saque USDC (a cada 1 hora)
  cron.schedule(`0 */${SAQUE_USDC_INTERVALO_HORAS} * * *`, async () => {
    try {
      logger.info(`Iniciando saque USDC agendado (intervalo: ${SAQUE_USDC_INTERVALO_HORAS} hora)`);
      await executarSaqueUSCD();
    } catch (error) {
      logger.error('Erro no saque USDC agendado:', error);
      await sendNotification('Erro no Saque USDC', `Ocorreu um erro no saque USDC: ${error.message}`);
    }
  });

  logger.info('Agendadores de distribuição inicializados com sucesso');
}

/**
 * Executa a distribuição de lucros
 */
async function executarDistribuicaoLucros() {
  try {
    // 1. Obter lucro acumulado
    const lucroAcumulado = await getLucroAcumulado();
    logger.info(`Lucro acumulado para distribuição: $${lucroAcumulado}`);

    if (lucroAcumulado <= 0) {
      logger.info('Nenhum lucro acumulado para distribuição');
      return;
    }

    // 2. Calcular valores para cada destino
    const valorBTC = new Decimal(lucroAcumulado).mul(DISTRIBUICAO_BTC_PERCENTUAL).div(100);
    const valorETH = new Decimal(lucroAcumulado).mul(DISTRIBUICAO_ETH_PERCENTUAL).div(100);
    const valorReinvestimento = new Decimal(lucroAcumulado).mul(DISTRIBUICAO_REINVESTIMENTO_PERCENTUAL).div(100);

    logger.info(`Distribuição: BTC=$${valorBTC}, ETH=$${valorETH}, Reinvestimento=$${valorReinvestimento}`);

    // 3. Transferir para BTC
    const txIdBTC = await transferBTC(valorBTC.toNumber(), BTC_WALLET_ADDRESS);
    logger.info(`Transferência BTC concluída. TxID: ${txIdBTC}`);

    // 4. Transferir para ETH (distribuído entre múltiplas redes)
    const valorPorRede = valorETH.div(REDES_ETH.length);
    
    for (const rede of REDES_ETH) {
      const txIdETH = await transferETH(
        valorPorRede.toNumber(), 
        ETH_WALLET_ADDRESS, 
        rede, 
        ETH_PRIVATE_KEY
      );
      logger.info(`Transferência ETH (${rede}) concluída. TxID: ${txIdETH}`);
    }

    // 5. Reinvestir o valor restante
    await reinvestirLucro(valorReinvestimento.toNumber());
    logger.info(`Reinvestimento de $${valorReinvestimento} concluído`);

    // 6. Enviar notificação
    await sendNotification(
      'Distribuição de Lucros Concluída',
      `Distribuição de $${lucroAcumulado} concluída com sucesso.\nBTC: $${valorBTC}\nETH: $${valorETH}\nReinvestimento: $${valorReinvestimento}`
    );

    // 7. Registrar distribuição no banco de dados
    await registrarDistribuicao(
      lucroAcumulado,
      valorBTC.toNumber(),
      valorETH.toNumber(),
      valorReinvestimento.toNumber(),
      txIdBTC
    );

  } catch (error) {
    logger.error('Erro ao executar distribuição de lucros:', error);
    throw error;
  }
}

/**
 * Executa o saque de USDC
 */
async function executarSaqueUSCD() {
  try {
    // 1. Obter saldo disponível para saque
    const saldoDisponivel = await getSaldoDisponivelUSCD();
    logger.info(`Saldo disponível para saque USDC: $${saldoDisponivel}`);

    // 2. Verificar se há saldo suficiente
    if (saldoDisponivel <= 0) {
      logger.info('Nenhum saldo disponível para saque USDC');
      return;
    }

    // 3. Limitar ao valor máximo configurado
    const valorSaque = Math.min(saldoDisponivel, SAQUE_USDC_LIMITE_USD);
    logger.info(`Valor do saque USDC: $${valorSaque}`);

    // 4. Executar transferência
    const txId = await transferUSDC(valorSaque, USDC_WALLET_ADDRESS);
    logger.info(`Saque USDC concluído. TxID: ${txId}`);

    // 5. Enviar notificação
    await sendNotification(
      'Saque USDC Concluído',
      `Saque de $${valorSaque} USDC concluído com sucesso.\nTxID: ${txId}`
    );

    // 6. Registrar saque no banco de dados
    await registrarSaqueUSCD(valorSaque, txId);

  } catch (error) {
    logger.error('Erro ao executar saque USDC:', error);
    throw error;
  }
}

/**
 * Reinveste o lucro em estratégias DeFi
 * @param {number} valor Valor a ser reinvestido
 */
async function reinvestirLucro(valor) {
  // Implementação do reinvestimento em estratégias DeFi
  // Esta é uma função simulada
  logger.info(`Reinvestindo $${valor} em estratégias DeFi`);
  
  // Distribuir entre diferentes estratégias
  const estrategias = [
    { nome: 'Yield Farming', percentual: 40 },
    { nome: 'Staking', percentual: 30 },
    { nome: 'Flash Loans', percentual: 15 },
    { nome: 'Arbitragem', percentual: 15 }
  ];
  
  for (const estrategia of estrategias) {
    const valorEstrategia = new Decimal(valor).mul(estrategia.percentual).div(100);
    logger.info(`Reinvestindo $${valorEstrategia} em ${estrategia.nome}`);
    
    // Aqui seria implementada a lógica de reinvestimento específica para cada estratégia
  }
  
  return true;
}

/**
 * Obtém o saldo disponível para saque USDC
 * @returns {Promise<number>} Saldo disponível em USD
 */
async function getSaldoDisponivelUSCD() {
  // Implementação para obter saldo disponível para saque
  // Esta é uma função simulada
  
  // Em um ambiente real, isso seria uma consulta ao banco de dados ou APIs de exchanges
  return 100000; // Valor simulado
}

/**
 * Registra a distribuição no banco de dados
 * @param {number} lucroTotal Lucro total distribuído
 * @param {number} valorBTC Valor enviado para BTC
 * @param {number} valorETH Valor enviado para ETH
 * @param {number} valorReinvestimento Valor reinvestido
 * @param {string} txIdBTC ID da transação BTC
 */
async function registrarDistribuicao(lucroTotal, valorBTC, valorETH, valorReinvestimento, txIdBTC) {
  // Implementação para registrar distribuição no banco de dados
  // Esta é uma função simulada
  logger.info(`Registrando distribuição: Total=$${lucroTotal}, BTC=$${valorBTC}, ETH=$${valorETH}, Reinvestimento=$${valorReinvestimento}`);
  
  // Em um ambiente real, isso seria uma inserção no banco de dados
  return true;
}

/**
 * Registra o saque USDC no banco de dados
 * @param {number} valor Valor sacado
 * @param {string} txId ID da transação
 */
async function registrarSaqueUSCD(valor, txId) {
  // Implementação para registrar saque no banco de dados
  // Esta é uma função simulada
  logger.info(`Registrando saque USDC: $${valor}, TxID: ${txId}`);
  
  // Em um ambiente real, isso seria uma inserção no banco de dados
  return true;
}

module.exports = {
  initDistributionSchedulers,
  executarDistribuicaoLucros,
  executarSaqueUSCD
};
