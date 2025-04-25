const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const url = require('url');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');

// Configurar logger
log.transports.file.level = 'info';
log.info('Aplicativo iniciando...');

// Configurar armazenamento local
const store = new Store();

// Manter uma referência global do objeto window
let mainWindow;

// Criar janela principal
function createWindow() {
  // Criar a janela do navegador
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../assets/icons/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Carregar o arquivo index.html do aplicativo
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Abrir o DevTools em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitido quando a janela é fechada
  mainWindow.on('closed', function () {
    // Dereferencia o objeto window
    mainWindow = null;
  });

  // Criar menu
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Configurações',
          click() {
            mainWindow.webContents.send('navigate', 'settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
          click() {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        {
          label: 'Dashboard',
          click() {
            mainWindow.webContents.send('navigate', 'dashboard');
          }
        },
        {
          label: 'Mineração',
          click() {
            mainWindow.webContents.send('navigate', 'mining');
          }
        },
        {
          label: 'DeFi',
          click() {
            mainWindow.webContents.send('navigate', 'defi');
          }
        },
        {
          label: 'Distribuição',
          click() {
            mainWindow.webContents.send('navigate', 'distribution');
          }
        },
        {
          label: 'Segurança',
          click() {
            mainWindow.webContents.send('navigate', 'security');
          }
        }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click() {
            mainWindow.webContents.send('navigate', 'about');
          }
        },
        {
          label: 'Verificar Atualizações',
          click() {
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Configurar auto-updater
  autoUpdater.on('checking-for-update', () => {
    log.info('Verificando atualizações...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Atualização disponível:', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Nenhuma atualização disponível:', info);
  });

  autoUpdater.on('error', (err) => {
    log.error('Erro ao atualizar:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = `Velocidade de download: ${progressObj.bytesPerSecond}`;
    logMessage = `${logMessage} - Baixado ${progressObj.percent}%`;
    logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
    log.info(logMessage);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Atualização baixada:', info);
  });
}

// Este método será chamado quando o Electron terminar de inicializar
app.on('ready', () => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

// Sair quando todas as janelas estiverem fechadas
app.on('window-all-closed', function () {
  // No macOS é comum para aplicativos e sua barra de menu 
  // permanecerem ativos até que o usuário explicitamente encerre com Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // No macOS é comum recriar uma janela no aplicativo quando o
  // ícone da dock é clicado e não há outras janelas abertas.
  if (mainWindow === null) {
    createWindow();
  }
});

// Manipuladores IPC para comunicação com o renderer process

// Autenticação
ipcMain.on('login', async (event, credentials) => {
  try {
    // Em um ambiente real, isso seria uma chamada para a API de autenticação
    // Para fins de demonstração, estamos simulando uma resposta de sucesso
    
    log.info(`Tentativa de login para usuário: ${credentials.username}`);
    
    // Simular uma chamada de API
    setTimeout(() => {
      // Armazenar token JWT
      store.set('auth.token', 'jwt_token_simulado');
      store.set('auth.user', {
        id: 1,
        username: credentials.username,
        name: 'Administrador',
        role: 'admin'
      });
      
      event.reply('login-response', {
        success: true,
        token: 'jwt_token_simulado',
        user: {
          id: 1,
          username: credentials.username,
          name: 'Administrador',
          role: 'admin'
        }
      });
    }, 1000);
  } catch (error) {
    log.error('Erro ao fazer login:', error);
    event.reply('login-response', {
      success: false,
      error: error.message
    });
  }
});

ipcMain.on('logout', (event) => {
  // Limpar dados de autenticação
  store.delete('auth.token');
  store.delete('auth.user');
  
  event.reply('logout-response', {
    success: true
  });
});

// Configurações
ipcMain.on('get-settings', (event) => {
  const settings = store.get('settings') || {
    apiUrl: 'http://localhost:3000',
    refreshInterval: 30000,
    theme: 'light',
    notifications: true
  };
  
  event.reply('settings-response', settings);
});

ipcMain.on('save-settings', (event, settings) => {
  store.set('settings', settings);
  event.reply('save-settings-response', {
    success: true
  });
});

// API Requests
ipcMain.on('api-request', async (event, { endpoint, method, data }) => {
  try {
    // Em um ambiente real, isso seria uma chamada para a API
    // Para fins de demonstração, estamos simulando uma resposta de sucesso
    
    log.info(`API Request: ${method} ${endpoint}`);
    
    // Simular uma chamada de API
    setTimeout(() => {
      // Simular diferentes endpoints
      let responseData;
      
      if (endpoint === '/api/dashboard/summary') {
        responseData = {
          lucroTotal: {
            hoje: 154383.57,
            ontem: 148752.23,
            ultimaSemana: 1025634.89,
            ultimoMes: 4328752.45,
            variacaoDiaria: 3.79
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
            ultimaDistribuicao: new Date(Date.now() - 3600000),
            valorTotalDistribuido: 250000,
            proximaDistribuicao: new Date(Date.now() + 3600000)
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
      } else if (endpoint === '/api/mining/status') {
        responseData = {
          status: 'ativo',
          totalHashrate: '15.2 PH/s',
          mineracaoPorMoeda: [
            {
              moeda: 'BTC',
              hashrate: '8.5 PH/s',
              algoritmo: 'SHA-256',
              lucroEstimado24h: 45000,
              workers: 5200,
              pool: '2miners'
            },
            {
              moeda: 'ETH',
              hashrate: '3.2 PH/s',
              algoritmo: 'Ethash',
              lucroEstimado24h: 28000,
              workers: 3800,
              pool: 'Ethermine'
            },
            {
              moeda: 'KASPA',
              hashrate: '2.1 PH/s',
              algoritmo: 'KHeavyHash',
              lucroEstimado24h: 18000,
              workers: 2500,
              pool: 'HeroMiners'
            },
            {
              moeda: 'FLUX',
              hashrate: '1.4 PH/s',
              algoritmo: 'ZelHash',
              lucroEstimado24h: 12000,
              workers: 1800,
              pool: 'MinerPool'
            }
          ],
          servidores: {
            total: 25000,
            ativos: 24850,
            inativos: 150,
            manutencao: 0
          },
          lucroTotal24h: 103000,
          ultimaAtualizacao: new Date()
        };
      } else {
        responseData = {
          message: 'Endpoint não simulado'
        };
      }
      
      event.reply('api-response', {
        success: true,
        data: responseData,
        endpoint
      });
    }, 500);
  } catch (error) {
    log.error(`Erro na requisição API (${endpoint}):`, error);
    event.reply('api-response', {
      success: false,
      error: error.message,
      endpoint
    });
  }
});
