const logger = require('../utils/logger');

/**
 * Middleware para tratamento de erros
 */
const errorHandler = (err, req, res, next) => {
  // Registrar o erro
  logger.error(`Erro: ${err.message}`);
  logger.error(err.stack);

  // Determinar o código de status HTTP
  const statusCode = err.statusCode || 500;

  // Enviar resposta de erro
  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

module.exports = {
  errorHandler,
};
