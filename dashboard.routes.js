const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @route   GET /api/dashboard/summary
 * @desc    Obter resumo geral para o dashboard
 * @access  Private
 */
router.get('/summary', async (req, res, next) => {
  try {
    // Em um ambiente real, isso seria uma agregação de dados de vários serviços
    // Para fins de demonstração, estamos retornando dados simulados
    
    const summary = {
      lucroTotal: {
        hoje: 154383.57,
        ontem: 148752.23,
        ultimaSemana: 1025634.89,
        ultimoMes: 4328752.45,
        variacaoDiaria: 3.79 // percentual
      },
      mineracao: {
        status: 'ativo',
        hashrateTotalPH: 15.2,
        lucroHoje: 103000,
        moedasAtivas: 4,
        workersAtivos: 13150
      },
      defi: {
        status: 'ativo',
        valorInvestidoUSD: 150000000,
        lucroHoje: 51383.57,
        estrategiasAtivas: 4,
        apyMedio: 12.5
      },
      distribuicao: {
        ultimaDistribuicao: new Date(Date.now() - 3600000), // 1 hora atrás
        valorTotalDistribuido: 250000,
        proximaDistribuicao: new Date(Date.now() + 3600000) // 1 hora no futuro
      },
      seguranca: {
        status: 'seguro',
        alertasAtivos: 5,
        ultimaVerificacao: new Date()
      },
      saquesBTC: {
        status: 'ativo',
        lucrosAcumulados: 85000,
        limiteUSD: 100000,
        progresso: 85,
        tempoRestante: '0.5 horas'
      },
      ultimaAtualizacao: new Date()
    };
    
    res.status(200).json({
      status: 'success',
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/profit-chart
 * @desc    Obter dados para gráfico de lucros
 * @access  Private
 */
router.get('/profit-chart', async (req, res, next) => {
  try {
    // Em um ambiente real, isso seria uma consulta ao banco de dados
    // Para fins de demonstração, estamos retornando dados simulados
    
    // Gerar dados de lucro para os últimos 30 dias
    const hoje = new Date();
    const lucrosPorDia = [];
    
    for (let i = 29; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      
      // Simular variação de lucro entre 120k e 180k
      const lucroBase = 150000;
      const variacao = Math.random() * 60000 - 30000; // -30000 a +30000
      const lucroTotal = Math.round(lucroBase + variacao);
      
      // Distribuir o lucro entre mineração e DeFi
      const lucroMineracao = Math.round(lucroTotal * (0.6 + (Math.random() * 0.1 - 0.05))); // ~60% com variação
      const lucroDefi = lucroTotal - lucroMineracao;
      
      lucrosPorDia.push({
        data: data.toISOString().split('T')[0],
        lucroTotal,
        lucroMineracao,
        lucroDefi
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: lucrosPorDia
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/distribution-chart
 * @desc    Obter dados para gráfico de distribuição de lucros
 * @access  Private
 */
router.get('/distribution-chart', async (req, res, next) => {
  try {
    // Em um ambiente real, isso seria uma consulta ao banco de dados
    // Para fins de demonstração, estamos retornando dados simulados
    
    // Gerar dados de distribuição para os últimos 30 dias
    const hoje = new Date();
    const distribuicoesPorDia = [];
    
    for (let i = 29; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      
      // Simular variação de lucro entre 120k e 180k
      const lucroBase = 150000;
      const variacao = Math.random() * 60000 - 30000; // -30000 a +30000
      const lucroTotal = Math.round(lucroBase + variacao);
      
      // Calcular distribuição conforme percentuais definidos
      const distribuicaoBTC = Math.round(lucroTotal * 0.35); // 35% para BTC
      const distribuicaoETH = Math.round(lucroTotal * 0.20); // 20% para ETH
      const reinvestimento = Math.round(lucroTotal * 0.20); // 20% para reinvestimento
      const operacional = lucroTotal - distribuicaoBTC - distribuicaoETH - reinvestimento; // Restante para operacional
      
      distribuicoesPorDia.push({
        data: data.toISOString().split('T')[0],
        lucroTotal,
        distribuicaoBTC,
        distribuicaoETH,
        reinvestimento,
        operacional
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: distribuicoesPorDia
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/mining-distribution
 * @desc    Obter dados para gráfico de distribuição de mineração por moeda
 * @access  Private
 */
router.get('/mining-distribution', async (req, res, next) => {
  try {
    // Em um ambiente real, isso seria uma consulta a APIs de mineração
    // Para fins de demonstração, estamos retornando dados simulados
    
    const mineracaoPorMoeda = [
      {
        moeda: 'BTC',
        hashrate: '8.5 PH/s',
        percentual: 56,
        lucroEstimado24h: 45000,
        cor: '#F7931A'
      },
      {
        moeda: 'ETH',
        hashrate: '3.2 PH/s',
        percentual: 21,
        lucroEstimado24h: 28000,
        cor: '#627EEA'
      },
      {
        moeda: 'KASPA',
        hashrate: '2.1 PH/s',
        percentual: 14,
        lucroEstimado24h: 18000,
        cor: '#4F46E5'
      },
      {
        moeda: 'FLUX',
        hashrate: '1.4 PH/s',
        percentual: 9,
        lucroEstimado24h: 12000,
        cor: '#2B61D1'
      }
    ];
    
    res.status(200).json({
      status: 'success',
      data: mineracaoPorMoeda
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/defi-distribution
 * @desc    Obter dados para gráfico de distribuição de investimentos DeFi
 * @access  Private
 */
router.get('/defi-distribution', async (req, res, next) => {
  try {
    // Em um ambiente real, isso seria uma consulta a APIs DeFi
    // Para fins de demonstração, estamos retornando dados simulados
    
    const defiPorEstrategia = [
      {
        estrategia: 'Yield Farming',
        valorInvestido: 60000000,
        percentual: 40,
        apyMedio: 12.5,
        lucroEstimado24h: 20547.95,
        cor: '#10B981'
      },
      {
        estrategia: 'Staking',
        valorInvestido: 45000000,
        percentual: 30,
        apyMedio: 8.2,
        lucroEstimado24h: 10109.59,
        cor: '#3B82F6'
      },
      {
        estrategia: 'Flash Loans',
        valorInvestido: 25000000,
        percentual: 16.67,
        apyMedio: 15.3,
        lucroEstimado24h: 10479.45,
        cor: '#EC4899'
      },
      {
        estrategia: 'Arbitragem',
        valorInvestido: 20000000,
        percentual: 13.33,
        apyMedio: 18.7,
        lucroEstimado24h: 10246.58,
        cor: '#8B5CF6'
      }
    ];
    
    res.status(200).json({
      status: 'success',
      data: defiPorEstrategia
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
