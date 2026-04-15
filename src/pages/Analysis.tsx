import React, { useState, useEffect } from 'react';
import { analyzeAppUsage, analyzeResourceUsage, detectAnomalies, analyzeActiveHours } from "@/utils/analysis";
import { dbService } from "@/utils/db";
import { BarChart, PieChart, TimeLineChart } from "@/components/ChartComponent";

interface AppUsageStats {
  appName: string;
  totalDuration: number;
  foregroundDuration: number;
  backgroundDuration: number;
  percentage: number;
}

interface ResourceUsage {
  appName: string;
  avgCpuUsage: number;
  maxCpuUsage: number;
  avgMemoryUsage: number;
  maxMemoryUsage: number;
}

interface Anomaly {
  appName: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  timestamp: number;
  details: Record<string, unknown>;
}

interface ProcessActivity {
  id: string;
  processId: number;
  processName: string;
  isForeground: boolean;
  timestamp: number;
  duration: number;
  cpuUsage: number;
  memoryUsage: number;
}

export default function Analysis() {
  const [appUsageStats, setAppUsageStats] = useState<AppUsageStats[]>([]);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [activeHours, setActiveHours] = useState<Record<string, number>>({});
  const [processActivities, setProcessActivities] = useState<ProcessActivity[]>([]);
  const [timeRange, setTimeRange] = useState('24h'); // 24h, 7d, 30d

  useEffect(() => {
    const loadData = async () => {
      try {
        // 初始化数据库
        await dbService.initialize();
        
        const now = Date.now();
        let startTime;
        
        // 根据选择的时间范围计算开始时间
        switch (timeRange) {
          case '24h':
            startTime = now - (24 * 60 * 60 * 1000);
            break;
          case '7d':
            startTime = now - (7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startTime = now - (30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startTime = now - (24 * 60 * 60 * 1000);
        }

        // 加载应用使用统计
        const usageStats = await analyzeAppUsage(startTime, now);
        setAppUsageStats(usageStats);

        // 加载资源占用分析
        const resourceStats = await analyzeResourceUsage(startTime, now);
        setResourceUsage(resourceStats);

        // 检测异常应用
        const detectedAnomalies = await detectAnomalies();
        setAnomalies(detectedAnomalies);

        // 分析活跃时段
        const hoursData = await analyzeActiveHours(startTime, now);
        setActiveHours(hoursData);

        // 加载最近的进程活动日志
        const activities = await dbService.getProcessActivities(startTime, now);
        setProcessActivities(activities.slice(0, 2)); // 只显示最近2条
      } catch (error) {
        console.error('加载分析数据失败:', error);
      }
    };

    loadData();
  }, [timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">数据分析</h1>
        <div className="flex space-x-2">
          <button 
            className={`px-4 py-2 rounded-md ${timeRange === '24h' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setTimeRange('24h')}
          >
            24小时
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${timeRange === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setTimeRange('7d')}
          >
            7天
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${timeRange === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setTimeRange('30d')}
          >
            30天
          </button>
        </div>
      </div>
      
      {/* 使用统计卡片 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">应用使用统计</h2>
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* 饼图：应用使用占比 */}
          <div>
            <PieChart 
              title="应用使用占比" 
              data={{
                labels: appUsageStats.slice(0, 5).map(app => app.appName),
                datasets: [{
                  data: appUsageStats.slice(0, 5).map(app => app.percentage),
                  backgroundColor: [
                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
                  ]
                }]
              }}
            />
          </div>
          {/* 柱状图：应用使用时长 */}
          <div>
            <BarChart 
              title="应用使用时长 (秒)" 
              data={{
                labels: appUsageStats.slice(0, 5).map(app => app.appName),
                datasets: [
                  {
                    label: '前台时长',
                    data: appUsageStats.slice(0, 5).map(app => app.foregroundDuration),
                    backgroundColor: '#3B82F6'
                  },
                  {
                    label: '后台时长',
                    data: appUsageStats.slice(0, 5).map(app => app.backgroundDuration),
                    backgroundColor: '#93C5FD'
                  }
                ]
              }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  应用名称
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  总使用时长 (秒)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  前台时长 (秒)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  后台时长 (秒)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  占比 (%)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appUsageStats.map((app, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{app.appName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.totalDuration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.foregroundDuration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.backgroundDuration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{app.percentage.toFixed(1)}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-24">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${app.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 资源分析卡片 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">资源占用分析</h2>
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* 柱状图：CPU占用 */}
          <div>
            <BarChart 
              title="CPU占用 (%)" 
              data={{
                labels: resourceUsage.slice(0, 5).map(app => app.appName),
                datasets: [
                  {
                    label: '平均CPU',
                    data: resourceUsage.slice(0, 5).map(app => app.avgCpuUsage),
                    backgroundColor: '#3B82F6'
                  },
                  {
                    label: '最大CPU',
                    data: resourceUsage.slice(0, 5).map(app => app.maxCpuUsage),
                    backgroundColor: '#1D4ED8'
                  }
                ]
              }}
            />
          </div>
          {/* 柱状图：内存占用 */}
          <div>
            <BarChart 
              title="内存占用 (MB)" 
              data={{
                labels: resourceUsage.slice(0, 5).map(app => app.appName),
                datasets: [
                  {
                    label: '平均内存',
                    data: resourceUsage.slice(0, 5).map(app => app.avgMemoryUsage),
                    backgroundColor: '#10B981'
                  },
                  {
                    label: '最大内存',
                    data: resourceUsage.slice(0, 5).map(app => app.maxMemoryUsage),
                    backgroundColor: '#059669'
                  }
                ]
              }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  应用名称
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均CPU (%)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最大CPU (%)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均内存 (MB)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最大内存 (MB)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resourceUsage.map((app, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{app.appName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.avgCpuUsage.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.maxCpuUsage.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.avgMemoryUsage.toFixed(0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.maxMemoryUsage.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 时间轴统计卡片 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">时间轴统计</h2>
        <TimeLineChart 
          title="应用使用时长趋势" 
          data={{
            labels: Object.keys(activeHours).sort(),
            datasets: [
              {
                label: '前台应用',
                data: Object.keys(activeHours).sort().map(hour => activeHours[hour] || 0),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              },
              {
                label: '后台应用',
                data: Object.keys(activeHours).sort().map(hour => (activeHours[hour] || 0) * 0.5), // 模拟后台时长
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
              }
            ]
          }}
        />
      </div>
      
      {/* 异常检测卡片 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">异常应用检测</h2>
        <div className="space-y-4">
          {anomalies.length > 0 ? (
            anomalies.map((anomaly, index) => (
              <div 
                key={index} 
                className={`p-4 border-l-4 ${anomaly.severity === 'high' ? 'border-red-500 bg-red-50' : anomaly.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'} rounded`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{anomaly.appName}</h3>
                  <span className={`px-2 py-1 ${anomaly.severity === 'high' ? 'bg-red-100 text-red-800' : anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'} rounded-full text-xs`}>
                    {anomaly.severity === 'high' ? '高' : anomaly.severity === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{anomaly.reason}</p>
                <div className="text-xs text-gray-500 mt-2">
                  {Object.entries(anomaly.details).map(([key, value], idx) => (
                    <span key={idx} className="mr-4">
                      {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">未检测到异常应用</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 最近2条日志 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">最近2条日志</h2>
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
                  时间
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  持续时间 (秒)
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
              {processActivities.length > 0 ? (
                processActivities.map((activity, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{activity.processName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 ${activity.isForeground ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} rounded-full text-xs`}>
                        {activity.isForeground ? '前台' : '后台'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.cpuUsage.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.memoryUsage.toFixed(0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    无日志记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}