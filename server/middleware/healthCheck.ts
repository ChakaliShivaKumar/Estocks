import type { Request, Response } from "express";
import { db } from "../storage";
import { sql } from "drizzle-orm";
import { sendSuccess } from "./errorHandler";

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
      error?: string;
    };
  };
  version?: string;
}

export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();
  const health: HealthCheckResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: "unhealthy",
      },
    },
  };

  // Check database connection
  try {
    const dbStartTime = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbResponseTime = Date.now() - dbStartTime;
    
    health.services.database = {
      status: "healthy",
      responseTime: dbResponseTime,
    };
  } catch (error) {
    health.status = "unhealthy";
    health.services.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  const statusCode = health.status === "healthy" ? 200 : 503;
  return sendSuccess(res, health, statusCode);
}

export async function readinessCheck(req: Request, res: Response) {
  // Check if all critical services are ready
  try {
    await db.execute(sql`SELECT 1`);
    return sendSuccess(res, { ready: true }, 200);
  } catch (error) {
    return res.status(503).json({
      success: false,
      ready: false,
      error: "Service not ready",
    });
  }
}

export async function livenessCheck(req: Request, res: Response) {
  // Simple check to see if the process is alive
  return sendSuccess(res, { alive: true }, 200);
}

