import React from 'react';

export const DetailedDCPrintTemplate = ({ inv, type }: { inv: any, type: "ORIGINAL" | "DUPLICATE" }) => {
  const borderStyle = "1.5px solid #000";
  const cellStyle: React.CSSProperties = { padding: "4px 6px", border: borderStyle, fontSize: "11px", color: "#000" };
  const labelStyle: React.CSSProperties = { ...cellStyle, fontWeight: "bold", width: "35%" };

  return (
    <div style={{ width: "49%", boxSizing: "border-box", fontFamily: "Arial, sans-serif" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", border: borderStyle }}>
        <tbody>
          {/* Header Row */}
          <tr>
            <td colSpan={2} style={{ borderBottom: borderStyle, padding: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "11px", padding: "0 10px" }}>
                <span style={{ margin: "0 auto", paddingLeft: "50px" }}>DELIVERY CHALLAN</span>
                <span>{type}</span>
              </div>
            </td>
          </tr>
          
          {/* Company Info Row */}
          <tr>
            <td style={{ width: "35%", borderRight: borderStyle, padding: "10px", textAlign: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img src="/fortune_concrete_logo.png" alt="Logo" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
                <span style={{ fontWeight: "bold", fontSize: "10px", marginTop: "4px" }}>FORTUNE CONCRETE</span>
              </div>
            </td>
            <td style={{ width: "65%", padding: "0", verticalAlign: "top" }}>
              <div style={{ textAlign: "center", fontSize: "20px", fontWeight: "bold", margin: "10px 0" }}>
                Fortune Concrete
              </div>
              <table style={{ width: "100%", fontSize: "10px", fontWeight: "bold", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "2px 8px", width: "25%" }}>Address :</td>
                    <td colSpan={3} style={{ padding: "2px 8px" }}></td>
                  </tr>
                  <tr><td colSpan={4} style={{ height: "14px" }}></td></tr>
                  <tr>
                    <td style={{ padding: "2px 8px" }}>GSTIN:</td>
                    <td style={{ padding: "2px 8px", width: "25%" }}></td>
                    <td style={{ padding: "2px 8px", width: "20%" }}>PAN no :</td>
                    <td style={{ padding: "2px 8px" }}></td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 8px" }}>Phone No :</td>
                    <td style={{ padding: "2px 8px" }}></td>
                    <td style={{ padding: "2px 8px" }}>Email :</td>
                    <td style={{ padding: "2px 8px" }}></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          
          {/* Content Rows */}
          <tr>
            <td style={{ ...cellStyle, verticalAlign: "top", height: "50px" }}>
              <div style={{ fontWeight: "bold" }}>Customer Name & Billing Address :</div>
              <div style={{ marginTop: "4px" }}>{inv?.customerName || ""}</div>
            </td>
            <td style={{ padding: 0, border: borderStyle, borderTop: "none", borderBottom: "none" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={labelStyle}>DC No</td>
                    <td style={cellStyle}>: {inv?.invoiceNumber ? inv.invoiceNumber.split('/').pop() : "—"}</td>
                  </tr>
                  <tr>
                    <td style={labelStyle}>DC Date</td>
                    <td style={cellStyle}>: {inv?.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : ""}</td>
                  </tr>
                  <tr>
                    <td style={labelStyle}>PO No</td>
                    <td style={cellStyle}>: {inv?.poNumber || ""}</td>
                  </tr>
                  <tr>
                    <td style={{...labelStyle, borderBottom: "none"}}>Cumulative Load</td>
                    <td style={{...cellStyle, borderBottom: "none"}}>: 1</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style={{ ...cellStyle, verticalAlign: "top", height: "50px" }}>
              <div style={{ fontWeight: "bold" }}>Site Address :</div>
              <div style={{ marginTop: "4px" }}>{inv?.site || ""}</div>
            </td>
            <td style={{ padding: 0, border: borderStyle, borderTop: "none", borderBottom: "none" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={labelStyle}>Sales Executive</td>
                    <td style={cellStyle}>: </td>
                  </tr>
                  <tr>
                    <td style={labelStyle}>Driver Name</td>
                    <td style={cellStyle}>: {inv?.driverName || ""}</td>
                  </tr>
                  <tr>
                    <td style={labelStyle}>Ordered Qty(CUM)</td>
                    <td style={cellStyle}>: {inv?.orderedQty || ""}</td>
                  </tr>
                  <tr>
                    <td style={labelStyle}>Cumulative Qty</td>
                    <td style={cellStyle}>: {inv?.quantity ? Number(inv.quantity).toFixed(2) : ""}</td>
                  </tr>
                  <tr>
                    <td style={{...labelStyle, borderBottom: "none"}}>Pump/Dump</td>
                    <td style={{...cellStyle, borderBottom: "none"}}>: {inv?.pumpType || ""}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style={{ ...cellStyle, fontWeight: "bold" }}>GSTIN NO.</td>
            <td style={{ padding: 0, border: borderStyle }}>
              <table style={{ width: "100%", borderCollapse: "collapse", height: "100%" }}>
                <tbody>
                  <tr>
                    <td style={{ ...cellStyle, fontWeight: "bold", border: "none" }}>Type Of Cement & Grade (If Specified) :</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{...labelStyle, borderTop: "none"}}>Vehicle NO</td>
                    <td style={{...cellStyle, borderTop: "none"}}>: {inv?.vehicleNo || ""}</td>
                  </tr>
                  <tr>
                    <td style={labelStyle}>Grade</td>
                    <td style={cellStyle}>: {inv?.grade || ""}</td>
                  </tr>
                  <tr>
                    <td style={{...labelStyle, borderBottom: "none"}}>Quantity</td>
                    <td style={{...cellStyle, borderBottom: "none"}}>: {inv?.quantity ? Number(inv.quantity).toFixed(2) : ""}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td rowSpan={2} style={{ padding: 0, border: borderStyle }}>
            </td>
          </tr>
          
          <tr>
            <td style={{ ...cellStyle, fontWeight: "bold" }}>Specified Target Slump at Site (Workability) : {inv?.slump || "100+/-25"}</td>
          </tr>

          <tr>
            <td style={{ ...cellStyle, verticalAlign: "top", height: "50px" }}>
              <div style={{ fontWeight: "bold" }}>Time Of Loading : {inv?.invoiceTime || ""}</div>
            </td>
            <td style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", height: "100%" }}>
                <tbody>
                  <tr>
                    <td style={{ ...cellStyle, border: "none", borderBottom: borderStyle, fontWeight: "bold" }}>Time Of Arrival :</td>
                  </tr>
                  <tr>
                    <td style={{ ...cellStyle, border: "none", borderBottom: borderStyle, fontWeight: "bold" }}>Km reading on arrival : {inv?.kmReading || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ ...cellStyle, border: "none", fontWeight: "bold" }}>Km reading on dispatch :</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          
          {/* Signatures row 1 */}
          <tr>
            <td style={{ ...cellStyle, fontWeight: "bold", textAlign: "center", paddingTop: "25px", paddingBottom: "10px" }}>Operator Signature</td>
            <td style={{ ...cellStyle, fontWeight: "bold", textAlign: "center", paddingTop: "25px", paddingRight: "20px", paddingBottom: "10px" }}>
               Signature Of Security Incharge
            </td>
          </tr>

          {/* Caution and Please Note */}
          <tr>
            <td colSpan={2} style={{ ...cellStyle, fontSize: "9px", padding: "6px" }}>
              <div style={{ textDecoration: "underline", fontWeight: "bold", marginBottom: "3px" }}>Caution :</div>
              <div style={{marginBottom: "2px"}}>1. There are possibilites of accident due to unsound scaffolding / stagging / shuttering, please check of soundness.</div>
              <div style={{marginBottom: "2px"}}>2. Avoid physical contact with wet/green concrete so that allergies do not cropup.</div>
              <div style={{marginBottom: "2px"}}>3. Provide footwear, gloves etc.,to the workmen attending concrete work.</div>
              <div style={{marginBottom: "2px"}}>4. As per seller courte jurisdiction</div>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ ...cellStyle, fontSize: "9px", padding: "6px" }}>
              <div style={{ textDecoration: "underline", fontWeight: "bold", marginBottom: "3px" }}>Please Note :</div>
              <div style={{marginBottom: "2px"}}>1. The time allowed for unloading the vehicle is 15 minutes, In case of unloading @1 cum in 2 minutes is not possible,the unloading has to be complete at any cost in 40 minutes, any detection in excess of allowable time shall be charge extra.</div>
              <div style={{marginBottom: "2px"}}>2. We are not responsible for any slump, loss of strength or quality of concrete when water or any other material/chemical have been added on site by or at the request of the customer/customer's representative.</div>
              <div style={{marginBottom: "2px"}}>3. Since graded cement like (OPC 53, OPC 43) are being used, wetting of the concrete surfaces by sprinkiling with water after initial setting time (4-5 hours) is to be done to avoid the possibility of surface cracks due to dehydration of concrete.</div>
              <div style={{marginBottom: "2px"}}>4. In case of complaints please contact our nodal officer available on mobile no :</div>
            </td>
          </tr>

          {/* Bottom Time inputs */}
          <tr>
            <td style={{ ...cellStyle, fontWeight: "bold" }}>Time of arrival at site:</td>
            <td style={{ ...cellStyle, fontWeight: "bold" }}>Discharge completed time :</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, fontWeight: "bold" }}>Pouring Location : Footing/Column/Slab/Others</td>
            <td style={{ ...cellStyle, fontWeight: "bold" }}>Water/Admix added any by supplier</td>
          </tr>
          
          {/* Signatures Row 2 */}
          <tr>
            <td style={{ ...cellStyle, fontWeight: "bold", verticalAlign: "bottom", height: "60px", paddingBottom: "10px" }}>
              Signature of/on behalf of Customer
            </td>
            <td style={{ ...cellStyle, fontWeight: "bold", textAlign: "center", position: "relative", height: "60px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "5px", position: "absolute", bottom: "25px", left: 0, right: 0 }}>
                <img src="/fortune_concrete_stamp.png" alt="Stamp" style={{ width: "45px", height: "45px", objectFit: "contain", opacity: 0.8 }} />
              </div>
              <div style={{ position: "absolute", bottom: "10px", left: 0, right: 0, textAlign: "center" }}>For Fortune Concrete</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
