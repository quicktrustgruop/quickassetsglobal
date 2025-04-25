const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware de autenticação
 */
const authMiddleware = (req, res, next) => {
  try {
    // Verificar se o token está presente no cabeçalho
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Acesso não autorizado. Token não fornecido.' 
      });
    }

    // Extrair o token
    const token = authHeader.split(' ')[1];

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adicionar o usuário decodificado à requisição
    req.user = decoded;
    
    // Prosseguir para o próximo middleware
    next();
  } catch (error) {
    logger.error(`Erro de autenticação: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Token expirado. Faça login novamente.' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Token inválido. Faça login novamente.' 
      });
    }
    
    return res.status(401).json({ 
      status: 'error', 
      message: 'Acesso não autorizado.' 
    });
  }
};

module.exports = {
  authMiddleware,
};
