const express = require('express');
const router = express.Router();
const { initBtcWithdrawalMonitoring, monitorarLucros, iniciarProcessoSaque } = require('../services/btcWithdrawal.service');
const logger = require('../utils/logger');

/**
 * @route   GET /api/distribution/status
 * @desc    Obter status da distribuição de lucros
 * @access  Private
 */
router.get('/status', async (req, res, next) => {
  try {
    // Em um ambiente real, isso seria uma consulta ao banco de dados
    // Para fins de demonstração, estamos retornando dados simulados
    
    const distribuicaoStatus = {
      ultimaDistribuicao: new Date(Date.now() - 3600000), // 1 hora atrás
      valorTotalDistribuido: 250000,
      distribuicoesPorCarteira: {
        btc: {
          endereco: process.env.BTC_WALLET_ADDRESS,
          valorUSD: 87500, // 35% de 250000
          ultimaTransacao: 'tx_123456789'
        },
        eth: {
          endereco: process.env.ETH_WALLET_ADDRESS,
          valorUSD: 50000, // 20% de 250000
          ultimaTransacao: '0xabcdef123456789'
        },
        reinvestimento: {
          valorUSD: 50000, // 20% de 250000
          estrategias: ['yield_farming', 'staking', 'mineracao']
        }
      },
      proximaDistribuicao: new Date(Date.now() + 3600000) // 1 hora no futuro
    };
    
    res.status(200).json({
      status: 'success',
      data: distribuicaoStatus
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/distribution/manual
 * @desc    Iniciar distribuição manual de lucros
 * @access  Private (Admin)
 */
router.post('/manual', async (req, res, next) => {
  try {
    // Verificar se o usuário tem permissão de administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Acesso negado. Apenas administradores podem iniciar distribuições manuais.'
      });
    }
    
    const { valorUSD } = req.body;
    
    if (!valorUSD || valorUSD <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valor USD inválido. Deve ser um número positivo.'
      });
    }
    
    // Iniciar processo de distribuição
    logger.info(`Iniciando distribuição manual de $${valorUSD}`);
    
    // Em um ambiente real, isso seria uma chamada para um serviço de distribuição
    // Para fins de demonstração, estamos simulando uma resposta de sucesso
    
    res.status(200).json({
      status: 'success',
      message: `Distribuição manual de $${valorUSD} iniciada com sucesso.`,
      data: {
        id: `dist_${Date.now()}`,
        valorUSD,
        timestamp: new Date(),
        status: 'em_processamento'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/distribution/btc-withdrawal/init
 * @desc    Iniciar monitoramento de saque BTC
 * @access  Private (Admin)
 */
router.post('/btc-withdrawal/init', async (req, res, next) => {
  try {
    // Verificar se o usuário tem permissão de administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Acesso negado. Apenas administradores podem iniciar o monitoramento de saque BTC.'
      });
    }
    
    // Iniciar monitoramento
    initBtcWithdrawalMonitoring();
    
    res.status(200).json({
      status: 'success',
      message: 'Monitoramento de saque BTC iniciado com sucesso.',
      data: {
        limiteUSD: process.env.SAQUE_BTC_LIMITE_USD || 100000,
        tempoLimiteHoras: process.env.SAQUE_BTC_TEMPO_LIMITE_HORAS || 3,
        carteiraBTC: process.env.BTC_WALLET_ADDRESS
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/distribution/btc-withdrawal/status
 * @desc    Obter status do monitoramento de saque BTC
 * @access  Private
 */
router.get('/btc-withdrawal/status', async (req, res, next) => {
  try {
    // Em um ambiente real, isso seria uma consulta ao banco de dados
    // Para fins de demonstração, estamos retornando dados simulados
    
    const timestampInicio = Date.now() - 3600000; // 1 hora atrás
    const tempoDecorrido = Date.now() - timestampInicio;
    const horasDecorridas = tempoDecorrido / (60 * 60 * 1000);
    
    // Simular crescimento exponencial dos lucros
    const lucrosSimulados = 10000 * Math.pow(2, horasDecorridas);
    const limiteUSD = process.env.SAQUE_BTC_LIMITE_USD || 100000;
    const tempoLimiteHoras = process.env.SAQUE_BTC_TEMPO_LIMITE_HORAS || 3;
    
    const status = {
      ativo: true,
      timestampInicio: new Date(timestampInicio),
      tempoDecorrido: `${horasDecorridas.toFixed(2)} horas`,
      tempoRestante: `${Math.max(0, tempoLimiteHoras - horasDecorridas).toFixed(2)} horas`,
      lucrosAcumulados: Math.min(lucrosSimulados, limiteUSD),
      limiteUSD,
      progresso: `${Math.min(100, (lucrosSimulados / limiteUSD) * 100).toFixed(2)}%`,
      carteiraBTC: process.env.BTC_WALLET_ADDRESS
    };
    
    res.status(200).json({
      status: 'success',
      data: status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/distribution/btc-withdrawal/force
 * @desc    Forçar saque BTC imediatamente
 * @access  Private (Admin)
 */
router.post('/btc-withdrawal/force', async (req, res, next) => {
  try {
    // Verificar se o usuário tem permissão de administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Acesso negado. Apenas administradores podem forçar saques BTC.'
      });
    }
    
    const { valorUSD } = req.body;
    
    if (!valorUSD || valorUSD <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valor USD inválido. Deve ser um número positivo.'
      });
    }
    
    // Iniciar processo de saque
    logger.info(`Iniciando saque BTC forçado de $${valorUSD}`);
    
    // Em um ambiente real, isso seria uma chamada para o serviço de saque
    // Para fins de demonstração, estamos simulando uma resposta de sucesso
    
    res.status(200).json({
      status: 'success',
      message: `Saque BTC de $${valorUSD} iniciado com sucesso.`,
      data: {
        id: `saque_${Date.now()}`,
        valorUSD,
        timestamp: new Date(),
        status: 'em_processamento',
        carteiraBTC: process.env.BTC_WALLET_ADDRESS
      }
    });
    
    // Iniciar processo de saque em background
    iniciarProcessoSaque(valorUSD).catch(error => {
      logger.error(`Erro ao processar saque forçado: ${error.message}`);
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
