import { Request, Response } from "express";
import {
  getIngestionWorkerHealth,
  runDueSourceIngestions,
  runSourceIngestion,
} from "../workers/ingestionWorker";

export const ingestionController = {
  health(req: Request, res: Response) {
    res.json({
      ok: true,
      worker: getIngestionWorkerHealth(),
    });
  },

  async runDue(req: Request, res: Response) {
    try {
      const result = await runDueSourceIngestions();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: error instanceof Error ? error.message : "failed to run due ingestions",
      });
    }
  },

  async runBySource(req: Request, res: Response) {
    try {
      const sourceKeyParam = req.params.sourceKey;
      const sourceKey = Array.isArray(sourceKeyParam) ? sourceKeyParam[0] : sourceKeyParam;

      if (!sourceKey) {
        res.status(400).json({
          ok: false,
          message: "sourceKey is required",
        });
        return;
      }

      const result = await runSourceIngestion(sourceKey);

      const statusCode = result.status === "failed" ? 500 : 200;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: error instanceof Error ? error.message : "failed to run source ingestion",
      });
    }
  },
};
