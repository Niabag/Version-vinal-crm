export const DEFAULT_DEVIS = {
  logoUrl: "",
  title: "Devis",
  description: "",
  amount: 0,
  clientId: "",
  entrepriseName: "Votre Entreprise",
  entrepriseAddress: "123 Rue Exemple",
  entrepriseCity: "75000 Paris",
  entreprisePhone: "01 23 45 67 89",
  entrepriseEmail: "contact@votre-entreprise.com",
  dateDevis: new Date().toISOString().slice(0, 10),
  dateValidite: (() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  })(),
  devisNumber: `DEV-${Date.now().toString().slice(-6)}`,
  status: "nouveau",
  conditions: "• Devis valable 30 jours à compter de sa date d'émission\n• Acompte de 30% à la commande\n• Règlement à 30 jours fin de mois\n• TVA non applicable, art. 293 B du CGI",
  footerText: "",
  articles: [
    {
      description: "Prestation / Article",
      unitPrice: "0",
      quantity: "1",
      unit: "u",
      tvaRate: "20"
    }
  ]
};