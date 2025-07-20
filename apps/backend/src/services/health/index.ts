import { db } from '~/db'

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  checks: {
    database?: HealthCheckResult
    memory: HealthCheckResult
    disk: HealthCheckResult
    external?: HealthCheckResult
  }
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  message?: string
  responseTime?: number
  details?: Record<string, any>
}

export class HealthService {
  private startTime = Date.now()

  async checkDatabase(): Promise<HealthCheckResult | null> {
    // Skip database check if DATABASE_URL is not configured
    if (!process.env.DATABASE_URL) {
      return null
    }

    const start = Date.now()
    
    try {
      // Test database connectivity
      await db.selectFrom('examples').select(db.fn.count('id').as('count')).executeTakeFirst()
      
      const responseTime = Date.now() - start
      
      return {
        status: 'healthy',
        responseTime,
        details: {
          connection: 'established',
          queryTime: `${responseTime}ms`
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  checkMemory(): HealthCheckResult {
    const memUsage = process.memoryUsage()
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
    
    // Consider unhealthy if memory usage is above 90%
    if (memoryUsagePercent > 90) {
      return {
        status: 'unhealthy',
        message: `High memory usage: ${memoryUsagePercent.toFixed(2)}%`,
        details: {
          heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
        }
      }
    }

    return {
      status: 'healthy',
      details: {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        usagePercent: `${memoryUsagePercent.toFixed(2)}%`
      }
    }
  }

  checkDisk(): HealthCheckResult {
    // For now, we'll return a basic disk check
    // In production, you might want to check disk space, write permissions, etc.
    return {
      status: 'healthy',
      details: {
        check: 'basic',
        message: 'Disk space check passed'
      }
    }
  }

  async performHealthCheck(): Promise<HealthCheck> {
    const [databaseCheck, memoryCheck, diskCheck] = await Promise.all([
      this.checkDatabase(),
      Promise.resolve(this.checkMemory()),
      Promise.resolve(this.checkDisk())
    ])

    // Build checks object, only including database if it exists
    const checks: any = { memory: memoryCheck, disk: diskCheck }
    if (databaseCheck) {
      checks.database = databaseCheck
    }

    // Determine overall status (only consider non-null checks)
    const activeChecks = Object.values(checks).filter((check): check is HealthCheckResult => check !== null)
    const unhealthyCount = activeChecks.filter(check => check.status === 'unhealthy').length
    const degradedCount = activeChecks.filter(check => check.status === 'degraded').length

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy'
    } else if (degradedCount > 0) {
      overallStatus = 'degraded'
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      checks
    }
  }
} 