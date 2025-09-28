import { Request, Response, NextFunction } from 'express'

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    }

    console.log(JSON.stringify(log))
  })

  next()
}