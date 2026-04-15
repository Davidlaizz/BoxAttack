# 盒打击 - Windows 11 应用监控工具

盒打击是一款用于监控 Windows 11 系统应用使用状况的工具，可以实时统计和分析应用使用情况，帮助用户了解系统资源占用情况。

## 功能特性

1. **监控面板**：实时显示运行中的应用，区分前台和后台应用，展示 CPU 和内存占用情况
2. **数据分析**：提供应用使用时长统计、资源占用分析和异常应用检测
3. **设置页面**：允许用户配置监控频率、数据存储周期和资源占用阈值
4. **数据可视化**：使用图表直观展示应用使用情况和资源占用
5. **跨环境支持**：在 Node.js 环境中使用真实 Windows 系统信息，在浏览器环境中使用模拟数据

## 技术栈

- **前端**：React 18 + TypeScript + Tailwind CSS
- **数据可视化**：Chart.js + react-chartjs-2
- **数据存储**：SQLite3（Node.js 环境）/ 内存存储（浏览器环境）
- **系统监控**：Node.js child_process 模块（Windows 系统命令）

## 本地使用指南

### 1. 获取项目代码

你现在可以直接使用当前目录下的代码，或者将其复制到你的本地计算机上。

### 2. 安装 Node.js

确保你的计算机已安装 Node.js（建议使用 16.x 或更高版本）。你可以从 [Node.js 官网](https://nodejs.org/) 下载安装。

### 3. 安装依赖

在项目根目录下打开终端，运行以下命令安装项目依赖：

```bash
npm install
```

### 4. 启动开发服务器

运行以下命令启动开发服务器：

```bash
npm run dev
```

服务器启动后，在浏览器中访问显示的地址（通常是 `http://localhost:5173`）即可查看应用。

### 5. 构建生产版本

如果你想构建生产版本的应用，可以运行：

```bash
npm run build
```

构建后的文件将保存在 `dist` 目录中。

### 6. 预览生产构建

构建完成后，你可以预览生产构建的效果：

```bash
npm run preview
```

## 项目结构

```
/workspace/
├── public/              # 静态资源
├── src/
│   ├── components/      # React 组件
│   ├── hooks/          # 自定义 Hooks
│   ├── lib/            # 工具函数
│   ├── pages/          # 页面组件
│   │   ├── Home.tsx    # 监控面板
│   │   ├── Analysis.tsx # 数据分析
│   │   └── Settings.tsx # 设置页面
│   ├── utils/          # 工具模块
│   │   ├── monitoring.ts # 系统监控
│   │   ├── db.ts       # 数据存储
│   │   └── analysis.ts # 数据分析
│   ├── App.tsx         # 主应用组件
│   └── main.tsx        # 应用入口
├── .trae/documents/     # 项目文档
│   ├── 盒打击PRD.md
│   └── 盒打击技术架构文档.md
└── package.json         # 项目配置
```

## 主要页面说明

### 监控面板 ([Home.tsx](file:///workspace/src/pages/Home.tsx))
- 实时显示系统 CPU 和内存使用情况
- 列出当前运行的所有应用
- 区分前台和后台应用
- 显示每个应用的 CPU 和内存占用

### 数据分析 ([Analysis.tsx](file:///workspace/src/pages/Analysis.tsx))
- 应用使用时长统计
- 资源占用分析
- 异常应用检测
- 数据可视化图表

### 设置页面 ([Settings.tsx](file:///workspace/src/pages/Settings.tsx))
- 监控频率配置
- 数据存储周期设置
- 资源占用阈值设置
- 通知设置

## 注意事项

1. **Windows 系统监控**：真实的系统监控功能需要在 Node.js 环境中运行，并使用 Electron 等桌面应用框架包装才能直接访问 Windows API。
2. **浏览器环境**：在浏览器中运行时，会使用模拟数据展示功能。
3. **数据持久化**：在浏览器环境中，数据存储在内存中，刷新页面后会丢失。

## 后续开发计划

- [ ] 集成 Electron 框架，实现完整的桌面应用
- [ ] 实现系统托盘功能
- [ ] 添加数据导出功能
- [ ] 实现更精确的进程监控
- [ ] 添加更多的分析图表

## 许可证

本项目仅供学习和研究使用。
