#!/usr/bin/env bash
# Script para gerar projeto QuickAssetsGlobal completo para AWS Serverless

set -e
ROOT_DIR="quickassetsglobal-lambda"
rm -rf "$ROOT_DIR" && mkdir -p "$ROOT_DIR"
cd "$ROOT_DIR"

# Criar diretórios
mkdir -p src/handlers src/services src/utils config

# .env.example
cat > .env.example << 'EOF'
# Ambiente AWS
AWS_REGION=us-east-1
# S3 bucket para relatórios
env REPORT_BUCKET=quickassetsglobal-reports
# SNS topic ARN para notificações
env SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:QuickAssetsAlerts
# DynamoDB table name
env TRANSACTIONS_TABLE=QuickAssetsTransactions
# Tempo de agendamento (Rate expression)
env BTC_WITHDRAWAL_RATE=rate(5 minutes)
env DISTRIBUTION_RATE=rate(1 hour)
EOF

# package.json
cat > package.json << 'EOF'
{
  "name": "quickassetsglobal-lambda",
  "version": "1.0.0",
  "description": "QuickAssetsGlobal Serverless Production",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "deploy": "serverless deploy",
    "dev": "serverless offline"
  },
  "dependencies": {
    "@vendia/serverless-express": "^4.15.0",
    "express": "^4.18.3",
    "dotenv": "^16.4.0",
    "@aws-sdk/client-dynamodb": "^3.300.0",
    "@aws-sdk/lib-dynamodb": "^3.300.0",
    "@aws-sdk/client-s3": "^3.300.0",
    "@aws-sdk/client-sns": "^3.300.0",
    "winston": "^3.13.0",
    "csv-writer": "^1.6.0"
  },
  "devDependencies": {
    "serverless": "^3.38.0",
    "serverless-offline": "^12.0.4"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
EOF

# serverless.yml
cat > serverless.yml << 'EOF'
service: quickassetsglobal
frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs22.x
  region: \${env:AWS_REGION}
  environment:
    REPORT_BUCKET: \${env:REPORT_BUCKET}
    SNS_TOPIC_ARN: \${env:SNS_TOPIC_ARN}
    TRANSACTIONS_TABLE: \${env:TRANSACTIONS_TABLE}
    BTC_WITHDRAWAL_RATE: \${env:BTC_WITHDRAWAL_RATE}
    DISTRIBUTION_RATE: \${env:DISTRIBUTION_RATE}
  iam:
    role:
      statements:
        - Effect: "Allow"
          Action:
            - "dynamodb:PutItem"
            - "dynamodb:Query"
          Resource: "arn:aws:dynamodb:\${self:provider.region}:*:table/\${self:provider.environment.TRANSACTIONS_TABLE}"
        - Effect: "Allow"
          Action:
            - "s3:PutObject"
            - "s3:GetObject"
          Resource: "arn:aws:s3:::\${self:provider.environment.REPORT_BUCKET}/*"
        - Effect: "Allow"
          Action:
            - "sns:Publish"
          Resource: "\${self:provider.environment.SNS_TOPIC_ARN}"

functions:
  api:
    handler: index.handler
    events:
      - httpApi: '*'
  btcWithdrawalScheduler:
    handler: src/handlers/btcWithdrawal.handler.handler
    events:
      - schedule:
          rate: \${env:BTC_WITHDRAWAL_RATE}
  distributionScheduler:
    handler: src/handlers/distributionScheduler.handler.handler
    events:
      - schedule:
          rate: \${env:DISTRIBUTION_RATE}

plugins:
  - serverless-offline

resources:
  Resources:
    TransactionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: \${self:provider.environment.TRANSACTIONS_TABLE}
        AttributeDefinitions:
          - AttributeName: "transactionId"
            AttributeType: "S"
          - AttributeName: "timestamp"
            AttributeType: "S"
        KeySchema:
          - AttributeName: "transactionId"
            KeyType: "HASH"
        BillingMode: PAY_PER_REQUEST
    ReportsBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: \${self:provider.environment.REPORT_BUCKET}
    AlertsTopic:
      Type: AWS::SNS::Topic
      Properties:
        TopicName: "QuickAssetsAlerts"
EOF

# index.js (Entrypoint HTTP API)
cat > index.js << 'EOF'
import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

import logger from './src/utils/logger.js';
import { initRoutes } from './src/indexRoutes.js';

dotenv.config();
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(compression());

initRoutes(app);
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

export const handler = serverlessExpress({ app });
EOF

# src/indexRoutes.js
cat > src/indexRoutes.js << 'EOF'
import authRoutes from './services/auth.routes.js';
// importe outras rotas se necessário
export const initRoutes = (app) => {
  app.use('/api/auth', authRoutes);
};
EOF

# src/utils/logger.js
cat > src/utils/logger.js << 'EOF'
import winston from 'winston';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});
export default logger;
EOF

# src/utils/dynamoDbClient.js
cat > src/utils/dynamoDbClient.js << 'EOF'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';
dotenv.config();
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
export const ddbDocClient = DynamoDBDocumentClient.from(ddb);
EOF

# src/utils/s3Client.js
cat > src/utils/s3Client.js << 'EOF'
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();
export const s3Client = new S3Client({ region: process.env.AWS_REGION });
EOF

# src/utils/notificationService.js
cat > src/utils/notificationService.js << 'EOF'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import dotenv from 'dotenv';
dotenv.config();
const sns = new SNSClient({ region: process.env.AWS_REGION });
export const notify = async (subject, message) => {
  await sns.send(new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN,
    Subject: subject,
    Message: message
  }));
};
EOF

# src/services/btcWithdrawal.service.js
cat > src/services/btcWithdrawal.service.js << 'EOF'
import { ddbDocClient } from '../utils/dynamoDbClient.js';
import { v4 as uuidv4 } from 'uuid';

export const processBtcWithdrawals = async () => {
  // Lógica de busca de saques em BTC
  // Exemplo fictício:
  const withdrawals = [ { amount: 0.01, address: '1A2b3C', timestamp: new Date().toISOString() } ];
  const records = withdrawals.map(w => ({
    transactionId: uuidv4(),
    amount: w.amount,
    address: w.address,
    timestamp: w.timestamp
  }));
  // Gravar no DynamoDB
  for (const record of records) {
    await ddbDocClient.put({
      TableName: process.env.TRANSACTIONS_TABLE,
      Item: record
    });
  }
  return records;
};
EOF

# src/services/distributionScheduler.service.js
cat > src/services/distributionScheduler.service.js << 'EOF'
import { ddbDocClient } from '../utils/dynamoDbClient.js';
// implementa lógica de distribuição de lucros

export const processDistributions = async () => {
  // Exemplo fictício de distribuição
  const result = { distributed: true, timestamp: new Date().toISOString() };
  // Salvar no DynamoDB ou outro recurso
  return result;
};
EOF

# src/handlers/btcWithdrawal.handler.js
cat > src/handlers/btcWithdrawal.handler.js << 'EOF'
import { processBtcWithdrawals } from '../services/btcWithdrawal.service.js';
import { generateReports } from '../utils/reportService.js';
import { notify } from '../utils/notificationService.js';

export const handler = async () => {
  try {
    const records = await processBtcWithdrawals();
    const reportInfo = await generateReports(records, 'btc_withdrawals');
    await notify('BTC Withdrawals Processed', `Report generated: ${reportInfo.key}`);
    return { status: 'success', recordsCount: records.length };
  } catch (error) {
    await notify('Error in BTC Withdrawal', error.message);
    throw error;
  }
};
EOF

# src/handlers/distributionScheduler.handler.js
cat > src/handlers/distributionScheduler.handler.js << 'EOF'
import { processDistributions } from '../services/distributionScheduler.service.js';
import { generateReports } from '../utils/reportService.js';
import { notify } from '../utils/notificationService.js';

export const handler = async () => {
  try {
    const result = await processDistributions();
    const reportInfo = await generateReports([result], 'distributions');
    await notify('Distributions Processed', `Report generated: ${reportInfo.key}`);
    return { status: 'success' };
  } catch (error) {
    await notify('Error in Distribution', error.message);
    throw error;
  }
};
EOF

# src/utils/reportService.js
cat > src/utils/reportService.js << 'EOF'
import { createObjectCsvWriter } from 'csv-writer';
import { s3Client } from './s3Client.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { notify } from './notificationService.js';

envprefix = process.env.REPORT_BUCKET;

export const generateReports = async (data, prefix) => {
  const timestamp = new Date().toISOString();
  const baseKey = `${prefix}/${timestamp}`;

  // JSON report
  const jsonData = JSON.stringify(data, null, 2);
  const jsonKey = `${baseKey}.json`;
  await s3Client.send(new PutObjectCommand({ Bucket: process.env.REPORT_BUCKET, Key: jsonKey, Body: jsonData }));

  // CSV report
  const csvKey = `${baseKey}.csv`;
  const csvWriter = createObjectCsvWriter({ path: `/tmp/report.csv`, header: Object.keys(data[0]).map(k => ({ id: k, title: k })), });
  await csvWriter.writeRecords(data);
  const csvBody = await fs.promises.readFile('/tmp/report.csv');
  await s3Client.send(new PutObjectCommand({ Bucket: process.env.REPORT_BUCKET, Key: csvKey, Body: csvBody }));

  // Generate SHA-256 hash of JSON
  const hash = crypto.createHash('sha256').update(jsonData).digest('hex');

  // Notify with hash\await notify('Report Hash', `Prefix: ${prefix}, Hash: ${hash}`);

  return { key: baseKey, hash };
};
EOF

# README.md
cat > README.md << 'EOF'
# QuickAssetsGlobal AWS Serverless

Projeto completo para AWS Lambda com Node.js 22.x, DynamoDB, S3, SNS e relatórios de compliance.

## Setup

1. Copie `.env.example` para `.env` e preencha variáveis.
2. Instale dependências:
   ```bash
   npm install
   ```
3. Faça deploy:
   ```bash
   npm run deploy
   ```

## Funções

- **api**: endpoint HTTP para rotas express.
- **btcWithdrawalScheduler**: executa a cada `BTC_WITHDRAWAL_RATE`.
- **distributionScheduler**: executa a cada `DISTRIBUTION_RATE`.

## Compliance Reports

Relatórios JSON e CSV armazenados em S3, hash enviado via SNS.

EOF

# Tornar o script executável
chmod +x generate_project.sh

echo "Projeto QuickAssetsGlobal gerado em $(pwd)"