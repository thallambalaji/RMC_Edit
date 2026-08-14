import { Router, type IRouter } from "express";

const router: IRouter = Router();

// Official GST API base URL
const GST_API_BASE = "https://api.gst.gov.in/enriched/prd/v1/taxpayerSearch";

// GSTIN format: 2 digit state code + 10 char PAN + 1 entity number + 1 Z + 1 checksum
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * GET /api/verify-gstin/:gstin
 * Verifies a GSTIN against the official GST government API.
 * Falls back to a structure-based check if no API key is configured.
 */
router.get("/verify-gstin/:gstin", async (req, res): Promise<void> => {
  const { gstin } = req.params;
  const gstinUpper = gstin?.trim().toUpperCase();

  // Step 1: Basic format validation
  if (!gstinUpper || gstinUpper.length !== 15) {
    res.status(400).json({
      valid: false,
      error: "GSTIN must be exactly 15 alphanumeric characters.",
    });
    return;
  }

  if (!GSTIN_REGEX.test(gstinUpper)) {
    res.status(400).json({
      valid: false,
      error: "Invalid GSTIN format. Please check and re-enter the GSTIN.",
    });
    return;
  }

  // Step 2: Extract embedded data from GSTIN structure
  const stateCode = gstinUpper.substring(0, 2);
  const pan = gstinUpper.substring(2, 12);

  const STATE_MAP: Record<string, string> = {
    "01": "JAMMU AND KASHMIR",
    "02": "HIMACHAL PRADESH",
    "03": "PUNJAB",
    "04": "CHANDIGARH",
    "05": "UTTARAKHAND",
    "06": "HARYANA",
    "07": "DELHI",
    "08": "RAJASTHAN",
    "09": "UTTAR PRADESH",
    "10": "BIHAR",
    "11": "SIKKIM",
    "12": "ARUNACHAL PRADESH",
    "13": "NAGALAND",
    "14": "MANIPUR",
    "15": "MIZORAM",
    "16": "TRIPURA",
    "17": "MEGHALAYA",
    "18": "ASSAM",
    "19": "WEST BENGAL",
    "20": "JHARKHAND",
    "21": "ODISHA",
    "22": "CHATTISGARH",
    "23": "MADHYA PRADESH",
    "24": "GUJARAT",
    "26": "DADRA AND NAGAR HAVELI AND DAMAN AND DIU",
    "27": "MAHARASHTRA",
    "28": "ANDHRA PRADESH (BEFORE DIVISION)",
    "29": "KARNATAKA",
    "30": "GOA",
    "31": "LAKSHADWEEP",
    "32": "KERALA",
    "33": "TAMIL NADU",
    "34": "PUDUCHERRY",
    "35": "ANDAMAN AND NICOBAR ISLANDS",
    "36": "TELANGANA",
    "37": "ANDHRA PRADESH",
    "38": "LADAKH",
    "97": "OTHER TERRITORY",
    "99": "CENTRE JURISDICTION",
  };

  const resolvedState = STATE_MAP[stateCode] || "UNKNOWN";

  // Step 3: Try official or custom GST API if configured
  const apiKey = process.env.GSTIN_API_KEY;
  const apiUrl = process.env.GSTIN_API_URL;
  const apiSecret = process.env.GSTIN_API_SECRET;
  const apiProvider = process.env.GSTIN_API_PROVIDER;

  const isSandbox = apiProvider === "sandbox.co.in" || (apiUrl && apiUrl.includes("sandbox.co.in")) || Boolean(apiSecret);

  if (apiKey || apiUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      if (isSandbox && apiKey) {
        // --- Sandbox.co.in API Flow ---
        const authRes = await fetch("https://api.sandbox.co.in/authenticate", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "x-api-secret": apiSecret || "",
            "x-api-version": "1.0",
            "Accept": "application/json",
          },
          signal: controller.signal,
        });

        if (authRes.ok) {
          const authData = await authRes.json() as any;
          const token = authData?.access_token || authData?.data?.access_token;

          if (token) {
            const searchUrl = (apiUrl && apiUrl.includes("gstin"))
              ? apiUrl.trim()
              : "https://api.sandbox.co.in/gst/compliance/public/gstin/search";

            const response = await fetch(searchUrl, {
              method: "POST",
              headers: {
                "x-api-key": apiKey,
                "authorization": token,
                "x-api-version": "1.0",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ gstin: gstinUpper }),
              signal: controller.signal,
            });

            clearTimeout(timeout);

            const resJson = await response.json() as any;

            if (response.ok) {
              const innerData = resJson?.data;
              if (innerData?.message === "No records found" || innerData?.error_cd === "FO8000") {
                res.json({
                  valid: false,
                  verified: true,
                  gstin: gstinUpper,
                  error: "GSTIN not found in GST portal. This GSTIN is not registered.",
                  source: "sandbox_co_in",
                });
                return;
              }

              const taxpayer = innerData?.data || innerData || resJson?.taxpayerInfo;
              if (taxpayer && (taxpayer.lgnm || taxpayer.tradeNam || taxpayer.legalName)) {
                let address = "";
                if (taxpayer?.pradr?.addr) {
                  const a = taxpayer.pradr.addr;
                  const parts = [a.bno, a.bnm, a.flno, a.st, a.loc, a.dst, a.stcd, a.pncd].filter(Boolean);
                  address = parts.join(", ");
                } else if (typeof taxpayer?.pradr === "string") {
                  address = taxpayer.pradr;
                }

                res.json({
                  valid: true,
                  verified: true,
                  gstin: gstinUpper,
                  pan,
                  state: resolvedState,
                  legalName: taxpayer.lgnm || taxpayer.legalName || taxpayer.tradeNam || "",
                  tradeName: taxpayer.tradeNam || taxpayer.tradeName || taxpayer.lgnm || "",
                  status: taxpayer.sts || taxpayer.status || "ACTIVE",
                  businessType: taxpayer.dty || taxpayer.ctb || taxpayer.constitutionOfBusiness || "",
                  registrationDate: taxpayer.rgdt || taxpayer.registrationDate || "",
                  address,
                  source: "sandbox_co_in",
                });
                return;
              }
            } else if (response.status === 400 && resJson?.message === "Invalid GSTIN pattern") {
              clearTimeout(timeout);
              res.json({
                valid: false,
                verified: true,
                gstin: gstinUpper,
                error: "Invalid GSTIN checksum or pattern according to government portal.",
                source: "sandbox_co_in",
              });
              return;
            }
          }
        }
      }

      // --- Generic / Standard Official GST API Flow ---
      let requestUrl = "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };

      if (apiUrl) {
        const base = apiUrl.trim();
        const separator = base.includes("?") ? "&" : "?";
        requestUrl = `${base}${separator}gstin=${gstinUpper}&action=TP`;

        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
          headers["x-api-key"] = apiKey;
        }
      } else {
        requestUrl = `${GST_API_BASE}/${gstinUpper}`;
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }
      }

      const response = await fetch(requestUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json() as any;
        const taxpayer = data?.taxpayerInfo || data?.data || data;

        let address = "";
        if (taxpayer?.pradr) {
          if (typeof taxpayer.pradr === "string") {
            address = taxpayer.pradr;
          } else {
            const adrObj = taxpayer.pradr.adr || taxpayer.pradr;
            if (typeof adrObj === "string") {
              address = adrObj;
            } else if (typeof adrObj === "object") {
              const parts = [
                adrObj.bno, adrObj.bnm, adrObj.st, adrObj.loc, adrObj.dst, adrObj.stcd, adrObj.pn,
              ].filter(Boolean);
              address = parts.join(", ");
            }
          }
        }

        res.json({
          valid: true,
          verified: true,
          gstin: gstinUpper,
          pan,
          state: resolvedState,
          legalName: taxpayer?.lgnm || taxpayer?.legalName || taxpayer?.legal_name || "",
          tradeName: taxpayer?.tradeNam || taxpayer?.tradeName || taxpayer?.trade_name || "",
          status: taxpayer?.sts || taxpayer?.status || "ACTIVE",
          businessType: taxpayer?.dty || taxpayer?.constitutionOfBusiness || taxpayer?.ctb || "",
          registrationDate: taxpayer?.rgdt || taxpayer?.registrationDate || "",
          address: address || taxpayer?.address || "",
          source: apiUrl ? "custom_gst_api" : "official_gst_api",
        });
        return;
      }

      if (response.status === 404) {
        res.status(200).json({
          valid: false,
          verified: true,
          gstin: gstinUpper,
          error: "GSTIN not found in GST portal. This GSTIN is not registered.",
          source: apiUrl ? "custom_gst_api" : "official_gst_api",
        });
        return;
      }

      console.warn(`GST API returned ${response.status} for GSTIN ${gstinUpper}`);

    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.warn("GST API timeout for GSTIN:", gstinUpper);
      } else {
        console.error("GST API error:", err?.message);
      }
    }
  }

  // Step 4: Fallback — return structure-based result (format valid, not live-verified)
  res.json({
    valid: true,
    verified: false, // Indicates: format OK but NOT live-verified (no API key or API failed)
    gstin: gstinUpper,
    pan,
    state: resolvedState,
    legalName: "",
    tradeName: "",
    status: "UNKNOWN",
    businessType: "",
    registrationDate: "",
    source: "structure_check",
    warning: (apiKey || apiUrl)
      ? "Live GST API is temporarily unavailable. Format is valid but registration could not be confirmed."
      : "No GST API URL or key configured. Format is valid but live verification is disabled. Set GSTIN_API_URL and GSTIN_API_KEY in .env to enable real verification.",
  });
});

export default router;
