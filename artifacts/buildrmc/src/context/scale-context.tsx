import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface ScaleContextType {
  liveScaleWeight: number; // in KG
  isScaleConnected: boolean;
  isSimulating: boolean;
  isStable: boolean;
  scaleMode: "SIMULATOR" | "HARDWARE_COM";
  connectionType: "COM_PORT" | "LOCAL_UTILITY";
  baudRateSetting: number;
  dataBitsSetting: number;
  paritySetting: string;
  stopBitsSetting: number;
  rawSerialText: string;
  
  // Setters
  setBaudRateSetting: (b: number) => void;
  setDataBitsSetting: (d: number) => void;
  setParitySetting: (p: string) => void;
  setStopBitsSetting: (s: number) => void;
  setConnectionType: (c: "COM_PORT" | "LOCAL_UTILITY") => void;
  setLiveScaleWeight: (w: number) => void;
  
  // Actions
  handleConnectHardwareCOM: () => Promise<void>;
  handleConnectLocalUtility: () => Promise<void>;
  handleDisconnectAll: () => Promise<void>;
  handleToggleConnection: () => Promise<void>;
  handleSimulateOrCapture: (
    type: "empty" | "loaded",
    onSuccess?: (weightKg: number, tonsFormatted: string) => void
  ) => Promise<void>;
}

const ScaleContext = createContext<ScaleContextType | undefined>(undefined);

export function ScaleProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  const [liveScaleWeight, setLiveScaleWeight] = useState<number>(0);
  const [isScaleConnected, setIsScaleConnected] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isStable, setIsStable] = useState<boolean>(false);
  const [scaleMode, setScaleMode] = useState<"SIMULATOR" | "HARDWARE_COM">("SIMULATOR");
  const [connectionType, setConnectionType] = useState<"COM_PORT" | "LOCAL_UTILITY">("COM_PORT");

  const [baudRateSetting, setBaudRateSettingState] = useState<number>(() => {
    const saved = localStorage.getItem("weighbridge_baud_rate");
    return saved ? Number(saved) : 2400;
  });

  const [dataBitsSetting, setDataBitsSettingState] = useState<number>(() => {
    const saved = localStorage.getItem("weighbridge_data_bits");
    return saved ? Number(saved) : 8;
  });

  const [paritySetting, setParitySettingState] = useState<string>(() => {
    return localStorage.getItem("weighbridge_parity") || "none";
  });

  const [stopBitsSetting, setStopBitsSettingState] = useState<number>(() => {
    const saved = localStorage.getItem("weighbridge_stop_bits");
    return saved ? Number(saved) : 1.5;
  });


  const [rawSerialText, setRawSerialText] = useState<string>("");

  const setBaudRateSetting = (b: number) => {
    setBaudRateSettingState(b);
    localStorage.setItem("weighbridge_baud_rate", String(b));
  };
  const setDataBitsSetting = (d: number) => {
    setDataBitsSettingState(d);
    localStorage.setItem("weighbridge_data_bits", String(d));
  };
  const setParitySetting = (p: string) => {
    setParitySettingState(p);
    localStorage.setItem("weighbridge_parity", p);
  };
  const setStopBitsSetting = (s: number) => {
    setStopBitsSettingState(s);
    localStorage.setItem("weighbridge_stop_bits", String(s));
  };

  // Persistent Refs across whole app lifetime
  const activeSerialPortRef = useRef<any>(null);
  const activeReaderRef = useRef<any>(null);
  const rawBytesRef = useRef<number[]>([]);
  const keepReadingRef = useRef<boolean>(false);

  // Disconnect hardware and utility
  const handleDisconnectAll = useCallback(async () => {
    keepReadingRef.current = false;
    if (activeReaderRef.current) {
      try {
        await activeReaderRef.current.cancel();
        activeReaderRef.current.releaseLock();
      } catch (err) {}
      activeReaderRef.current = null;
    }
    if (activeSerialPortRef.current) {
      try {
        await activeSerialPortRef.current.close();
      } catch (closeErr) {}
      activeSerialPortRef.current = null;
    }
    setIsScaleConnected(false);
    setLiveScaleWeight(0);
    setRawSerialText("");
    setIsStable(false);
  }, []);

  // Core function to open an authorized serial port and start live continuous reading
  const openSerialPortAndListen = useCallback(async (port: any, isAuto: boolean = false) => {
    try {
      // 1. Signal any existing reader loops to stop immediately
      keepReadingRef.current = false;

      // 2. Close active reader if locking the port
      if (activeReaderRef.current) {
        try {
          await activeReaderRef.current.cancel();
          activeReaderRef.current.releaseLock();
        } catch (err) {
          console.warn("Error cancelling reader:", err);
        }
        activeReaderRef.current = null;
      }

      // 3. Close the port itself if open
      if (activeSerialPortRef.current && activeSerialPortRef.current !== port) {
        try {
          await activeSerialPortRef.current.close();
        } catch (closeErr) {
          console.warn("Error closing port:", closeErr);
        }
        activeSerialPortRef.current = null;
      }

      activeSerialPortRef.current = port;

      // 4. Open the port with selected framing configuration
      keepReadingRef.current = true;

      try {
        await port.open({
          baudRate: baudRateSetting,
          dataBits: dataBitsSetting,
          parity: paritySetting as any,
          stopBits: stopBitsSetting,
        });
      } catch (openErr: any) {
        console.warn("Failed opening with specific framing, trying 8N1 fallback...", openErr);
        try {
          await port.open({ baudRate: baudRateSetting });
        } catch (fallbackErr: any) {
          if (!fallbackErr.message?.includes("already open")) {
            throw fallbackErr;
          }
        }
      }

      setIsScaleConnected(true);
      setScaleMode("HARDWARE_COM");
      setLiveScaleWeight(0);
      setRawSerialText("Connected. Waiting for scale data...");
      setIsStable(false);
      rawBytesRef.current = [];

      toast({
        title: isAuto ? "⚡ Scale Auto-Connected" : "COM Port Connected",
        description: `Scale is live and active at ${baudRateSetting} Baud across all pages.`,
      });

      const startReading = async (serialPort: any) => {
        while (keepReadingRef.current) {
          if (!serialPort.readable) {
            await new Promise((r) => setTimeout(r, 100));
            continue;
          }
          if (serialPort.readable.locked) {
            await new Promise((r) => setTimeout(r, 100));
            continue;
          }

          const reader = serialPort.readable.getReader();
          activeReaderRef.current = reader;

          try {
            while (keepReadingRef.current) {
              const { value, done } = await reader.read();
              if (done) break;

              if (value && keepReadingRef.current) {
                const newBytes = Array.from(value) as number[];
                rawBytesRef.current = [...rawBytesRef.current, ...newBytes].slice(-100);

                // Hex display
                const hexDisplay = rawBytesRef.current
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join(" ")
                  .slice(-150);
                setRawSerialText(hexDisplay);

                // Parse weight from actual byte values
                // Filter out control bytes: 0x02 (STX), 0x03 (ETX), 0x15 (NAK), 0x0D (CR), 0x0A (LF)
                const buf = rawBytesRef.current;
                const filteredBytes = buf.filter((b) => {
                  const masked = b & 0x7F;
                  return masked !== 0x02 && masked !== 0x03 && masked !== 0x15 && masked !== 0x0D && masked !== 0x0A;
                });

                let foundWeight = -1;
                let currentDigitSequence = "";
                for (let i = 0; i < filteredBytes.length; i++) {
                  const charCode = filteredBytes[i] & 0x7F;
                  if (charCode >= 0x30 && charCode <= 0x39) {
                    currentDigitSequence += String.fromCharCode(charCode);
                  } else {
                    if (currentDigitSequence.length >= 2 && currentDigitSequence.length <= 8) {
                      const w = parseInt(currentDigitSequence, 10);
                      if (!isNaN(w) && w >= 0 && w < 2000000) {
                        foundWeight = w;
                      }
                    }
                    currentDigitSequence = "";
                  }
                }

                if (currentDigitSequence.length >= 2 && currentDigitSequence.length <= 8) {
                  const w = parseInt(currentDigitSequence, 10);
                  if (!isNaN(w) && w >= 0 && w < 2000000) {
                    foundWeight = w;
                  }
                }

                if (foundWeight >= 0) {
                  // Adjust for 10x scale factor multiplier
                  const adjustedWeight = foundWeight / 10;
                  setLiveScaleWeight(adjustedWeight);
                  setIsStable(true);
                }
              }
            }
          } catch (readErr: any) {
            if (
              readErr.name === "BreakError" ||
              readErr.message?.includes("Break") ||
              readErr.message?.includes("break")
            ) {
              console.warn("Serial break signal received, retrying read...");
            } else {
              console.warn("Serial read error:", readErr);
              break;
            }
          } finally {
            try { reader.releaseLock(); } catch (e) {}
            activeReaderRef.current = null;
          }

          await new Promise((r) => setTimeout(r, 100));
        }
      };

      startReading(port);

    } catch (err: any) {
      if (err.name !== "NotFoundError") {
        let userFriendlyMsg = err.message || "Failed to open COM Port";
        if (err.message && (err.message.includes("Failed to open serial port") || err.message.includes("denied") || err.message.includes("locked"))) {
          userFriendlyMsg = "Port Access Denied: If your scale is connected via USB, please ensure no other software is holding the COM port.";
        }
        if (!isAuto) {
          toast({
            title: "COM Port Connection Error",
            description: userFriendlyMsg,
            variant: "destructive",
          });
        }
      }
    }
  }, [baudRateSetting, dataBitsSetting, paritySetting, stopBitsSetting, toast]);

  // Connect to Physical RS-232 COM Port via Web Serial API (Zero-click if port already authorized)
  const handleConnectHardwareCOM = useCallback(async () => {
    if (!("serial" in navigator)) {
      toast({
        title: "Web Serial API Not Supported",
        description: "Please use Google Chrome or Microsoft Edge to connect directly to physical COM ports.",
        variant: "destructive"
      });
      return;
    }

    try {
      // 1. Check if there is already an authorized port available
      const ports = await (navigator as any).serial.getPorts();
      if (ports && ports.length > 0) {
        await openSerialPortAndListen(ports[0], false);
        return;
      }

      // 2. Prompt user once to select their scale COM port
      const port = await (navigator as any).serial.requestPort();
      if (port) {
        await openSerialPortAndListen(port, false);
      }
    } catch (err: any) {
      if (err.name !== "NotFoundError") {
        toast({
          title: "COM Port Selection Error",
          description: err.message || "Failed to select COM Port.",
          variant: "destructive",
        });
      }
    }
  }, [openSerialPortAndListen, toast]);

  // Auto-connect to previously paired COM port on app startup & on USB hot-plug
  useEffect(() => {
    let isCancelled = false;

    const autoConnectKnownPort = async () => {
      if (!("serial" in navigator) || isScaleConnected || activeSerialPortRef.current) return;
      try {
        const ports = await (navigator as any).serial.getPorts();
        if (ports && ports.length > 0 && !isCancelled && !activeSerialPortRef.current) {
          console.log("⚡ Auto-connecting to paired COM port on startup...");
          await openSerialPortAndListen(ports[0], true);
        }
      } catch (err) {
        console.warn("Auto-connect to serial port failed:", err);
      }
    };

    autoConnectKnownPort();

    // Hot-plug auto-detection: when USB scale is plugged in
    const handleSerialConnect = async (event: any) => {
      if (event?.target && !activeSerialPortRef.current) {
        console.log("🔌 USB Scale plugged in, auto-connecting...");
        await openSerialPortAndListen(event.target, true);
      }
    };

    const handleSerialDisconnect = () => {
      console.warn("⚠️ Scale USB unplugged");
      handleDisconnectAll();
    };

    if ("serial" in navigator) {
      (navigator as any).serial.addEventListener("connect", handleSerialConnect);
      (navigator as any).serial.addEventListener("disconnect", handleSerialDisconnect);
    }

    return () => {
      isCancelled = true;
      if ("serial" in navigator) {
        (navigator as any).serial.removeEventListener("connect", handleSerialConnect);
        (navigator as any).serial.removeEventListener("disconnect", handleSerialDisconnect);
      }
    };
  }, [openSerialPortAndListen, handleDisconnectAll, isScaleConnected]);


  // Connect to Local Utility Bridge running on client machine (Port 7171)
  const handleConnectLocalUtility = useCallback(async () => {
    try {
      await handleDisconnectAll();

      setIsScaleConnected(true);
      setScaleMode("HARDWARE_COM");
      setLiveScaleWeight(0);
      setRawSerialText("Connecting to Local Utility at http://localhost:7171/ ...");
      setIsStable(false);

      keepReadingRef.current = true;

      const fetchLoop = async () => {
        let failureCount = 0;
        while (keepReadingRef.current) {
          try {
            const response = await fetch("http://localhost:7171/", {
              method: "GET",
              cache: "no-store",
              headers: {
                "Accept": "text/html",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
              }
            });
            if (response.ok) {
              const text = await response.text();
              const rawTrimmed = text.trim();
              const match = rawTrimmed.match(/\d+/);
              const weight = match ? parseInt(match[0], 10) : NaN;

              if (!isNaN(weight)) {
                setLiveScaleWeight(weight);
                setRawSerialText(`Raw: "${rawTrimmed}" | Parsed: ${weight} KG`);
                setIsStable(true);
                failureCount = 0;
              } else {
                setRawSerialText(`Raw: "${rawTrimmed}" | Could not parse weight`);
              }
            } else {
              throw new Error(`HTTP Status ${response.status}`);
            }
          } catch (err: any) {
            failureCount++;
            setRawSerialText(`Polling local utility (http://localhost:7171/): ${err.message || err}`);
            if (failureCount > 15) {
              console.warn("Polling utility failing repeatedly:", err);
            }
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
      };

      fetchLoop();
      toast({ title: "Local Utility Connected", description: "Successfully listening to http://localhost:7171/." });

    } catch (err: any) {
      toast({
        title: "Utility Connection Error",
        description: err.message || "Failed to start listening to local utility.",
        variant: "destructive"
      });
    }
  }, [handleDisconnectAll, toast]);

  const handleToggleConnection = useCallback(async () => {
    if (isScaleConnected) {
      await handleDisconnectAll();
      toast({ title: "Disconnected", description: "Scale connection closed." });
    } else {
      if (connectionType === "COM_PORT") {
        await handleConnectHardwareCOM();
      } else {
        await handleConnectLocalUtility();
      }
    }
  }, [isScaleConnected, connectionType, handleDisconnectAll, handleConnectHardwareCOM, handleConnectLocalUtility, toast]);

  // Capture or Simulate Weight
  const handleSimulateOrCapture = useCallback(async (
    type: "empty" | "loaded",
    onSuccess?: (weightKg: number, tonsFormatted: string) => void
  ) => {
    // If not connected, inform user
    if (!isScaleConnected) {
      toast({
        title: "⚠️ Scale Disconnected",
        description: "Please click 'Connect COM Port' to connect your scale before capturing weight.",
        variant: "destructive",
      });
      return;
    }

    if (scaleMode === "HARDWARE_COM") {
      let capturedWeight = liveScaleWeight;

      // On-demand trigger send if supported
      if (activeSerialPortRef.current) {
        try {
          if (activeSerialPortRef.current.writable && !activeSerialPortRef.current.writable.locked) {
            const writer = activeSerialPortRef.current.writable.getWriter();
            try {
              await writer.write(new Uint8Array([0x05])); // ENQ
              await new Promise((r) => setTimeout(r, 100));
              await writer.write(new Uint8Array([0x0D])); // CR
            } catch (e) {
              console.warn("Trigger write error:", e);
            } finally {
              writer.releaseLock();
            }
          }

          await new Promise((r) => setTimeout(r, 600));

          // If weight was updated by the background stream
          if (liveScaleWeight > 0) {
            capturedWeight = liveScaleWeight;
          }
        } catch (err) {
          console.warn("On-demand scale trigger error:", err);
        }
      }

      const tonsVal = (capturedWeight / 1000).toFixed(3);
      if (onSuccess) {
        onSuccess(capturedWeight, tonsVal);
      }
      toast({
        title: "⚖️ Weight Captured from Scale",
        description: `Captured ${type === "empty" ? "Tare / Empty" : "Gross / Loaded"} Weight: ${tonsVal} Tons (${capturedWeight} KG)`,
      });
      return;
    }

    // Simulator mode
    setIsSimulating(true);
    setIsStable(false);

    const baseWeight = type === "empty" ? 12800 : 34500;
    const randomOffset = Math.floor(Math.random() * 800) - 400;
    const targetWeight = baseWeight + randomOffset;

    let stepCount = 0;
    const totalSteps = 15;
    const interval = setInterval(() => {
      stepCount++;
      const jitter = Math.floor((Math.random() - 0.5) * (totalSteps - stepCount) * 400);
      setLiveScaleWeight(Math.max(0, targetWeight + jitter));

      if (stepCount >= totalSteps) {
        clearInterval(interval);
        setLiveScaleWeight(targetWeight);
        setIsSimulating(false);
        setIsStable(true);

        const tonsVal = (targetWeight / 1000).toFixed(3);
        if (onSuccess) {
          onSuccess(targetWeight, tonsVal);
        }
        toast({
          title: "⚖️ Scale Weight Stabilized",
          description: `Captured ${type === "empty" ? "Empty" : "Loaded"} Weight: ${tonsVal} Tons`,
        });
      }
    }, 100);
  }, [isScaleConnected, scaleMode, liveScaleWeight, toast]);

  return (
    <ScaleContext.Provider
      value={{
        liveScaleWeight,
        isScaleConnected,
        isSimulating,
        isStable,
        scaleMode,
        connectionType,
        baudRateSetting,
        dataBitsSetting,
        paritySetting,
        stopBitsSetting,
        rawSerialText,
        setBaudRateSetting,
        setDataBitsSetting,
        setParitySetting,
        setStopBitsSetting,
        setConnectionType,
        setLiveScaleWeight,
        handleConnectHardwareCOM,
        handleConnectLocalUtility,
        handleDisconnectAll,
        handleToggleConnection,
        handleSimulateOrCapture,
      }}
    >
      {children}
    </ScaleContext.Provider>
  );
}

export function useScale() {
  const context = useContext(ScaleContext);
  if (!context) {
    throw new Error("useScale must be used within a ScaleProvider");
  }
  return context;
}
