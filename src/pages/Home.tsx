import React, { useState, useEffect } from "react";
import { getRunningProcesses, getTotalCpuUsage, getMemoryUsage } from "@/utils/monitoring";
import { dbService } from "@/utils/db";

interface ProcessInfo {
  pid: number;
  name: string;
  title: string;
  isForeground: boolean;
  cpuUsage: number;
  memoryUsage: number;
  startTime: number;
}

export default function Home() {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [totalCpu, setTotalCpu] = useState(0);
  const [totalMemory, setTotalMemory] = useState(0);
  const [memoryTotal, setMemoryTotal] = useState(0);

  // 获取系统数据
  useEffect(() => {
    const updateData = async () => {
      try {
        // 获取进程列表
        const processList = getRunningProcesses();
        setProcesses(processList);
        
        // 获取CPU使用率
        const cpuUsage = getTotalCpuUsage();
        setTotalCpu(cpuUsage);
        
        // 获取内存使用情况
        const memoryInfo = getMemoryUsage();
        setTotalMemory(memoryInfo.used);
        setMemoryTotal(memoryInfo.total);

        // 存储进程活动数据到数据库
        const timestamp = Date.now();
        for (const process of processList) {
          try {
            await dbService.saveProcessActivity({
              processId: process.pid,
              processName: process.name,
              isForeground: process.isForeground,
              timestamp,
              duration: 5, // 5秒间隔
              cpuUsage: process.cpuUsage,
              memoryUsage: process.memoryUsage
            });
          } catch (dbError) {
            console.error('存储进程数据失败:', dbError);
          }
        }
      } catch (error) {
        console.error('更新系统数据失败:', error);
      }
    };

    // 初始加载
    updateData();

    // 定时更新
    const interval = setInterval(updateData, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">监控面板</h1>
      
      {/* 系统概览卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-medium text-gray-500">CPU 使用率</h2>
          <div className="flex items-end space-x-4 mt-2">
            <span className="text-3xl font-bold text-blue-600">{totalCpu.toFixed(1)}%</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, totalCpu)}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-medium text-gray-500">内存使用</h2>
          <div className="flex items-end space-x-4 mt-2">
            <span className="text-3xl font-bold text-blue-600">{totalMemory.toFixed(0)} MB</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, memoryTotal > 0 ? (totalMemory / memoryTotal) * 100 : 0)}%` }}
              ></div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            总计: {memoryTotal.toFixed(0)} MB
          </div>
        </div>
      </div>
      
      {/* 应用列表卡片 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">运行中的应用</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  应用名称
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPU (%)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  内存 (MB)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processes.map((process) => (
                <tr key={process.pid} className={process.isForeground ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{process.name}</div>
                        <div className="text-xs text-gray-500">{process.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${process.isForeground ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {process.isForeground ? '前台' : '后台'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{process.cpuUsage.toFixed(1)}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-24">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, process.cpuUsage)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {process.memoryUsage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 历史趋势卡片 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">历史趋势</h2>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">资源占用趋势图表</p>
        </div>
      </div>
    </div>
  );
}