import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Mock M-Pesa STK Push
  app.post("/api/verify-mpesa", async (req, res) => {
    const { phone } = req.body;
    console.log(`Triggering mock STK push for ${phone}`);
    
    // In a real app, you'd call Safaricom Daraja API here
    // For now, we simulate a success after a short delay
    setTimeout(() => {
      // This would normally be handled by a webhook from Safaricom
      console.log(`Mock STK push successful for ${phone}`);
    }, 2000);

    res.json({ 
      success: true, 
      merchantRequestId: "mock-request-id-" + Date.now(),
      checkoutRequestId: "mock-checkout-id-" + Date.now(),
      message: "Success. Please check your phone for the STK push."
    });
  });

  // Mock M-Pesa Status Check
  app.get("/api/verify-status/:requestId", (req, res) => {
    // Simulate verification success
    res.json({ 
      status: "verified",
      name: "JOHN DOE", // In reality, this comes from Daraja verification response
      verified: true
    });
  });

  // Loan Scoring Logic
  app.post("/api/loan-score", (req, res) => {
    const { fulizaLimit, hustlerFundLimit, accountAge, hasAltPhone } = req.body;
    
    // Formula: Score = (Fuliza Limit × 0.4) + (Hustler Fund Limit × 0.3) + (Account Age × 0.2) + (Alt Phone Bonus × 0.1)
    const score = (fulizaLimit * 0.4) + (hustlerFundLimit * 0.3) + (accountAge * 10 * 0.2) + (hasAltPhone ? 500 : 0);
    
    // Maximum loan amount is roughly 1/3 of the score
    const approvedAmount = Math.floor(score / 3 / 100) * 100;

    res.json({
      approvedAmount,
      interestRate: 0.16,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
