# Use a imagem oficial do Node.js como base
FROM node:20-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar o código-fonte
COPY . .

# Criar diretório de logs
RUN mkdir -p logs

# Expor a porta que o app vai usar
EXPOSE 3000

# Comando para iniciar o aplicativo
CMD ["node", "src/index.js"]
