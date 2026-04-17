import { timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";

function sendUnauthorized(res: Response): void {
  res.status(401).json({
    ok: false,
    message: "missing or invalid ingestion token",
  });
}

function safeTokenMatch(receivedToken: string, configuredToken: string): boolean {
  const receivedBuffer = Buffer.from(receivedToken);
  const configuredBuffer = Buffer.from(configuredToken);

  if (receivedBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, configuredBuffer);
}

export function requireIngestionAuth(req: Request, res: Response, next: NextFunction): void {
  const configuredToken = process.env.INGESTION_API_TOKEN?.trim();

  if (!configuredToken) {
    res.status(503).json({
      ok: false,
      message: "INGESTION_API_TOKEN is not configured",
    });
    return;
  }

  const authorizationHeader = req.header("authorization");
  if (!authorizationHeader?.startsWith("Bearer ")) {
    sendUnauthorized(res);
    return;
  }

  const receivedToken = authorizationHeader.slice("Bearer ".length).trim();
  if (!receivedToken || !safeTokenMatch(receivedToken, configuredToken)) {
    sendUnauthorized(res);
    return;
  }

  next();
}
