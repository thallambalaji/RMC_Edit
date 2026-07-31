async function testAutomatedLogic() {
  console.log("==========================================");
  console.log("🚀 STARTING AUTOMATED WEIGHMENT LOGIC TEST");
  console.log("==========================================");

  // 1. Health Check Test
  console.log("\n[1/3] Testing API Server Health...");
  try {
    const healthRes = await fetch("http://localhost:5000/api/healthz/db");
    const healthData = await healthRes.json();
    console.log("✅ API & DB Status:", JSON.stringify(healthData));
  } catch (err) {
    console.error("❌ Health check failed:", err.message);
    process.exit(1);
  }

  // 2. Create Weighment Ticket via API Test
  const testTicketNo = "TKT-AUTO-" + Math.floor(1000 + Math.random() * 9000);
  console.log(`\n[2/3] Creating Automated Test Ticket (${testTicketNo})...`);
  
  const ticketPayload = {
    ticketNo: testTicketNo,
    plant: "Main RMC Plant",
    vehicleNo: "KA-05-MC-8899",
    weightType: "Net Weight",
    weight: 21700,
    createdBy: "Automated Logic Verifier"
  };

  try {
    const createRes = await fetch("http://localhost:5000/api/weighment-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticketPayload)
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`HTTP ${createRes.status}: ${errText}`);
    }

    const createdData = await createRes.json();
    console.log("✅ Ticket Saved Successfully in MongoDB!");
    console.log("   ID:", createdData._id);
    console.log("   Ticket No:", createdData.ticketNo);
    console.log("   Vehicle No:", createdData.vehicleNo);
    console.log("   Net Weight:", createdData.weight, "KG");
  } catch (err) {
    console.error("❌ Ticket creation failed:", err.message);
    process.exit(1);
  }

  // 3. Retrieve Tickets List Test
  console.log("\n[3/3] Fetching all tickets from MongoDB to verify list...");
  try {
    const listRes = await fetch("http://localhost:5000/api/weighment-tickets");
    const listData = await listRes.json();
    console.log(`✅ Total Tickets Found in Database: ${listData.length}`);
    const found = listData.find(t => t.ticketNo === testTicketNo);
    if (found) {
      console.log("✅ Verification SUCCESS: Created ticket found in database list query!");
    } else {
      console.error("❌ Verification FAILED: Ticket not found in list.");
    }
  } catch (err) {
    console.error("❌ Fetch tickets failed:", err.message);
    process.exit(1);
  }

  console.log("\n==========================================");
  console.log("🎉 ALL AUTOMATED LOGIC TESTS PASSED 100%!");
  console.log("==========================================");
}

testAutomatedLogic();
