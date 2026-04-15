import React, { useState } from 'react';

export default function Settings() {
  const [monitoringFrequency, setMonitoringFrequency] = useState(5);
  const [dataStorageDays, setDataStorageDays] = useState(30);
  const [cpuThreshold, setCpuThreshold] = useState(80);
  const [memoryThreshold, setMemoryThreshold] = useState(70);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">设置</h1>
      
      {/* 监控配置卡片 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">监控配置</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              监控频率 (秒)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="30"
                value={monitoringFrequency}
                onChange={(e) => setMonitoringFrequency(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{monitoringFrequency}s</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              数据存储周期 (天)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="7"
                max="90"
                value={dataStorageDays}
                onChange={(e) => setDataStorageDays(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{dataStorageDays}天</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 资源阈值卡片 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">资源占用阈值</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPU阈值 (%)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="50"
                max="100"
                value={cpuThreshold}
                onChange={(e) => setCpuThreshold(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{cpuThreshold}%</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内存阈值 (%)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="50"
                max="100"
                value={memoryThreshold}
                onChange={(e) => setMemoryThreshold(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{memoryThreshold}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 通知设置卡片 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">通知设置</h2>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            启用异常通知
          </span>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="sr-only"
            />
            <div className={`block h-6 rounded-full ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
            </div>
            <div
              className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${notificationsEnabled ? 'transform translate-x-4' : ''}`}
            >
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}