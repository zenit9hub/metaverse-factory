const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 개발 모드 확인
const isDev = process.argv.includes('--dev');

function createWindow() {
  // 메인 윈도우 생성
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'), // 아이콘 파일이 있다면
    title: 'Metaverse Factory - Digital Twin',
    show: false // 로딩 완료 후 표시
  });

  // HTML 파일 로드
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 개발 모드에서 DevTools 자동 열기
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 윈도우 준비 완료 시 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      console.log('Metaverse Factory started in development mode');
    }
  });

  // 윈도우 닫기 이벤트
  mainWindow.on('closed', () => {
    // macOS에서는 앱이 완전히 종료되지 않을 수 있음
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  return mainWindow;
}

// Electron 앱 준비 완료
app.whenReady().then(() => {
  createWindow();

  // macOS에서 dock 아이콘 클릭 시 윈도우 재생성
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 모든 윈도우가 닫혔을 때
app.on('window-all-closed', () => {
  // macOS에서는 명시적으로 종료하지 않는 한 앱이 활성 상태로 유지
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 통신 핸들러들
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// MQTT 연결 상태 알림 (렌더러에서 메인으로)
ipcMain.on('mqtt-connected', (event, status) => {
  console.log('MQTT Connection Status:', status);
});

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});