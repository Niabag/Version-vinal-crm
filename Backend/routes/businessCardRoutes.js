const express = require("express");
const {
  saveBusinessCard,
  getBusinessCard,
  deleteBusinessCard,
  updateCardConfig,
  getPublicBusinessCard // ✅ NOUVEAU: Importer la nouvelle fonction
} = require("../controllers/businessCardController");
const authMiddleware = require("../middleware/auth");
const { checkSubscription } = require("../middleware/subscription");

const router = express.Router();

// 📌 Route publique pour récupérer la carte de visite par userId (sans authentification)
router.get("/public/:userId", getPublicBusinessCard); // ✅ NOUVEAU

// 📌 Sauvegarder/mettre à jour la carte de visite
router.post("/", authMiddleware, checkSubscription, saveBusinessCard);

// 📌 Récupérer la carte de visite de l'utilisateur authentifié
router.get("/", authMiddleware, checkSubscription, getBusinessCard);

// 📌 Mettre à jour seulement la configuration
router.patch("/config", authMiddleware, checkSubscription, updateCardConfig);

// 📌 Supprimer la carte de visite
router.delete("/", authMiddleware, checkSubscription, deleteBusinessCard);

module.exports = router;

