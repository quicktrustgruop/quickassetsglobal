const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

// Simulação de banco de dados de usuários
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$10$X7o4c5/QR6QFmrdgGOIXO.3IOl7qVgQMG8HDYfcHW9Nbp9jKcNoqq', // senha: admin123
    role: 'admin',
    name: 'Administrador',
    email: 'admin@quickassets.global'
  },
  {
    id: 2,
    username: 'user',
    password: '$2b$10$X7o4c5/QR6QFmrdgGOIXO.3IOl7qVgQMG8HDYfcHW9Nbp9jKcNoqq', // senha: admin123
    role: 'user',
    name: 'Usuário Padrão',
    email: 'user@quickassets.global'
  }
];

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuário e gerar token
 * @access  Public
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // Validar entrada
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Nome de usuário e senha são obrigatórios'
      });
    }
    
    // Encontrar usuário
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciais inválidas'
      });
    }
    
    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciais inválidas'
      });
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );
    
    // Registrar login
    logger.info(`Usuário ${username} autenticado com sucesso`);
    
    // Retornar token e informações do usuário
    res.status(200).json({
      status: 'success',
      message: 'Autenticação bem-sucedida',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Obter informações do usuário atual
 * @access  Private
 */
router.get('/me', async (req, res, next) => {
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
    
    // Encontrar usuário
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    // Retornar informações do usuário
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
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
    
    next(error);
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout do usuário (invalidar token no cliente)
 * @access  Private
 */
router.post('/logout', (req, res) => {
  // No backend, não precisamos fazer nada além de informar o cliente para remover o token
  res.status(200).json({
    status: 'success',
    message: 'Logout realizado com sucesso'
  });
});

module.exports = router;
