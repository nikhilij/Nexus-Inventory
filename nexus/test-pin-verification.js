// test-pin-verification.js
// Simple test script to verify PIN verification API

async function testPinVerification() {
   console.log("Testing PIN Verification API...\n");

   try {
      // Test 1: Valid PIN
      console.log("Test 1: Valid PIN (123456)");
      const validResponse = await fetch("http://localhost:3000/api/validate-pin", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ pin: "123456" }),
      });

      const validResult = await validResponse.json();
      console.log("Status:", validResponse.status);
      console.log("Response:", validResult);

      if (validResult.ok) {
         console.log("✅ Valid PIN test passed\n");
      } else {
         console.log("❌ Valid PIN test failed\n");
      }

      // Test 2: Invalid PIN
      console.log("Test 2: Invalid PIN (000000)");
      const invalidResponse = await fetch("http://localhost:3000/api/validate-pin", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ pin: "000000" }),
      });

      const invalidResult = await invalidResponse.json();
      console.log("Status:", invalidResponse.status);
      console.log("Response:", invalidResult);

      if (!invalidResult.ok && invalidResult.error === "Invalid PIN") {
         console.log("✅ Invalid PIN test passed\n");
      } else {
         console.log("❌ Invalid PIN test failed\n");
      }

      // Test 3: Check verification status
      console.log("Test 3: Check verification status");
      const statusResponse = await fetch("http://localhost:3000/api/validate-pin");
      const statusResult = await statusResponse.json();
      console.log("Status:", statusResponse.status);
      console.log("Response:", statusResult);
      console.log("✅ Status check completed\n");

      // Test 4: Clear verification
      console.log("Test 4: Clear PIN verification");
      const clearResponse = await fetch("http://localhost:3000/api/validate-pin/clear", {
         method: "POST",
      });
      const clearResult = await clearResponse.json();
      console.log("Status:", clearResponse.status);
      console.log("Response:", clearResult);

      if (clearResult.ok) {
         console.log("✅ Clear verification test passed\n");
      } else {
         console.log("❌ Clear verification test failed\n");
      }
   } catch (error) {
      console.error("❌ Test failed with error:", error.message);
   }
}

// Instructions
console.log("PIN Verification Test Script");
console.log("===========================");
console.log("");
console.log("To run this test:");
console.log("1. Start your Next.js development server: npm run dev");
console.log("2. Run this script: node test-pin-verification.js");
console.log("");
console.log("Note: Make sure the server is running on http://localhost:3000");
console.log("");

// Uncomment the line below to run the test
testPinVerification();
