"use strict";

const express = require("express");
const path = require("path");
const { MongoClient, ServerApiVersion } = require("mongodb");

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = "banana_clicker";
const COLLECTION = "leaderboard";

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let db;

async function connectMongo() {
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await client.connect();
  db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);
  try {
    await col.dropIndex("name_1");
  } catch {
    // index absent ou déjà supprimé
  }
  await col.createIndex(
    { playerId: 1 },
    { unique: true, background: true, sparse: true }
  );
  await col.createIndex(
    { score: -1, createdAt: -1 },
    { background: true }
  );
  console.log(`MongoDB connecté : ${MONGO_URI}/${DB_NAME}`);
}

// GET /api/leaderboard — top 10
app.get("/api/leaderboard", async (_req, res) => {
  try {
    const entries = await db
      .collection(COLLECTION)
      .find({}, { projection: { _id: 0, name: 1, score: 1, prestigePoints: 1, createdAt: 1 } })
      .sort({ score: -1, createdAt: -1 })
      .limit(10)
      .toArray();
    res.json({ ok: true, entries });
  } catch (err) {
    console.error("GET /api/leaderboard :", err);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// POST /api/leaderboard — soumettre un score
app.post("/api/leaderboard", async (req, res) => {
  try {
    const { playerId, name, score, lifetimeClicks, prestigePoints } = req.body;

    if (typeof playerId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId)) {
      return res.status(400).json({ ok: false, error: "Identifiant joueur invalide" });
    }
    if (typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "Pseudo invalide" });
    }
    if (typeof score !== "number" || !isFinite(score) || score < 0) {
      return res.status(400).json({ ok: false, error: "Score invalide" });
    }

    const cleanName = name.trim().slice(0, 32);
    const cleanScore = Math.floor(score);
    const cleanClicks = typeof lifetimeClicks === "number" && isFinite(lifetimeClicks) ? Math.floor(lifetimeClicks) : 0;
    const cleanPrestige = typeof prestigePoints === "number" && isFinite(prestigePoints) ? Math.floor(prestigePoints) : 0;

    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { playerId },
      {
        $max: { score: cleanScore },
        $set: { name: cleanName, lifetimeClicks: cleanClicks, prestigePoints: cleanPrestige, updatedAt: new Date() },
        $setOnInsert: { playerId, createdAt: new Date() },
      },
      { upsert: true, returnDocument: "after" }
    );

    const updated = result && result.score === cleanScore;
    res.status(200).json({ ok: true, updated });
  } catch (err) {
    console.error("POST /api/leaderboard :", err.message);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Banana Clicker → http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Impossible de se connecter à MongoDB :", err.message);
    process.exit(1);
  });
