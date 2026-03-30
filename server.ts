import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { nanoid } from "nanoid";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Note: In this environment, we use the client config for admin SDK if needed, 
// but usually we can just use the client SDK on the frontend.
// However, the user asked for a full-stack app with REST APIs.
// We'll use the client SDK on the frontend for analytics, 
// but the backend will handle the shortening and redirection.

// Since we don't have a service account key file, we'll use the client SDK 
// or just proxy requests if possible. 
// Actually, for a real full-stack app, we'd need admin access.
// Let's assume we can use the client SDK on the backend too if needed, 
// or just use the REST API of Firebase.
// But wait, the instructions say "Always call Gemini API from the frontend... NEVER call Gemini API from the backend."
// It doesn't say that about Firebase.

// Let's try to use the client SDK on the backend for simplicity in this environment 
// if we can't get admin credentials easily.
// Actually, I'll implement the backend logic using the client SDK for now 
// as it's easier to set up with the provided config.

import { initializeApp as initializeClientApp } from "firebase/app";
import { getFirestore as getClientFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, increment, getDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const clientApp = initializeClientApp(firebaseConfig);
const db = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development/iframe compatibility
  }));
  app.use(morgan("dev"));
  app.use(express.json());

  // Test Firestore connection
  try {
    const testSnapshot = await getDocs(query(collection(db, "urls"), where("shortId", "==", "test-connection")));
    console.log("Firestore connection successful.");
  } catch (error) {
    console.error("Firestore connection failed. Please check your configuration.", error);
  }

  // API: Shorten URL
  app.post("/api/shorten", async (req, res) => {
    const { originalUrl, category, customShortId, expiryDate, aiInsights, campaignId } = req.body;

    if (!originalUrl || !originalUrl.startsWith("http")) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    try {
      // Check if custom shortId is already taken
      if (customShortId) {
        const q = query(collection(db, "urls"), where("shortId", "==", customShortId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          return res.status(400).json({ error: "Custom short ID already taken" });
        }
      }

      const shortId = customShortId || nanoid(5);
      const urlDoc = {
        originalUrl,
        shortId,
        clickCount: 0,
        clickHistory: [], // Array of timestamps
        createdAt: serverTimestamp(),
        category: category || "General",
        expiryDate: expiryDate || null,
        campaignId: campaignId || null,
        aiInsights: aiInsights || null, // { summary: string, safetyScore: number }
      };

      const docRef = await addDoc(collection(db, "urls"), urlDoc);
      res.json({ id: docRef.id, ...urlDoc, shortId });
    } catch (error) {
      console.error("Error shortening URL:", error);
      res.status(500).json({ error: "Failed to shorten URL" });
    }
  });

  // API: Get all URLs
  app.get("/api/urls", async (req, res) => {
    try {
      const querySnapshot = await getDocs(collection(db, "urls"));
      const urls = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          clickHistory: data.clickHistory || [],
        };
      });
      res.json(urls);
    } catch (error) {
      console.error("Error fetching URLs:", error);
      res.status(500).json({ error: "Failed to fetch URLs" });
    }
  });

  // API: Update URL
  app.patch("/api/urls/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
      const docRef = doc(db, "urls", id);
      await updateDoc(docRef, updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating URL:", error);
      res.status(500).json({ error: "Failed to update URL" });
    }
  });

  // API: Delete URL
  app.delete("/api/urls/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const docRef = doc(db, "urls", id);
      await deleteDoc(docRef);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting URL:", error);
      res.status(500).json({ error: "Failed to delete URL" });
    }
  });

  // API: Campaigns
  app.get("/api/campaigns", async (req, res) => {
    try {
      const querySnapshot = await getDocs(collection(db, "campaigns"));
      const campaigns = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    const { name, description, status } = req.body;
    try {
      const campaignDoc = {
        name,
        description: description || "",
        status: status || "active",
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "campaigns"), campaignDoc);
      res.json({ id: docRef.id, ...campaignDoc });
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Redirection: GET /:shortId
  app.get("/:shortId", async (req, res) => {
    const { shortId } = req.params;

    if (shortId.startsWith("api") || shortId.includes(".")) {
      return;
    }

    try {
      const q = query(collection(db, "urls"), where("shortId", "==", shortId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return res.status(404).send("URL not found");
      }

      const urlDoc = querySnapshot.docs[0];
      const data = urlDoc.data();

      // Check expiry
      if (data.expiryDate && new Date(data.expiryDate) < new Date()) {
        return res.status(410).send("This link has expired.");
      }

      const originalUrl = data.originalUrl;

      // Increment click count and add to history
      await updateDoc(doc(db, "urls", urlDoc.id), {
        clickCount: increment(1),
        clickHistory: [...(data.clickHistory || []), new Date().toISOString()]
      });

      res.redirect(originalUrl);
    } catch (error) {
      console.error("Error redirecting:", error);
      res.status(500).send("Internal Server Error");
    }
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
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
