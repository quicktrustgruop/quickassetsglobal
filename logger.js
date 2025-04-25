const winston = require('winston');

// Definir níveis de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Definir cores para cada nível
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Adicionar cores ao winston
winston.addColors(colors);

// Definir formato de log
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Definir transportes (onde os logs serão armazenados)
const transports = [
  // Console para desenvolvimento
  new winston.transports.Console(),
  
  // Arquivo para todos os logs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  
  // Arquivo para todos os logs
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// Criar o logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
});

module.exports = logger;
