require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const winston = require('winston');
const { Sequelize } = require('sequelize');
const { setupMetrics } = require('./utils/metrics');
const logger = require('./utils/logger');

// Importar rotas
const authRoutes = require('./routes/auth.routes');
const miningRoutes = require('./routes/mining.routes');
const defiRoutes = require('./routes/defi.routes');
const distributionRoutes = require('./routes/distribution.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Inicializar serviços
const { initDistributionSchedulers } = require('./services/distributionScheduler.service');
const { initBtcWithdrawalMonitoring } = require('./services/btcWithdrawal.service');

// Configuração do app
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(compression());

// Configuração de métricas para monitoramento
setupMetrics(app);

// Configuração do banco de dados
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Testar conexão com o banco de dados
sequelize
  .authenticate()
  .then(() => {
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');
  })
  .catch(err => {
    logger.error('Erro ao conectar ao banco de dados:', err);
  });

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/defi', defiRoutes);
app.use('/api/distribution', distributionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota de saúde para verificação de status
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT} em ambiente ${process.env.NODE_ENV}`);
  
  // Iniciar monitoramento de saque BTC se estiver em ambiente de produção
  if (process.env.NODE_ENV === 'production') {
    initBtcWithdrawalMonitoring();
    logger.info('Monitoramento de saque BTC iniciado');
    
    // Iniciar agendadores de distribuição
    initDistributionSchedulers();
    logger.info('Agendadores de distribuição iniciados');
  }
});

// Tratamento de encerramento gracioso
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido. Encerrando servidor...');
  server.close(() => {
    logger.info('Servidor encerrado');
    sequelize.close();
  });
});

module.exports = { app, server, sequelize };
