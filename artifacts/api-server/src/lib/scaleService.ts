import { logger } from "./logger";
import { spawn, type ChildProcess } from "child_process";
import EventEmitter from "events";

export interface ScaleConfig {
  comPort: string;
  baudRate: number;
  dataBits: number;
  parity: "none" | "even" | "odd" | "mark" | "space";
  stopBits: number;
  enabled: boolean;
}

export interface ScaleState {
  liveWeight: number; // In Kg
  liveWeightTons: string; // In Tons formatted (e.g. "34.500")
  isStable: boolean;
  isConnected: boolean;
  rawHex: string;
  rawAscii: string;
  lastUpdated: number;
  config: ScaleConfig;
}

class ScaleService extends EventEmitter {
  private config: ScaleConfig = {
    comPort: process.env.SCALE_COM_PORT || "COM1",
    baudRate: parseInt(process.env.SCALE_BAUD_RATE || "2400", 10),
    dataBits: 8,
    parity: "none",
    stopBits: 1,
    enabled: true,
  };

  private state: ScaleState = {
    liveWeight: 0,
    liveWeightTons: "0.000",
    isStable: false,
    isConnected: false,
    rawHex: "",
    rawAscii: "",
    lastUpdated: Date.now(),
    config: { ...this.config },
  };

  private process: ChildProcess | null = null;
  private sseClients: Set<(data: ScaleState) => void> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private rawBytesBuffer: number[] = [];

  constructor() {
    super();
  }

  public init() {
    logger.info({ config: this.config }, "Initializing Background Weighbridge Scale Service");
    this.connect();
  }

  public getConfig(): ScaleConfig {
    return { ...this.config };
  }

  public getState(): ScaleState {
    return { ...this.state };
  }

  public updateConfig(newConfig: Partial<ScaleConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.state.config = { ...this.config };
    logger.info({ newConfig: this.config }, "Updating Scale COM Port Configuration");
    this.reconnect();
  }

  public addClient(callback: (data: ScaleState) => void) {
    this.sseClients.add(callback);
    // Send immediate initial state
    callback(this.getState());
  }

  public removeClient(callback: (data: ScaleState) => void) {
    this.sseClients.delete(callback);
  }

  public pushTestReading(weightKg: number) {
    const tons = (weightKg / 1000).toFixed(3);
    this.updateState({
      liveWeight: weightKg,
      liveWeightTons: tons,
      isStable: weightKg > 0,
      isConnected: true,
      rawHex: "02 33 34 35 30 30 0D 0A",
      rawAscii: `TEST STREAM: ${weightKg} KG (${tons} Tons)`,
    });
  }

  private broadcast() {
    const currentState = this.getState();
    for (const client of this.sseClients) {
      try {
        client(currentState);
      } catch (err) {
        logger.error({ err }, "Error broadcasting scale state to SSE client");
      }
    }
  }

  public connect() {
    this.stopProcess();

    if (!this.config.enabled) {
      this.updateState({ isConnected: false, rawAscii: "Scale connection disabled" });
      return;
    }

    const portName = this.config.comPort;
    const baudRate = this.config.baudRate;
    const parity = this.config.parity;
    const dataBits = this.config.dataBits;

    logger.info({ portName, baudRate }, `Attempting connection to weighbridge COM port ${portName}...`);

    // PowerShell script to read raw bytes from COM Port continuously
    const psScript = `
      $portName = "${portName}"
      $baudRate = ${baudRate}
      $parity = [System.IO.Ports.Parity]::${parity.charAt(0).toUpperCase() + parity.slice(1)}
      $dataBits = ${dataBits}
      $stopBits = [System.IO.Ports.StopBits]::One

      try {
        $port = New-Object System.IO.Ports.SerialPort $portName, $baudRate, $parity, $dataBits, $stopBits
        $port.ReadTimeout = 1000
        $port.Open()
        [Console]::WriteLine("CONNECTED")
        
        $buffer = New-Object byte[] 1024
        while ($port.IsOpen) {
          try {
            $bytesRead = $port.Read($buffer, 0, $buffer.Length)
            if ($bytesRead -gt 0) {
              $hexStr = [System.BitConverter]::ToString($buffer, 0, $bytesRead).Replace("-", " ")
              [Console]::WriteLine("DATA:" + $hexStr)
            }
          } catch [TimeoutException] {
            # Continue reading on timeout
          }
        }
      } catch {
        [Console]::WriteLine("ERROR:" + $_.Exception.Message)
        exit 1
      } finally {
        if ($port -and $port.IsOpen) { $port.Close() }
      }
    `;

    try {
      this.process = spawn("powershell", ["-NoProfile", "-NonInteractive", "-Command", psScript], {
        windowsHide: true,
      });

      this.process.stdout?.on("data", (data: Buffer) => {
        const text = data.toString("utf8");
        const lines = text.split(/\r?\n/);

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed === "CONNECTED") {
            logger.info(`Scale connected successfully to ${portName}`);
            this.updateState({ isConnected: true, rawAscii: `Connected to ${portName}` });
          } else if (trimmed.startsWith("DATA:")) {
            const hexPart = trimmed.substring(5).trim();
            this.handleRawHexData(hexPart);
          } else if (trimmed.startsWith("ERROR:")) {
            logger.warn(`Scale COM Port notice: ${trimmed}`);
            if (trimmed.includes("does not exist")) {
              this.updateState({ isConnected: false, rawAscii: `Port ${portName} not found` });
            } else {
              this.updateState({ isConnected: false, rawAscii: trimmed });
            }
          }
        }
      });

      this.process.stderr?.on("data", (data: Buffer) => {
        logger.debug(`Scale process stderr: ${data.toString()}`);
      });

      this.process.on("exit", (code) => {
        logger.warn(`Scale COM reader process exited with code ${code}`);
        this.updateState({ isConnected: false });
        this.scheduleReconnect();
      });

      this.process.on("error", (err) => {
        logger.error({ err }, "Scale COM reader process error");
        this.updateState({ isConnected: false });
        this.scheduleReconnect();
      });
    } catch (err) {
      logger.error({ err }, "Failed to spawn scale COM process");
      this.updateState({ isConnected: false, rawAscii: "COM process launch error" });
      this.scheduleReconnect();
    }
  }

  private handleRawHexData(hexString: string) {
    const hexTokens = hexString.split(/\s+/).filter(Boolean);
    const newBytes = hexTokens.map((h) => parseInt(h, 16)).filter((n) => !isNaN(n));

    this.rawBytesBuffer = [...this.rawBytesBuffer, ...newBytes].slice(-300);

    const hexDisplay = this.rawBytesBuffer
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ")
      .slice(-150);

    // Filter control bytes (0x02 STX, 0x03 ETX, 0x15 NAK, 0x0D CR, 0x0A LF)
    const filtered = this.rawBytesBuffer.filter((b) => {
      const masked = b & 0x7f;
      return masked !== 0x02 && masked !== 0x03 && masked !== 0x15 && masked !== 0x0d && masked !== 0x0a;
    });

    // Extract printable ASCII string
    const asciiStr = filtered
      .map((b) => String.fromCharCode(b & 0x7f))
      .join("")
      .replace(/[^\x20-\x7E]/g, "");

    // Extract weight numbers (looking for weight patterns)
    const digitsOnly = asciiStr.replace(/[^\d]/g, " ");
    const numbers = digitsOnly
      .split(/\s+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n >= 0 && n < 200000 && n !== 2026 && n !== 2025 && n !== 2027);

    let weightKg = this.state.liveWeight;
    if (numbers.length > 0) {
      // Scales usually output weight in Kg or divided by 10/100
      const parsedVal = numbers[0];
      weightKg = parsedVal > 200000 ? Math.round(parsedVal / 10) : parsedVal;
    }

    const weightTons = (weightKg / 1000).toFixed(3);
    const isStable = weightKg > 0;

    this.updateState({
      liveWeight: weightKg,
      liveWeightTons: weightTons,
      isStable,
      isConnected: true,
      rawHex: hexDisplay,
      rawAscii: asciiStr.slice(-100) || `Raw Bytes: ${this.rawBytesBuffer.length}`,
    });
  }

  private updateState(partial: Partial<ScaleState>) {
    this.state = {
      ...this.state,
      ...partial,
      lastUpdated: Date.now(),
    };
    this.broadcast();
  }

  private reconnect() {
    this.stopProcess();
    this.connect();
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.config.enabled && !this.state.isConnected) {
        logger.info("Attempting automatic reconnection to scale COM port...");
        this.connect();
      }
    }, 5000);
  }

  private stopProcess() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.process) {
      try {
        this.process.kill("SIGTERM");
      } catch (e) {}
      this.process = null;
    }
  }
}

export const scaleService = new ScaleService();
