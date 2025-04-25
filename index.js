require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');

// Importar rotas
const miningRoutes = require('./routes/mining.routes');
const defiRoutes = require('./routes/defi.routes');
const distributionRoutes = require('./routes/distribution.routes');
const securityRoutes = require('./routes/security.routes');
const authRoutes = require('./routes/auth.routes');

// Importar middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Importar serviços
const { initBtcWithdrawalMonitoring } = require('./services/btcWithdrawal.service');
const logger = require('./utils/logger');

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar middleware
app.use(helmet()); // Segurança
app.use(cors()); // CORS
app.use(morgan('combined')); // Logging
app.use(bodyParser.json()); // Parse JSON
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rotas públicas
app.use('/api/auth', authRoutes);

// Middleware de autenticação para rotas protegidas
app.use('/api', authMiddleware);

// Rotas protegidas
app.use('/api/mining', miningRoutes);
app.use('/api/defi', defiRoutes);
app.use('/api/distribution', distributionRoutes);
app.use('/api/security', securityRoutes);

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT} em ambiente ${process.env.NODE_ENV}`);
  
  // Iniciar monitoramento de saque BTC se estiver em ambiente de produção
  if (process.env.NODE_ENV === 'production') {
    initBtcWithdrawalMonitoring();
    logger.info('Monitoramento de saque BTC iniciado');
  }
});

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
  logger.error('Exceção não capturada:', error);
  // Em produção, podemos querer notificar administradores e/ou reiniciar o processo
  if (process.env.NODE_ENV === 'production') {
    // Implementar notificação
  }
});

// Tratamento de rejeições de promessas não capturadas
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rejeição não tratada:', reason);
  // Em produção, podemos querer notificar administradores
  if (process.env.NODE_ENV === 'production') {
    // Implementar notificação
  }
});

module.exports = app; // Para testes
