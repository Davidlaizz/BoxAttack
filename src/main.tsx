import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { dbService } from './utils/db'

// 初始化数据库
async function initializeApp() {
  try {
    await dbService.initialize();
    console.log('应用初始化成功');
  } catch (error) {
    console.error('应用初始化失败:', error);
  }

  // 渲染应用
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

initializeApp();
