import { Request, Response, NextFunction } from 'express';
import { logRequestAudit } from '../utils/audit.js';

/**
 * Middleware to audit log an action
 * @param action The action name to log
 * @param entity The entity being acted upon
 */
export const auditAction = (action: string, entity?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // We want to log AFTER the response is sent to know if it was successful
    const originalSend = res.send;
    
    res.send = function (body) {
      // Only log successful actions (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Try to extract entityId from params or body if not provided
        const entityId = req.params.id || req.body.id || (typeof body === 'string' ? JSON.parse(body).id : (body as any)?.id);
        
        logRequestAudit(req, action, entity, entityId, {
          method: req.method,
          path: req.path,
          query: req.query,
          // Avoid logging sensitive body data if needed, but for audit we usually want some details
          body: action.includes('LOGIN') ? { email: req.body.email } : req.body,
        }).catch(err => console.error('Audit middleware error:', err));
      }
      
      return originalSend.apply(res, arguments as any);
    };

    next();
  };
};
