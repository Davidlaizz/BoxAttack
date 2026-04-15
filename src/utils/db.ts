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

interface AppStats {
  id: string;
  appName: string;
  totalDuration: number;
  foregroundDuration: number;
  backgroundDuration: number;
  lastUpdated: number;
}

interface Anomaly {
  id: string;
  appName: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  timestamp: number;
  details: string;
}

// 模拟数据存储
class MockDatabase {
  private processActivities: ProcessActivity[] = [];
  private appStats: AppStats[] = [];
  private anomalies: Anomaly[] = [];

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 存储进程活动数据
   */
  async saveProcessActivity(activity: Omit<ProcessActivity, 'id'>): Promise<string> {
    const id = this.generateId();
    const newActivity: ProcessActivity = {
      id,
      ...activity
    };
    this.processActivities.push(newActivity);
    
    // 更新应用统计数据
    await this.updateAppStats(activity);

    return id;
  }

  /**
   * 更新应用统计数据
   */
  private async updateAppStats(activity: Omit<ProcessActivity, 'id'>) {
    const existing = this.appStats.find(stat => stat.appName === activity.processName);

    if (existing) {
      // 更新现有记录
      existing.totalDuration += activity.duration;
      if (activity.isForeground) {
        existing.foregroundDuration += activity.duration;
      } else {
        existing.backgroundDuration += activity.duration;
      }
      existing.lastUpdated = Date.now();
    } else {
      // 创建新记录
      this.appStats.push({
        id: this.generateId(),
        appName: activity.processName,
        totalDuration: activity.duration,
        foregroundDuration: activity.isForeground ? activity.duration : 0,
        backgroundDuration: activity.isForeground ? 0 : activity.duration,
        lastUpdated: Date.now()
      });
    }
  }

  /**
   * 查询历史活动数据
   */
  async getProcessActivities(startTime: number, endTime: number): Promise<ProcessActivity[]> {
    return this.processActivities
      .filter(activity => activity.timestamp >= startTime && activity.timestamp <= endTime)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 查询应用使用统计
   */
  async getAppUsageStats(startTime: number, endTime: number): Promise<{
    appName: string;
    totalDuration: number;
    foregroundDuration: number;
    backgroundDuration: number;
  }[]> {
    // 从进程活动表中计算统计数据
    const activities = this.processActivities.filter(
      activity => activity.timestamp >= startTime && activity.timestamp <= endTime
    );

    const statsMap = new Map<string, {
      appName: string;
      totalDuration: number;
      foregroundDuration: number;
      backgroundDuration: number;
    }>();

    for (const activity of activities) {
      if (!statsMap.has(activity.processName)) {
        statsMap.set(activity.processName, {
          appName: activity.processName,
          totalDuration: 0,
          foregroundDuration: 0,
          backgroundDuration: 0
        });
      }

      const stat = statsMap.get(activity.processName)!;
      stat.totalDuration += activity.duration;
      if (activity.isForeground) {
        stat.foregroundDuration += activity.duration;
      } else {
        stat.backgroundDuration += activity.duration;
      }
    }

    return Array.from(statsMap.values())
      .sort((a, b) => b.totalDuration - a.totalDuration);
  }

  /**
   * 存储异常记录
   */
  async saveAnomaly(anomaly: Omit<Anomaly, 'id'>): Promise<string> {
    const id = this.generateId();
    const newAnomaly: Anomaly = {
      id,
      ...anomaly
    };
    this.anomalies.push(newAnomaly);
    return id;
  }

  /**
   * 查询异常记录
   */
  async getAnomalies(startTime: number, endTime: number): Promise<Anomaly[]> {
    return this.anomalies
      .filter(anomaly => anomaly.timestamp >= startTime && anomaly.timestamp <= endTime)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 清理旧数据
   */
  async cleanupOldData(days: number = 30) {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    this.processActivities = this.processActivities.filter(activity => activity.timestamp >= cutoffTime);
    this.anomalies = this.anomalies.filter(anomaly => anomaly.timestamp >= cutoffTime);
    console.log(`清理了${days}天前的旧数据`);
  }

  /**
   * 关闭数据库连接
   */
  async close() {
    // 模拟关闭操作
  }
}

class DatabaseService {
  private db: any = null;
  private isMock = false;

  /**
   * 初始化数据库连接
   */
  async initialize() {
    try {
      // 检查是否在浏览器环境中
      if (typeof window !== 'undefined') {
        // 使用模拟数据库
        this.db = new MockDatabase();
        this.isMock = true;
        console.log('使用模拟数据库初始化成功');
      } else {
        // 在Node.js或Electron环境中使用SQLite
        const path = require('path');
        const sqlite3 = require('sqlite3');
        const { open } = require('sqlite');
        
        // 确定数据库文件路径
        let dbPath;
        if (process.env.NODE_ENV === 'development') {
          // 开发环境
          dbPath = './box-monitor.db';
        } else {
          // 生产环境，使用应用数据目录
          const appDataPath = process.env.APPDATA || path.join(process.env.HOME, 'AppData', 'Roaming');
          dbPath = path.join(appDataPath, 'BoxMonitor', 'box-monitor.db');
          
          // 确保目录存在
          const fs = require('fs');
          const dbDir = path.dirname(dbPath);
          if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
          }
        }
        
        this.db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });

        await this.createTables();
        console.log('SQLite数据库初始化成功:', dbPath);
      }
    } catch (error) {
      console.error('数据库初始化失败:', error);
      // 失败时使用模拟数据库
      this.db = new MockDatabase();
      this.isMock = true;
      console.log('使用模拟数据库作为 fallback');
    }
  }

  /**
   * 创建数据库表结构
   */
  private async createTables() {
    if (!this.db || this.isMock) return;

    // 创建进程活动表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS process_activity (
        id TEXT PRIMARY KEY,
        process_id INTEGER,
        process_name TEXT,
        is_foreground BOOLEAN,
        timestamp INTEGER,
        duration INTEGER,
        cpu_usage REAL,
        memory_usage REAL
      );

      CREATE INDEX IF NOT EXISTS idx_process_activity_timestamp ON process_activity(timestamp);
      CREATE INDEX IF NOT EXISTS idx_process_activity_name ON process_activity(process_name);
    `);

    // 创建应用统计数据表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_stats (
        id TEXT PRIMARY KEY,
        app_name TEXT UNIQUE,
        total_duration INTEGER DEFAULT 0,
        foreground_duration INTEGER DEFAULT 0,
        background_duration INTEGER DEFAULT 0,
        last_updated INTEGER
      );
    `);

    // 创建异常记录表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS anomalies (
        id TEXT PRIMARY KEY,
        app_name TEXT,
        severity TEXT,
        reason TEXT,
        timestamp INTEGER,
        details TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON anomalies(timestamp);
    `);
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 存储进程活动数据
   */
  async saveProcessActivity(activity: Omit<ProcessActivity, 'id'>): Promise<string> {
    if (!this.db) throw new Error('数据库未初始化');

    if (this.isMock) {
      return this.db.saveProcessActivity(activity);
    }

    const id = this.generateId();
    await this.db.run(
      `INSERT INTO process_activity (id, process_id, process_name, is_foreground, timestamp, duration, cpu_usage, memory_usage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, activity.processId, activity.processName, activity.isForeground, activity.timestamp, activity.duration, activity.cpuUsage, activity.memoryUsage]
    );

    // 更新应用统计数据
    await this.updateAppStats(activity);

    return id;
  }

  /**
   * 更新应用统计数据
   */
  private async updateAppStats(activity: Omit<ProcessActivity, 'id'>) {
    if (!this.db) throw new Error('数据库未初始化');

    if (this.isMock) {
      return this.db.updateAppStats(activity);
    }

    // 检查应用是否已存在
    const existing = await this.db.get(
      'SELECT * FROM app_stats WHERE app_name = ?',
      [activity.processName]
    );

    if (existing) {
      // 更新现有记录
      await this.db.run(
        `UPDATE app_stats SET 
         total_duration = total_duration + ?, 
         ${activity.isForeground ? 'foreground_duration = foreground_duration + ?' : 'background_duration = background_duration + ?'},
         last_updated = ?
         WHERE app_name = ?`,
        [activity.duration, activity.duration, Date.now(), activity.processName]
      );
    } else {
      // 创建新记录
      await this.db.run(
        `INSERT INTO app_stats (id, app_name, total_duration, foreground_duration, background_duration, last_updated)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          this.generateId(),
          activity.processName,
          activity.duration,
          activity.isForeground ? activity.duration : 0,
          activity.isForeground ? 0 : activity.duration,
          Date.now()
        ]
      );
    }
  }

  /**
   * 查询历史活动数据
   */
  async getProcessActivities(startTime: number, endTime: number): Promise<ProcessActivity[]> {
    if (!this.db) throw new Error('数据库未初始化');

    if (this.isMock) {
      return this.db.getProcessActivities(startTime, endTime);
    }

    const rows = await this.db.all(
      'SELECT * FROM process_activity WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
      [startTime, endTime]
    );

    return rows.map(row => ({
      id: row.id,
      processId: row.process_id,
      processName: row.process_name,
      isForeground: row.is_foreground,
      timestamp: row.timestamp,
      duration: row.duration,
      cpuUsage: row.cpu_usage,
      memoryUsage: row.memory_usage
    }));
  }

  /**
   * 查询应用使用统计
   */
  async getAppUsageStats(startTime: number, endTime: number): Promise<{
    appName: string;
    totalDuration: number;
    foregroundDuration: number;
    backgroundDuration: number;
  }[]> {
    if (!this.db) throw new Error('数据库未初始化');

    if (this.isMock) {
      return this.db.getAppUsageStats(startTime, endTime);
    }

    // 从进程活动表中计算统计数据
    const rows = await this.db.all(`
      SELECT 
        process_name as appName,
        SUM(duration) as totalDuration,
        SUM(CASE WHEN is_foreground = 1 THEN duration ELSE 0 END) as foregroundDuration,
        SUM(CASE WHEN is_foreground = 0 THEN duration ELSE 0 END) as backgroundDuration
      FROM process_activity
      WHERE timestamp BETWEEN ? AND ?
      GROUP BY process_name
      ORDER BY totalDuration DESC
    `, [startTime, endTime]);

    return rows;
  }

  /**
   * 存储异常记录
   */
  async saveAnomaly(anomaly: Omit<Anomaly, 'id'>): Promise<string> {
    if (!this.db) throw new Error('数据库未初始化');

    if (this.isMock) {
      return this.db.saveAnomaly(anomaly);
    }

    const id = this.generateId();
    await this.db.run(
      `INSERT INTO anomalies (id, app_name, severity, reason, timestamp, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, anomaly.appName, anomaly.severity, anomaly.reason, anomaly.timestamp, anomaly.details]
    );

    return id;
  }

  /**
   * 查询异常记录
   */
  async getAnomalies(startTime: number, endTime: number): Promise<Anomaly[]> {
    if (!this.db) throw new Error('数据库未初始化');

    if (this.isMock) {
      return this.db.getAnomalies(startTime, endTime);
    }

    const rows = await this.db.all(
      'SELECT * FROM anomalies WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
      [startTime, endTime]
    );

    return rows.map(row => ({
      id: row.id,
      appName: row.app_name,
      severity: row.severity as 'low' | 'medium' | 'high',
      reason: row.reason,
      timestamp: row.timestamp,
      details: row.details
    }));
  }

  /**
   * 清理旧数据
   */
  async cleanupOldData(days: number = 30) {
    if (!this.db) throw new Error('数据库未初始化');

    if (this.isMock) {
      return this.db.cleanupOldData(days);
    }

    try {
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

      await this.db.run('DELETE FROM process_activity WHERE timestamp < ?', [cutoffTime]);
      await this.db.run('DELETE FROM anomalies WHERE timestamp < ?', [cutoffTime]);

      console.log(`清理了${days}天前的旧数据`);
    } catch (error) {
      console.error('清理旧数据失败:', error);
      throw error;
    }
  }

  /**
   * 备份数据库
   */
  async backupDatabase() {
    if (!this.db || this.isMock) {
      console.warn('数据库未初始化或使用模拟数据库，跳过备份');
      return;
    }

    try {
      const path = require('path');
      const fs = require('fs');
      
      // 确定备份文件路径
      let dbPath;
      if (process.env.NODE_ENV === 'development') {
        dbPath = './box-monitor.db';
      } else {
        const appDataPath = process.env.APPDATA || path.join(process.env.HOME, 'AppData', 'Roaming');
        dbPath = path.join(appDataPath, 'BoxMonitor', 'box-monitor.db');
      }
      
      const backupPath = dbPath + '.backup.' + Date.now();
      
      // 复制数据库文件
      fs.copyFileSync(dbPath, backupPath);
      console.log(`数据库备份成功: ${backupPath}`);
    } catch (error) {
      console.error('备份数据库失败:', error);
    }
  }

  /**
   * 恢复数据库
   */
  async restoreDatabase(backupPath: string) {
    if (!this.db || this.isMock) {
      console.warn('数据库未初始化或使用模拟数据库，跳过恢复');
      return;
    }

    try {
      const path = require('path');
      const fs = require('fs');
      
      // 确定目标数据库路径
      let dbPath;
      if (process.env.NODE_ENV === 'development') {
        dbPath = './box-monitor.db';
      } else {
        const appDataPath = process.env.APPDATA || path.join(process.env.HOME, 'AppData', 'Roaming');
        dbPath = path.join(appDataPath, 'BoxMonitor', 'box-monitor.db');
      }
      
      // 复制备份文件到目标位置
      fs.copyFileSync(backupPath, dbPath);
      console.log(`数据库恢复成功: ${backupPath}`);
      
      // 重新初始化数据库连接
      await this.initialize();
    } catch (error) {
      console.error('恢复数据库失败:', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

// 导出单例实例
export const dbService = new DatabaseService();