import React, { createContext, useContext, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface ScaleContextType {
  liveScaleWeight: number;
  setLiveScaleWeight: React.Dispatch<React.SetStateAction<number>>;
  isScaleConnected: boolean;
  setIsScaleConnected: React.Dispatch<React.SetStateAction<boolean>>;
  isSimulating: boolean;
  setIsSimulating: React.Dispatch<React.SetStateAction<boolean>>;
  isStable: boolean;
  setIsStable: React.Dispatch<React.SetStateAction<boolean>>;
  scaleMode: "SIMULATOR" | "HARDWARE_COM";
  setScaleMode: React.Dispatch<React.SetStateAction<"SIMULATOR" | "HARDWARE_COM">>;
  connectionType: "SERVER_API" | "COM_PORT" | "LOCAL_UTILITY";
  setConnectionType: React.Dispatch<React.SetStateAction<"SERVER_API" | "COM_PORT" | "LOCAL_UTILITY">>;
  rawSerialText: string;
  setRawSerialText: React.Dispatch<React.SetStateAction<string>>;
  dataBitsSetting: number;
  setDataBitsSetting: React.Dispatch<React.SetStateAction<number>>;
  paritySetting: string;
  setParitySetting: React.Dispatch<React.SetStateAction<string>>;
  stopBitsSetting: number;
  setStopBitsSetting: React.Dispatch<React.SetStateAction<number>>;
  baudRateSetting: number;
  setBaudRateSetting: React.Dispatch<React.SetStateAction<number>>;
  
  handleConnectHardwareCOM: () => Promise<void>;
  handleConnectServerAPI: () => Promise<void>;
  handleConnectLocalUtility: () => Promise<void>;
  handleToggleConnection: () => Promise<void>;
  handleDisconnectAll: () => Promise<void>;
  handleSimulateTruckScale: (type: "empty" | "loaded", onCaptured?: (type: "empty" | "loaded", tonsVal: string) => void) => Promise<void>;
  handleResetScaleMeter: () => void;
}

const ScaleContext = createContext<ScaleContextType | undefined>(undefined);

export const ScaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  const [liveScaleWeight, setLiveScaleWeight] = useState<number>(0);
  const [isScaleConnected, setIsScaleConnected] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isStable, setIsStable] = useState<boolean>(false);
  const [scaleMode, setScaleMode] = useState<"SIMULATOR" | "HARDWARE_COM">("SIMULATOR");
  const [connectionType, setConnectionType] = useState<"SERVER_API" | "COM_PORT" | "LOCAL_UTILITY">("COM_PORT");

  const [dataBitsSetting, setDataBitsSetting] = useState<number>(8);
  const [paritySetting, setParitySetting] = useState<string>("none");
  const [stopBitsSetting, setStopBitsSetting] = useState<number>(1);
  const [baudRateSetting, setBaudRateSetting] = useState<number>(2400);
  const [rawSerialText, setRawSerialText] = useState<string>("");

  const activeSerialPortRef = useRef<any>(null);
  const activeReaderRef = useRef<any>(null);
  const serialBufferRef = useRef<string>("");
  const rawBytesRef = useRef<number[]>([]);
  const keepReadingRef = useRef<boolean>(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Disconnect all serial, SSE streams, and local utility loops
  const handleDisconnectAll = async () => {
    keepReadingRef.current = false;
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch (e) {}
      eventSourceRef.current = null;
    }
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
  };

  const handleConnectHardwareCOM = async () => {
    try {
      if (!("serial" in navigator)) {
        toast({
          title: "WebSerial Not Supported",
          description: "Your browser does not support WebSerial API. Use Chrome, Edge, or Opera.",
          variant: "destructive"
        });
        return;
      }
      await handleDisconnectAll();

      const port = await (navigator as any).serial.requestPort();
      await port.open({
        baudRate: baudRateSetting,
        dataBits: dataBitsSetting,
        stopBits: stopBitsSetting,
        parity: paritySetting
      });

      activeSerialPortRef.current = port;
      setIsScaleConnected(true);
      setScaleMode("HARDWARE_COM");
      setLiveScaleWeight(0);
      setIsStable(false);
      setRawSerialText(`COM Port Opened (${baudRateSetting} baud, ${dataBitsSetting}-${paritySetting[0].toUpperCase()}-${stopBitsSetting}). Listening for continuous scale data...`);

      keepReadingRef.current = true;

      const readLoop = async () => {
        while (port.readable && keepReadingRef.current) {
          try {
            const reader = port.readable.getReader();
            activeReaderRef.current = reader;

            while (keepReadingRef.current) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) {
                const textChunk = new TextDecoder().decode(value);
                serialBufferRef.current += textChunk;

                for (let i = 0; i < value.length; i++) {
                  rawBytesRef.current.push(value[i]);
                  if (rawBytesRef.current.length > 50) rawBytesRef.current.shift();
                }

                const hexStr = rawBytesRef.current.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

                if (serialBufferRef.current.includes("\n") || serialBufferRef.current.includes("\r") || serialBufferRef.current.length > 30) {
                  const lines = serialBufferRef.current.split(/[\r\n]+/);
                  const latestLine = lines[lines.length - 2] || lines[lines.length - 1] || serialBufferRef.current;

                  const cleanedDigits = latestLine.replace(/[^\d]/g, " ").trim();
                  const numberParts = cleanedDigits.split(/\s+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n) && n >= 0 && n < 200000);

                  if (numberParts.length > 0) {
                    const parsedWeight = numberParts[0];
                    setLiveScaleWeight(parsedWeight);
                    setIsStable(true);
                    setRawSerialText(`LIVE: ${parsedWeight} KG | ASCII: "${latestLine.trim()}" | HEX: [${hexStr}]`);
                  } else {
                    setRawSerialText(`RAW ASCII: "${latestLine.trim()}" | HEX: [${hexStr}]`);
                  }

                  serialBufferRef.current = lines[lines.length - 1] || "";
                }
              }
            }
          } catch (readErr: any) {
            if (keepReadingRef.current) {
              console.warn("Serial read error:", readErr);
            }
            break;
          } finally {
            if (activeReaderRef.current) {
              try { activeReaderRef.current.releaseLock(); } catch (e) {}
              activeReaderRef.current = null;
            }
          }
        }
      };

      readLoop();
      toast({
        title: "⚡ COM Port Connected",
        description: `Direct WebSerial active on ${baudRateSetting} baud.`
      });

    } catch (err: any) {
      if (err.name !== "NotFoundError") {
        toast({
          title: "COM Port Connection Error",
          description: err.message || "Failed to open serial port.",
          variant: "destructive"
        });
      }
    }
  };

  const handleConnectServerAPI = async () => {
    try {
      await handleDisconnectAll();

      setIsScaleConnected(true);
      setScaleMode("HARDWARE_COM");
      setLiveScaleWeight(0);
      setRawSerialText("Connecting to Server Scale stream (/api/scale/stream)...");
      setIsStable(false);

      const es = new EventSource("/api/scale/stream");
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.liveWeight !== undefined) {
            setLiveScaleWeight(data.liveWeight || 0);
            setIsStable(Boolean(data.isStable));
            setRawSerialText(data.rawAscii || data.rawHex || `Live Weight: ${data.liveWeight} KG`);
          }
        } catch (e) {
          console.warn("SSE parse error:", e);
        }
      };

      es.onerror = () => {
        setRawSerialText("Server scale stream reconnecting...");
      };

      toast({ title: "Server Scale Service Connected", description: "Listening to live weighbridge scale stream from backend server." });
    } catch (err: any) {
      toast({
        title: "Server Scale Connection Error",
        description: err.message || "Failed to connect to server scale service.",
        variant: "destructive"
      });
    }
  };

  const handleConnectLocalUtility = async () => {
    try {
      await handleDisconnectAll();

      setIsScaleConnected(true);
      setScaleMode("HARDWARE_COM");
      setLiveScaleWeight(0);
      setRawSerialText("Connecting to Local Utility at http://localhost:7171/ ...");
      setIsStable(false);

      keepReadingRef.current = true;

      const fetchLoop = async () => {
        while (keepReadingRef.current) {
          try {
            const response = await fetch("http://localhost:7171/", {
              method: "GET",
              cache: "no-store",
              headers: { "Accept": "text/html", "Cache-Control": "no-cache" }
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
              }
            }
          } catch (err: any) {
            setRawSerialText(`Polling local utility: ${err.message || err}`);
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
  };

  const handleToggleConnection = async () => {
    if (isScaleConnected) {
      await handleDisconnectAll();
      toast({ title: "Disconnected", description: "Scale connection closed." });
    } else {
      if (connectionType === "SERVER_API") {
        await handleConnectServerAPI();
      } else if (connectionType === "COM_PORT") {
        await handleConnectHardwareCOM();
      } else {
        await handleConnectLocalUtility();
      }
    }
  };

  const handleSimulateTruckScale = async (
    type: "empty" | "loaded",
    onCaptured?: (type: "empty" | "loaded", tonsVal: string) => void
  ) => {
    if (!isScaleConnected) {
      toast({
        title: "⚠️ Scale Disconnected",
        description: "Please connect your scale service first.",
        variant: "destructive"
      });
      return;
    }

    if (scaleMode === "HARDWARE_COM") {
      let capturedWeight = liveScaleWeight;

      if (activeSerialPortRef.current) {
        try {
          if (activeSerialPortRef.current.writable && !activeSerialPortRef.current.writable.locked) {
            const writer = activeSerialPortRef.current.writable.getWriter();
            try {
              await writer.write(new Uint8Array([0x05]));
              await new Promise((r) => setTimeout(r, 100));
              await writer.write(new Uint8Array([0x0D]));
            } catch (e) {
            } finally {
              writer.releaseLock();
            }
          }

          await new Promise((r) => setTimeout(r, 800));

          if (activeSerialPortRef.current.readable && !activeSerialPortRef.current.readable.locked) {
            const reader = activeSerialPortRef.current.readable.getReader();
            const decoder = new TextDecoder();
            let allDecoded = "";

            try {
              const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1500));
              const readLoop = async () => {
                while (true) {
                  const res = await reader.read();
                  if (res.done || !res.value) break;
                  allDecoded += decoder.decode(res.value);
                }
              };
              await Promise.race([readLoop(), timeoutPromise]);
            } catch (e) {
            } finally {
              try { reader.releaseLock(); } catch (e) {}
            }

            setRawSerialText(allDecoded.trim() || allDecoded);
            const digitsOnly = allDecoded.replace(/[^\d]/g, " ");
            const numbers = digitsOnly
              .split(/\s+/)
              .map((s) => parseInt(s, 10))
              .filter((n) => !isNaN(n) && n >= 0 && n < 200000);

            if (numbers.length > 0) {
              capturedWeight = numbers[0] / 10;
              setLiveScaleWeight(capturedWeight);
              setIsStable(capturedWeight > 0);
            }
          }
        } catch (err) {}
      }

      const tonsVal = (capturedWeight / 1000).toFixed(3);
      if (onCaptured) {
        onCaptured(type, tonsVal);
      }
      toast({ title: "⚖️ Weight Captured from Scale", description: `Captured ${type === "empty" ? "Empty" : "Loaded"} Weight: ${tonsVal} Tons` });
      return;
    }

    // Simulator mode
    setIsSimulating(true);
    setIsStable(false);

    const targetWeight = type === "loaded" 
      ? 34500 + Math.floor(Math.random() * 600) - 300
      : 12800 + Math.floor(Math.random() * 400) - 200;

    let stepCount = 0;
    const totalSteps = 12;

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
        if (onCaptured) {
          onCaptured(type, tonsVal);
        }
        toast({
          title: type === "loaded" ? "⚡ Loaded Weight Captured" : "⚡ Empty Weight Captured",
          description: `Recorded ${type === "loaded" ? "Loaded" : "Empty"} Weight: ${tonsVal} Tons`,
        });
      }
    }, 100);
  };

  const handleResetScaleMeter = () => {
    setLiveScaleWeight(0);
    setIsStable(false);
    rawBytesRef.current = [];
    serialBufferRef.current = "";
    setRawSerialText("Scale meter reset to 0.000 Tons.");
    toast({ title: "⚖️ Scale Meter Reset", description: "Weighing meter has been reset to default (0.000 Tons)." });
  };

  return (
    <ScaleContext.Provider
      value={{
        liveScaleWeight,
        setLiveScaleWeight,
        isScaleConnected,
        setIsScaleConnected,
        isSimulating,
        setIsSimulating,
        isStable,
        setIsStable,
        scaleMode,
        setScaleMode,
        connectionType,
        setConnectionType,
        rawSerialText,
        setRawSerialText,
        dataBitsSetting,
        setDataBitsSetting,
        paritySetting,
        setParitySetting,
        stopBitsSetting,
        setStopBitsSetting,
        baudRateSetting,
        setBaudRateSetting,
        handleConnectHardwareCOM,
        handleConnectServerAPI,
        handleConnectLocalUtility,
        handleToggleConnection,
        handleDisconnectAll,
        handleSimulateTruckScale,
        handleResetScaleMeter
      }}
    >
      {children}
    </ScaleContext.Provider>
  );
};

export const useScale = () => {
  const context = useContext(ScaleContext);
  if (!context) {
    throw new Error("useScale must be used within a ScaleProvider");
  }
  return context;
};
