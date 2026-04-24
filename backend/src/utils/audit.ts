import { Request } from 'express';
import prisma from '../db/index.js';
import logger from './logger.js';

export interface AuditLogData {
  userId?: string;
  userEmail?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Logs an administrative action to the audit_logs table
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
    logger.info(`Audit Log: ${data.action} by ${data.userEmail || 'unknown'}`);
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // We don't want to fail the main action if logging fails, but we should know about it
  }
}

/**
 * Helper to log an audit entry from an Express request
 */
export async function logRequestAudit(
  req: Request,
  action: string,
  entity?: string,
  entityId?: string,
  details?: any
): Promise<void> {
  const user = req.user;
  
  return logAudit({
    userId: user?.id,
    userEmail: user?.email,
    action,
    entity,
    entityId,
    details,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });
}
