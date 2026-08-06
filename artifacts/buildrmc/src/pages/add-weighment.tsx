import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ListPlus, Save, RotateCcw, Truck, Info, Settings, Scale, Zap, Radio, CheckCircle2, Play, RefreshCw, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetCustomers, 
  useGetVehicles, 
  useGetProducts, 
  useGetEmployees,
  useGetMasters
} from "@workspace/api-client-react";

export default function AddWeighment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [deliveryNo] = useState(() => "DEL/" + Math.floor(100000 + Math.random() * 900000));
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [plant, setPlant] = useState("");
  const ticketNo = useMemo(() => "TKT-" + Math.floor(1000 + Math.random() * 9000), []);
  
  // Form State
  const [mobileNo, setMobileNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [site, setSite] = useState("");
  const [grade, setGrade] = useState("");
  const [amount, setAmount] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [driver, setDriver] = useState("");
  const [billNo, setBillNo] = useState("");
  const [emptyWeight, setEmptyWeight] = useState("");
  const [loadedWeight, setLoadedWeight] = useState("");

  // Weighbridge Live & Simulator State
  const [liveScaleWeight, setLiveScaleWeight] = useState<number>(0);
  const [isScaleConnected, setIsScaleConnected] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isStable, setIsStable] = useState<boolean>(false);
  const [scaleMode] = useState<"HARDWARE" | "SIMULATOR">("HARDWARE");
  const [comPortSetting, setComPortSetting] = useState<string>("COM1");
  const [baudRateSetting, setBaudRateSetting] = useState<number>(2400);
  const [dataBitsSetting, setDataBitsSetting] = useState<number>(8);
  const [paritySetting, setParitySetting] = useState<string>("none");
  const [stopBitsSetting, setStopBitsSetting] = useState<number>(1);
  const [availableComPorts, setAvailableComPorts] = useState<string[]>(["COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8"]);
  const [rawSerialText, setRawSerialText] = useState<string>("");

  // Fetch available COM ports and current scale config on mount
  useEffect(() => {
    fetch("/api/scale/ports")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.ports) && data.ports.length > 0) {
          setAvailableComPorts(data.ports);
        }
      })
      .catch((e) => console.warn("Failed fetching ports:", e));

    fetch("/api/scale/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.state && data.state.config) {
          const c = data.state.config;
          if (c.comPort) setComPortSetting(c.comPort);
          if (c.baudRate) setBaudRateSetting(c.baudRate);
          if (c.dataBits) setDataBitsSetting(c.dataBits);
          if (c.parity) setParitySetting(c.parity);
          if (c.stopBits) setStopBitsSetting(c.stopBits);
        }
      })
      .catch((e) => console.warn("Failed fetching initial scale status:", e));
  }, []);

  // Automatic Backend COM Port Stream Listener (SSE)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/scale/stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data) {
            setIsScaleConnected(Boolean(data.isConnected));
            if (typeof data.liveWeight === "number") {
              setLiveScaleWeight(data.liveWeight);
            }
            setIsStable(Boolean(data.isStable));
            if (data.rawAscii) {
              setRawSerialText(data.rawAscii);
            } else if (data.rawHex) {
              setRawSerialText(data.rawHex);
            }
            if (data.config) {
              if (data.config.comPort) setComPortSetting(data.config.comPort);
              if (data.config.baudRate) setBaudRateSetting(data.config.baudRate);
              if (data.config.dataBits) setDataBitsSetting(data.config.dataBits);
              if (data.config.parity) setParitySetting(data.config.parity);
              if (data.config.stopBits) setStopBitsSetting(data.config.stopBits);
            }
          }
        } catch (e) {
          console.warn("Error parsing scale SSE event data:", e);
        }
      };

      eventSource.onerror = () => {
        setIsScaleConnected(false);
      };
    } catch (err) {
      console.warn("EventSource setup error:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleScaleConfigChange = async (updates: Partial<{ comPort: string; baudRate: number; dataBits: number; parity: string; stopBits: number }>) => {
    try {
      const res = await fetch("/api/scale/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.config) {
        toast({
          title: "⚙️ Scale Settings Updated",
          description: `COM Port reconnected using ${data.config.comPort} @ ${data.config.baudRate} Baud (${data.config.dataBits}-${data.config.parity.toUpperCase().charAt(0)}-${data.config.stopBits})`,
        });
      }
    } catch (err) {
      console.warn("Failed to update scale config:", err);
    }
  };

  // Live Data
  const { data: customers } = useGetCustomers();
  const { data: vehicles } = useGetVehicles();
  const { data: products } = useGetProducts();
  const { data: employees } = useGetEmployees();
  const { data: plants } = useGetMasters("plant");

  useEffect(() => {
    if (plants && plants.length > 0 && !plant) {
      setPlant(String(plants[0].name || plants[0].id || ""));
    }
  }, [plants, plant]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const broadcastWeighment = (vehNo: string, loaded: string, empty: string) => {
    try {
      const data = {
        vehicleNo: vehNo,
        loadedWeight: loaded,
        emptyWeight: empty,
        loadedWeightKg: loaded ? Math.round(Number(loaded) * 1000) : 0,
        emptyWeightKg: empty ? Math.round(Number(empty) * 1000) : 0,
        timestamp: Date.now()
      };
      localStorage.setItem("rmc_latest_weighment", JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("rmc_weighment_update", { detail: data }));
    } catch (e) {
      console.warn("Error broadcasting weighment:", e);
    }
  };

  useEffect(() => {
    if (loadedWeight || emptyWeight) {
      broadcastWeighment(vehicleNo, loadedWeight, emptyWeight);
    }
  }, [loadedWeight, emptyWeight, vehicleNo]);

  // Auto-capture weight when scale reading stabilizes (hands-free)
  const lastCapturedWeightRef = useRef<number | null>(null);

  useEffect(() => {
    if (liveScaleWeight < 200) {
      lastCapturedWeightRef.current = null;
      return;
    }

    if (isStable && liveScaleWeight >= 500) {
      const tonsVal = (liveScaleWeight / 1000).toFixed(3);
      if (lastCapturedWeightRef.current === liveScaleWeight) return;

      if (!loadedWeight) {
        setLoadedWeight(tonsVal);
        lastCapturedWeightRef.current = liveScaleWeight;
        toast({
          title: "⚡ Loaded Weight Auto-Captured",
          description: `Automatically recorded Loaded Weight: ${tonsVal} Tons`,
        });
      } else if (loadedWeight && !emptyWeight) {
        if (Number(tonsVal) <= Number(loadedWeight)) {
          setEmptyWeight(tonsVal);
          lastCapturedWeightRef.current = liveScaleWeight;
          toast({
            title: "⚡ Empty Weight Auto-Captured",
            description: `Automatically recorded Empty Weight: ${tonsVal} Tons`,
          });
        }
      }
    }
  }, [liveScaleWeight, isStable, loadedWeight, emptyWeight]);

  // Automated background scale engine (runs 100% hands-free without pressing any buttons)
  useEffect(() => {
    if (scaleMode !== "SIMULATOR" || !isScaleConnected) return;

    let cleanupFn: (() => void) | undefined;

    // Phase 1: Auto-generate & capture Loaded Weight (Gross)
    if (!loadedWeight && !isSimulating) {
      setIsSimulating(true);
      setIsStable(false);
      const targetWeight = 34500 + Math.floor(Math.random() * 600) - 300;
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
          setLoadedWeight(tonsVal);
          toast({
            title: "⚡ Loaded Weight Auto-Captured",
            description: `Automatically recorded Loaded Weight: ${tonsVal} Tons`,
          });
        }
      }, 100);

      cleanupFn = () => clearInterval(interval);
    }
    // Phase 2: Auto-generate & capture Empty Weight (Tare) after Loaded Weight is captured
    else if (loadedWeight && !emptyWeight && !isSimulating) {
      const timer = setTimeout(() => {
        setIsSimulating(true);
        setIsStable(false);
        const targetWeight = 12800 + Math.floor(Math.random() * 400) - 200;
        let stepCount = 0;
        const totalSteps = 12;

        const interval = setInterval(() => {
          stepCount++;
          const jitter = Math.floor((Math.random() - 0.5) * (totalSteps - stepCount) * 300);
          setLiveScaleWeight(Math.max(0, targetWeight + jitter));

          if (stepCount >= totalSteps) {
            clearInterval(interval);
            setLiveScaleWeight(targetWeight);
            setIsSimulating(false);
            setIsStable(true);
            const tonsVal = (targetWeight / 1000).toFixed(3);
            setEmptyWeight(tonsVal);
            toast({
              title: "⚡ Empty Weight Auto-Captured",
              description: `Automatically recorded Empty Weight: ${tonsVal} Tons`,
            });
          }
        }, 100);
      }, 1500);

      cleanupFn = () => clearTimeout(timer);
    }

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [scaleMode, loadedWeight, emptyWeight, isSimulating]);

  // Update site and mobile number when customer changes
  const selectedCustomerData = useMemo(() => {
    if (!customers || !customer) return null;
    return customers.find((c: any) => String(c.id || c._id) === customer) as any;
  }, [customers, customer]);

  useEffect(() => {
    if (selectedCustomerData) {
      setMobileNo(selectedCustomerData.contactNumber || selectedCustomerData.phone || selectedCustomerData.mobile || "");
      if (selectedCustomerData.address) {
        setSite(selectedCustomerData.address);
      } else {
        setSite("");
      }
    }
  }, [selectedCustomerData]);

  const availableCustomers = useMemo(() => {
    return (customers || []).map((c: any) => ({
      id: String(c.id || c._id),
      name: c.name
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [customers]);

  const availableSites = useMemo(() => {
    if (selectedCustomerData?.address) {
      return [selectedCustomerData.address];
    }
    const sites = new Set<string>();
    customers?.forEach((c: any) => {
      if (c.address) sites.add(c.address);
    });
    return Array.from(sites).sort();
  }, [customers, selectedCustomerData]);

  const availableVehicles = useMemo(() => {
    return (vehicles || []).map((v: any) => {
      const reg = v.registrationNumber || v.registrationNo || v.vehicleReg || v.vehicleNumber || v.regNo || v.number || v.name || String(v.id || v._id);
      return {
        id: String(v.id || v._id),
        reg: reg
      };
    });
  }, [vehicles]);

  const availableProducts = useMemo(() => {
    return (products || []).map((p: any) => ({
      id: String(p.id || p._id),
      name: p.name || p.grade || String(p.id || p._id)
    }));
  }, [products]);

  const availableDrivers = useMemo(() => {
    return (employees || []).filter((e: any) => !e.role || e.role.toLowerCase() === 'driver' || e.designation?.toLowerCase() === 'driver').map((e: any) => ({
      id: String(e.id || e._id),
      name: e.name || e.fullName || String(e.id || e._id)
    }));
  }, [employees]);

  const customerName = selectedCustomerData?.name || "-";
  const customerPhone = mobileNo || "-";
  const siteAddress = site || "-";

  const selectedProductName = availableProducts.find(p => p.id === grade)?.name || (grade ? grade.toUpperCase() : "-");

  const ticketDetails = [
    { label: "Customer Name", value: customerName },
    { label: "Customer Phone", value: customerPhone },
    { label: "Site Name", value: siteAddress },
    { label: "Site Address", value: siteAddress },
    { label: "Grade", value: selectedProductName },
    { label: "Ticket No", value: ticketNo },
    { label: "Ticket Time", value: time },
  ];

  const handleSave = async () => {
    if (!customer || !vehicleNo) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    const net = (Number(loadedWeight) || 0) - (Number(emptyWeight) || 0);
    if (net < 0) {
      toast({ title: "Validation Error", description: "Loaded weight cannot be less than empty weight.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch("/api/weighment-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNo,
          plant: plant || "Plant 1",
          vehicleNo,
          weightType: "Net Weight",
          weight: net,
          createdBy: "Super Admin"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save weighment ticket to database");
      }

      toast({ title: "Weighment Saved", description: `Record saved to MongoDB with Net Weight: ${net.toFixed(3)} Tons.` });
      setLiveScaleWeight(0);
      setIsStable(false);
      rawBytesRef.current = [];
      serialBufferRef.current = "";
      navigate("/dc/weighment/list");
    } catch (err: any) {
      toast({ title: "Error Saving", description: err.message || "Could not save to database", variant: "destructive" });
    }
  };

  const handleResetScaleMeter = () => {
    setLiveScaleWeight(0);
    setIsStable(false);
    rawBytesRef.current = [];
    serialBufferRef.current = "";
    setRawSerialText("Scale meter reset to 0.000 Tons.");
    toast({ title: "⚖️ Scale Meter Reset", description: "Weighing meter has been reset to default (0.000 Tons)." });
  };

  const handleClear = () => {
    setMobileNo("");
    setCustomer("");
    setSite("");
    setGrade("");
    setAmount("");
    setVehicleNo("");
    setDriver("");
    setBillNo("");
    setEmptyWeight("");
    setLoadedWeight("");
    setLiveScaleWeight(0);
    setIsStable(false);
    rawBytesRef.current = [];
    serialBufferRef.current = "";
    toast({ title: "Form Cleared", description: "All inputs and scale meter have been reset." });
  };

  // Capture scale reading for physical hardware or simulator
  const handleSimulateTruckScale = async (type: "empty" | "loaded") => {
    // REQUIRE REAL SCALE / COM PORT CONNECTION FIRST
    if (!isScaleConnected) {
      toast({
        title: "⚠️ Scale Disconnected",
        description: "Please click 'Connect COM Port' to connect your COM port first before capturing weight.",
        variant: "destructive"
      });
      return;
    }

    // If connected to physical hardware, send trigger and read response from COM port!
    if (scaleMode === "HARDWARE_COM") {
      let capturedWeight = liveScaleWeight;

      if (activeSerialPortRef.current) {
        try {
          // Step 1: Send trigger command to scale indicator to request weight data
          // Most Indian weighbridge indicators respond to ENQ (0x05), CR (\r), or 'P'
          if (activeSerialPortRef.current.writable && !activeSerialPortRef.current.writable.locked) {
            const writer = activeSerialPortRef.current.writable.getWriter();
            try {
              // Send multiple trigger types - ENQ + CR + LF
              await writer.write(new Uint8Array([0x05])); // ENQ
              await new Promise((r) => setTimeout(r, 100));
              await writer.write(new Uint8Array([0x0D])); // CR
            } catch (e) {
              console.warn("Trigger write error:", e);
            } finally {
              writer.releaseLock();
            }
          }

          // Step 2: Wait 800ms for scale indicator to respond with weight data
          await new Promise((r) => setTimeout(r, 800));

          // Step 3: Read the response from COM port
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
              console.warn("Read error:", e);
            } finally {
              try { reader.releaseLock(); } catch (e) {}
            }

            console.log("SCALE RESPONSE:", JSON.stringify(allDecoded));
            setRawSerialText(allDecoded.trim() || allDecoded);

            const digitsOnly = allDecoded.replace(/[^\d]/g, " ");
            const numbers = digitsOnly
              .split(/\s+/)
              .map((s) => parseInt(s, 10))
              .filter((n) => !isNaN(n) && n >= 0 && n < 200000 && n !== 2026 && n !== 2025 && n !== 2027);

            if (numbers.length > 0) {
              capturedWeight = numbers[0] / 10;
              setLiveScaleWeight(capturedWeight);
              setIsStable(capturedWeight > 0);
            }
          }
        } catch (err) {
          console.warn("On-demand scale capture error:", err);
        }
      }

      const tonsVal = (capturedWeight / 1000).toFixed(3);
      if (type === "empty") {
        setEmptyWeight(tonsVal);
        toast({ title: "⚖️ Weight Captured from Scale", description: `Captured Empty Weight: ${tonsVal} Tons` });
      } else {
        setLoadedWeight(tonsVal);
        toast({ title: "⚖️ Weight Captured from Scale", description: `Captured Loaded Weight: ${tonsVal} Tons` });
      }
      return;
    }

    setIsSimulating(true);
    setIsStable(false);
    
    // Target realistic weight range for simulator
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
        if (type === "empty") {
          setEmptyWeight(tonsVal);
          toast({ title: "⚖️ Scale Weight Stabilized", description: `Captured Empty Weight: ${tonsVal} Tons` });
        } else {
          setLoadedWeight(tonsVal);
          toast({ title: "⚖️ Scale Weight Stabilized", description: `Captured Loaded Weight: ${tonsVal} Tons` });
        }
      }
    }, 120);
  };

  // Connect to Physical RS-232 COM Port via Web Serial API (when hardware is connected)
  const handleConnectHardwareCOM = async () => {
    if (!("serial" in navigator)) {
      toast({
        title: "Web Serial API Not Supported",
        description: "Please use Google Chrome or Microsoft Edge to connect directly to physical COM ports.",
        variant: "destructive"
      });
      return;
    }

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

      // 3. Close the port itself so we can reopen it at the new baud rate
      if (activeSerialPortRef.current) {
        try {
          await activeSerialPortRef.current.close();
        } catch (closeErr) {
          console.warn("Error closing port:", closeErr);
        }
        activeSerialPortRef.current = null;
      }

      // 4. Always prompt Chrome's COM port selection popup dialog
      const port = await (navigator as any).serial.requestPort();
      activeSerialPortRef.current = port;

      // 5. Open the port with selected baud rate and configuration
      // We start reading now, so set the loop control flag to true
      keepReadingRef.current = true;

      try {
        // Open port with user-selected baud rate, data bits, parity, and stop bits
        await port.open({ baudRate: baudRateSetting, dataBits: dataBitsSetting, parity: paritySetting as any, stopBits: stopBitsSetting });
      } catch (openErr: any) {
        console.warn("Failed opening with 7O1, trying 8N1 fallback...", openErr);
        // Fallback: Try 8N1 (no parity, 8 data bits)
        try {
          await port.open({ baudRate: baudRateSetting });
        } catch (fallbackErr: any) {
          if (!fallbackErr.message?.includes("already open")) {
            if (typeof port.forget === "function") {
              try { await port.forget(); } catch (forgetErr) {}
            }
            throw fallbackErr;
          }
        }
      }

      setIsScaleConnected(true);
      setScaleMode("HARDWARE_COM");
      setLiveScaleWeight(0);
      setRawSerialText("Connected. Waiting for scale data...");
      setIsStable(false);
      toast({ title: "COM Port Connected", description: `Successfully connected at ${baudRateSetting} Baud.` });

      // Reset buffers on new connection
      serialBufferRef.current = "";
      rawBytesRef.current = [];

      const startReading = async (serialPort: any) => {
        // Run loop while keepReadingRef is true
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
          const decoder = new TextDecoder("latin1");

          try {
            while (keepReadingRef.current) {
              const { value, done } = await reader.read();
              if (done) break;

              if (value && keepReadingRef.current) {
                // Accumulate raw byte values for PARSING
                const newBytes = Array.from(value) as number[];
                rawBytesRef.current = [...rawBytesRef.current, ...newBytes].slice(-300);

                // Show hex display so we can see exact bytes from scale
                const hexDisplay = rawBytesRef.current
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join(" ")
                  .slice(-200);
                setRawSerialText(hexDisplay);
                console.log("RAW HEX:", hexDisplay);

                // Parse weight from ACTUAL BYTE VALUES (not hex text)
                // Recommended Parsing Logic: Ignore 0x02 (STX), 0x03 (ETX), 0x15 (NAK), 0x0D (CR), and 0x0A (LF).
                // Extract only ASCII digits (0x30-0x39) to obtain the weight.
                const buf = rawBytesRef.current;
                
                // Filter out the specified control bytes (both raw and parity-masked)
                const filteredBytes = buf.filter((b) => {
                  const masked = b & 0x7F;
                  return masked !== 0x02 && masked !== 0x03 && masked !== 0x15 && masked !== 0x0D && masked !== 0x0A;
                });

                let foundWeight = -1;

                // Find contiguous sequences of ASCII digits (0x30 - 0x39) after filtering
                let currentDigitSequence: string = "";
                for (let i = 0; i < filteredBytes.length; i++) {
                  const charCode = filteredBytes[i] & 0x7F;
                  if (charCode >= 0x30 && charCode <= 0x39) {
                    currentDigitSequence += String.fromCharCode(charCode);
                  } else {
                    // Non-digit byte acts as a delimiter, evaluate current sequence
                    if (currentDigitSequence.length >= 3 && currentDigitSequence.length <= 8) {
                      const w = parseInt(currentDigitSequence, 10);
                      if (w >= 0 && w < 200000) {
                        foundWeight = w;
                      }
                    }
                    currentDigitSequence = ""; // reset for next sequence
                  }
                }

                // Check if the buffer ends with a valid digit sequence
                if (currentDigitSequence.length >= 3 && currentDigitSequence.length <= 8) {
                  const w = parseInt(currentDigitSequence, 10);
                  if (w >= 0 && w < 200000) {
                    foundWeight = w;
                  }
                }

                if (foundWeight >= 0) {
                  // Adjust for 10x scale factor multiplier
                  const adjustedWeight = foundWeight / 10;
                  setLiveScaleWeight(adjustedWeight);
                  setIsStable(adjustedWeight > 0);
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

          // Small delay before retrying the read loop if we got a break or exception
          await new Promise((r) => setTimeout(r, 100));
        }
      };

      startReading(port);

    } catch (err: any) {
      if (err.name !== "NotFoundError") {
        let userFriendlyMsg = err.message || "Failed to open COM Port";
        
        if (err.message && (err.message.includes("Failed to open serial port") || err.message.includes("denied") || err.message.includes("locked"))) {
          userFriendlyMsg = "Port Access Denied: If your scale is connected via a USB cable, please select 'USB Serial Device' (e.g. COM3 or COM4) from the Chrome popup list, or close any background app holding COM1.";
        }

        toast({ 
          title: "COM Port Connection Error", 
          description: userFriendlyMsg, 
          variant: "destructive" 
        });
      }
    }
  };

  // Disconnect all serial and local utility loops
  const handleDisconnectAll = async () => {
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
  };

  // Connect to Local Utility Bridge running on client's machine (Port 7171)
  const handleConnectLocalUtility = async () => {
    try {
      // 1. Clean up any existing connection first
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
              
              // Robust parser: extract the first sequence of numbers (ignores surrounding text like 'Kg' or 'Wt:')
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
          // Poll every 1.5 seconds matching their interval
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
      if (connectionType === "COM_PORT") {
        await handleConnectHardwareCOM();
      } else {
        await handleConnectLocalUtility();
      }
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header & Breadcrumbs */}
      <div className="flex items-center justify-between bg-white/40 p-4 rounded-xl backdrop-blur-md border border-white/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">Add Weighment</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Record vehicle weights and generate delivery records</p>
        </div>
        <nav className="text-[10px] font-bold text-slate-400 flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
          <Link href="/dashboard" className="hover:text-[#ea580c] transition-colors">HOME</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <Link href="/dc" className="hover:text-[#ea580c] transition-colors">DC</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <span className="text-slate-800">ADD</span>
        </nav>
      </div>

      <div className="flex justify-start">
        <Link href="/dc/weighment/list" className="bg-[#ea580c] hover:bg-[#d97706] text-white gap-2 inline-flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-widest h-10 px-6 py-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95">
          <ListPlus className="h-4 w-4" />
          + WEIGHMENT LIST
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Form Section */}
        <div className="lg:col-span-8">
          <div className="glass-card p-6 h-full border-white/80 shadow-xl">
            {/* Weighbridge Digital Indicator & Control Panel */}
            <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white shadow-2xl border border-slate-700/80 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Scale className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs tracking-wider uppercase text-slate-200">Digital Weighbridge Indicator</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isScaleConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                        {isScaleConnected ? `🟢 SCALE CONNECTED (${comPortSetting}, ${baudRateSetting} Baud)` : `🟡 SEARCHING SCALE (${comPortSetting})...`}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Automatic RS-232 / USB scale readout & hands-free weight capture</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {/* COM Port & Serial Configuration Dropdowns */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* COM Port Dropdown */}
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Port</span>
                      <Select value={comPortSetting} onValueChange={(val) => { setComPortSetting(val); handleScaleConfigChange({ comPort: val }); }}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 text-[10px] font-mono font-bold h-8 w-24">
                          <SelectValue placeholder="Port" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                          {availableComPorts.map((port) => (
                            <SelectItem key={port} value={port}>{port}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Baud Rate Dropdown */}
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Baud</span>
                      <Select value={String(baudRateSetting)} onValueChange={(val) => { setBaudRateSetting(Number(val)); handleScaleConfigChange({ baudRate: Number(val) }); }}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 text-[10px] font-mono font-bold h-8 w-24">
                          <SelectValue placeholder="Baud Rate" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                          <SelectItem value="1200">1200</SelectItem>
                          <SelectItem value="2400">2400</SelectItem>
                          <SelectItem value="4800">4800</SelectItem>
                          <SelectItem value="9600">9600</SelectItem>
                          <SelectItem value="19200">19200</SelectItem>
                          <SelectItem value="115200">115200</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Data Bits Dropdown */}
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Bits</span>
                      <Select value={String(dataBitsSetting)} onValueChange={(val) => { setDataBitsSetting(Number(val)); handleScaleConfigChange({ dataBits: Number(val) }); }}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 text-[10px] font-mono font-bold h-8 w-20">
                          <SelectValue placeholder="Bits" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                          <SelectItem value="5">5 Bits</SelectItem>
                          <SelectItem value="6">6 Bits</SelectItem>
                          <SelectItem value="7">7 Bits</SelectItem>
                          <SelectItem value="8">8 Bits</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Parity Dropdown */}
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Parity</span>
                      <Select value={paritySetting} onValueChange={(val) => { setParitySetting(val); handleScaleConfigChange({ parity: val }); }}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 text-[10px] font-mono font-bold h-8 w-22">
                          <SelectValue placeholder="Parity" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="even">Even</SelectItem>
                          <SelectItem value="odd">Odd</SelectItem>
                          <SelectItem value="mark">Mark</SelectItem>
                          <SelectItem value="space">Space</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Stop Bits Dropdown */}
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Stop</span>
                      <Select value={String(stopBitsSetting)} onValueChange={(val) => { setStopBitsSetting(Number(val)); handleScaleConfigChange({ stopBits: Number(val) }); }}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 text-[10px] font-mono font-bold h-8 w-20">
                          <SelectValue placeholder="Stop" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                          <SelectItem value="1">1 Stop</SelectItem>
                          <SelectItem value="1.5">1.5 Stop</SelectItem>
                          <SelectItem value="2">2 Stop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital LED Screen Display */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-7 bg-black/70 rounded-xl p-4 border border-slate-800 flex items-center justify-between shadow-inner">
                  <div>
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span>SCALE WEIGHT</span>
                      {isStable && <span className="text-emerald-400 text-[9px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 font-sans">● STABLE</span>}
                      {isSimulating && <span className="text-amber-400 text-[9px] animate-bounce">MEASURING...</span>}
                    </div>
                    <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-wider text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)] mt-1">
                      {(liveScaleWeight / 1000).toFixed(3)} <span className="text-lg text-slate-400 font-normal">Tons</span>
                    </div>
                    {isScaleConnected && scaleMode === "HARDWARE_COM" && (
                      <div className="text-[10px] font-mono text-slate-400 mt-2 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[280px]">
                        <span className="text-emerald-400 shrink-0">RAW STREAM:</span>
                        <span className="text-slate-300 truncate">{rawSerialText || "Waiting for data..."}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right self-start">
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Status</div>
                    <div className="text-xs font-mono font-bold text-orange-400">
                      {isSimulating ? "SENSING..." : isStable ? "LOCKED" : "READY"}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col gap-2">
                  <Button
                    type="button"
                    disabled={!isScaleConnected || isSimulating}
                    onClick={() => handleSimulateTruckScale("loaded")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider h-9 shadow-md shadow-emerald-900/30 gap-2 w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSimulating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                    {isScaleConnected && scaleMode === "HARDWARE_COM" ? "CAPTURE GROSS WEIGHT FROM SCALE" : "SIMULATE LOADED TRUCK (GROSS)"}
                  </Button>

                  <Button
                    type="button"
                    disabled={!isScaleConnected || isSimulating}
                    onClick={() => handleSimulateTruckScale("empty")}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider h-9 shadow-md shadow-amber-900/30 gap-2 w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSimulating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    {isScaleConnected && scaleMode === "HARDWARE_COM" ? "CAPTURE TARE WEIGHT FROM SCALE" : "SIMULATE EMPTY TRUCK (TARE)"}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleResetScaleMeter}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-black uppercase tracking-wider h-8 shadow-md gap-1.5 w-full justify-center"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                    ZERO / RESET SCALE METER
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-8 border-b border-slate-100 pb-4">
              <div className="bg-[#ea580c]/10 p-2 rounded-lg">
                <Truck className="h-5 w-5 text-[#ea580c]" />
              </div>
              <h3 className="font-black text-slate-800 text-sm tracking-widest uppercase">Weighment Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <Label className="f-label">Delivery No</Label>
                <Input value={deliveryNo} readOnly className="f-input bg-slate-50 border-slate-200 text-slate-400 font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="f-input bg-white border-slate-200 text-slate-700 font-semibold" />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="f-input bg-white border-slate-200 text-slate-700 font-semibold" />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Plant <span className="text-rose-500">*</span></Label>
                <Select value={plant} onValueChange={setPlant}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue placeholder="Choose Plant" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {plants && plants.length > 0 ? (
                      plants.map((p: any) => (
                        <SelectItem key={p.id || p._id} value={p.name || p.id}>{p.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty" disabled>No plants configured</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Mobile No</Label>
                <Input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder="Enter Mobile No" className="f-input bg-white border-slate-200 text-slate-700 font-semibold" />
              </div>

              <div className="hidden md:block"></div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Customer <span className="text-rose-500">*</span></Label>
                <Select value={customer} onValueChange={setCustomer}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue placeholder="Choose Customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {availableCustomers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Site Name <span className="text-rose-500">*</span></Label>
                <Select value={site} onValueChange={setSite}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue placeholder="Choose Site" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {availableSites.map((s, idx) => (
                      <SelectItem key={idx} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden md:block"></div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Grade <span className="text-rose-500">*</span></Label>
                <div className="flex gap-1">
                  <Input
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    placeholder="Grade"
                    className="f-input bg-white border-slate-200 text-slate-700 font-semibold flex-1"
                  />
                  <Select value={availableProducts.some(p => p.id === grade || p.name === grade) ? (availableProducts.find(p => p.name === grade)?.id || grade) : ""} onValueChange={setGrade}>
                    <SelectTrigger className="bg-white border-slate-200 text-slate-700 font-semibold h-10 w-10 shrink-0 px-1">
                      <span className="text-[10px]">▼</span>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-700">
                      {availableProducts.map(p => (
                        <SelectItem key={p.id} value={p.id || p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Amount</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="f-input bg-white border-slate-200 text-slate-700 font-mono" />
              </div>

              <div className="hidden md:block"></div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Vehicle No <span className="text-rose-500">*</span></Label>
                <Select value={vehicleNo} onValueChange={setVehicleNo}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue placeholder="Choose Vehicle" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {availableVehicles.length > 0 ? (
                      availableVehicles.map(v => (
                        <SelectItem key={v.id} value={v.reg}>{v.reg}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty" disabled>No vehicles registered</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Driver Name</Label>
                <Select value={driver} onValueChange={setDriver}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue placeholder="Choose Driver" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {availableDrivers.length > 0 ? (
                      availableDrivers.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty" disabled>No drivers registered</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Bill No</Label>
                <Input value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="Enter Bill No" className="f-input bg-white border-slate-200 text-slate-700 font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-amber-600">Empty Weight (Tons)</Label>
                <Input 
                  type="number"
                  value={emptyWeight} 
                  onChange={(e) => setEmptyWeight(e.target.value)}
                  placeholder="Enter Empty Weight in Tons"
                  className="f-input bg-amber-50 border-amber-200 text-amber-700 placeholder:text-amber-300 font-mono font-bold" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-emerald-600">Loaded Weight (Tons) <span className="text-rose-500">*</span></Label>
                <Input 
                  type="number"
                  value={loadedWeight}
                  onChange={(e) => setLoadedWeight(e.target.value)}
                  placeholder="Enter Loaded Weight in Tons" 
                  className="f-input bg-white border-emerald-200 text-emerald-700 placeholder:text-emerald-300 font-mono font-bold shadow-[0_0_10px_rgba(16,185,129,0.05)]" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-400">Net Weight (Tons)</Label>
                <Input 
                  value={Math.max(0, (Number(loadedWeight) || 0) - (Number(emptyWeight) || 0)).toFixed(3)} 
                  readOnly 
                  className="f-input bg-slate-50 border-slate-200 text-slate-400 font-mono font-bold" 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-10 border-t border-slate-100 pt-6">
              <Button onClick={handleSave} className="btn-primary px-10 h-11 gap-2 shadow-lg shadow-orange-500/20">
                <Save className="h-4 w-4" /> SAVE WEIGHMENT
              </Button>
              <Button onClick={handleClear} variant="outline" className="bg-white border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 px-10 h-11 gap-2 transition-all font-black text-[10px] uppercase tracking-widest">
                <RotateCcw className="h-4 w-4" /> CLEAR
              </Button>
            </div>
          </div>
        </div>

        {/* Info Sidebar Section */}
        <div className="lg:col-span-4">
          <div className="glass-card overflow-hidden border-white/80 shadow-xl">
            <div className="bg-slate-50 p-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-[#ea580c]" />
                <span className="font-black text-slate-800 text-[10px] uppercase tracking-widest">Ticket Summary</span>
              </div>
              <Settings className="h-4 w-4 text-slate-300 cursor-pointer hover:text-slate-600 transition-colors" />
            </div>
            <div className="flex flex-col">
              {ticketDetails.map((item, idx) => (
                <div key={idx} className="flex border-b border-slate-50 last:border-0 group">
                  <div className="w-32 bg-slate-50/50 text-slate-500 p-3 text-[9px] font-black uppercase tracking-wider flex items-center border-r border-slate-50">
                    {item.label}
                  </div>
                  <div className="flex-1 p-3 text-slate-800 text-xs font-bold bg-white group-hover:bg-slate-50 transition-colors">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-orange-50/40/30 text-[9px] text-[#ea580c] leading-relaxed italic font-semibold">
              Verification info: This data is synced with the plant's automated weigh-bridge system. Please verify vehicle number before saving.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
