import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Home from "@/pages/Home";
import Analysis from "@/pages/Analysis";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {/* 侧边导航 */}
        <div className="w-64 bg-blue-900 text-white p-4">
          <h1 className="text-2xl font-bold mb-8 text-center">盒打击</h1>
          <nav>
            <ul className="space-y-4">
              <li>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    isActive ? 'bg-blue-700 p-3 rounded-lg block' : 'p-3 rounded-lg block hover:bg-blue-800'
                  }
                >
                  监控面板
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/analysis" 
                  className={({ isActive }) => 
                    isActive ? 'bg-blue-700 p-3 rounded-lg block' : 'p-3 rounded-lg block hover:bg-blue-800'
                  }
                >
                  数据分析
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/settings" 
                  className={({ isActive }) => 
                    isActive ? 'bg-blue-700 p-3 rounded-lg block' : 'p-3 rounded-lg block hover:bg-blue-800'
                  }
                >
                  设置
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* 主内容区域 */}
        <div className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
