import { Router, type IRouter, type Request, type Response } from "express";
import { scaleService, type ScaleState } from "../lib/scaleService";
import { exec } from "child_process";

const router: IRouter = Router();

// GET /api/scale/stream - Server-Sent Events stream of scale data
router.get("/scale/stream", (req: Request, res: Response): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.status(200);

  const sendEvent = (data: ScaleState) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (_err) {
      scaleService.removeClient(sendEvent);
    }
  };

  scaleService.addClient(sendEvent);

  req.on("close", () => {
    scaleService.removeClient(sendEvent);
  });
});

// GET /api/scale/status - Get current scale status
router.get("/scale/status", (_req: Request, res: Response): void => {
  res.json({
    success: true,
    state: scaleService.getState(),
  });
});

// GET or POST /api/scale/test - Trigger simulated scale reading for live testing
router.all("/scale/test", (req: Request, res: Response): void => {
  const rawWeight = req.query["weight"] || (req.body && req.body["weight"]) || "34500";
  const weightKg = Number(rawWeight) || 34500;

  scaleService.pushTestReading(weightKg);

  res.json({
    success: true,
    message: `Pushed live scale test reading: ${weightKg} KG (${(weightKg / 1000).toFixed(3)} Tons)`,
    state: scaleService.getState(),
  });
});

// POST /api/scale/config - Update scale COM port settings
router.post("/scale/config", (req: Request, res: Response): void => {
  const body = req.body || {};
  const { comPort, baudRate, dataBits, parity, stopBits, enabled } = body;

  const updatePayload: Record<string, any> = {};
  if (comPort !== undefined) updatePayload.comPort = String(comPort).toUpperCase();
  if (baudRate !== undefined) updatePayload.baudRate = Number(baudRate);
  if (dataBits !== undefined) updatePayload.dataBits = Number(dataBits);
  if (parity !== undefined) updatePayload.parity = parity;
  if (stopBits !== undefined) updatePayload.stopBits = Number(stopBits);
  if (enabled !== undefined) updatePayload.enabled = Boolean(enabled);

  scaleService.updateConfig(updatePayload);

  res.json({
    success: true,
    message: "Scale configuration updated successfully",
    config: scaleService.getConfig(),
  });
});

// GET /api/scale/ports - List available system COM ports
router.get("/scale/ports", (_req: Request, res: Response): void => {
  exec(
    `powershell -NoProfile -Command "[System.IO.Ports.SerialPort]::GetPortNames()"`,
    (error, stdout) => {
      let ports: string[] = [];
      if (!error && stdout) {
        ports = stdout
          .split(/\r?\n/)
          .map((p) => p.trim())
          .filter(Boolean);
      }
      if (ports.length === 0) {
        ports = ["COM1", "COM2", "COM3", "COM4", "COM5"];
      }
      res.json({
        success: true,
        ports: Array.from(new Set(ports)),
      });
    }
  );
});

export default router;
