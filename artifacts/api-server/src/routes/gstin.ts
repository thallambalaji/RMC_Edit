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

  if (apiKey || apiUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      let requestUrl = "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };

      if (apiUrl) {
        // Construct the URL for the new API format:
        // GET https://domain-name/commonapi/v1.0/tpstatus?gstin={gstin}&action=TP
        const base = apiUrl.trim();
        const separator = base.includes("?") ? "&" : "?";
        requestUrl = `${base}${separator}gstin=${gstinUpper}&action=TP`;

        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
          headers["x-api-key"] = apiKey;
          headers["client-id"] = apiKey;
          headers["clientid"] = apiKey;
          headers["client_id"] = apiKey;
        }
      } else {
        // Default official GST API endpoint behavior
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
        // Map GST API response fields to our standard format
        const taxpayer = data?.taxpayerInfo || data?.data || data;

        // Smart address builder if address is structured
        let address = "";
        if (taxpayer?.pradr) {
          if (typeof taxpayer.pradr === "string") {
            address = taxpayer.pradr;
          } else {
            const adrObj = taxpayer.pradr.adr || taxpayer.pradr;
            if (typeof adrObj === "string") {
              address = adrObj;
            } else if (typeof adrObj === "object") {
              // Extract fields commonly found in official GST structured address responses
              const parts = [
                adrObj.bno,  // building number
                adrObj.bnm,  // building name
                adrObj.st,   // street
                adrObj.loc,  // locality
                adrObj.dst,  // district
                adrObj.stcd, // state code
                adrObj.pn,   // pincode
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

      // API returned non-OK, non-404 — fall through to structure check
      console.warn(`GST API returned ${response.status} for GSTIN ${gstinUpper}`);

    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.warn("GST API timeout for GSTIN:", gstinUpper);
      } else {
        console.error("GST API error:", err?.message);
      }
      // Fall through to structure-based response
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
