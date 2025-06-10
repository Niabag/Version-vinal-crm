import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Devis from "../../components/Dashboard/Devis/devisPage";
import DevisListPage from "../../components/Dashboard/Devis/devisListPage";
import ProspectsPage from "../../components/Dashboard/Prospects/prospectsPage";
import Analytics from "../../components/Dashboard/Analytics/analytics";
import Settings from "../../components/Dashboard/Settings/settings";
import Notifications from "../../components/Dashboard/Notifications/notifications";
import BusinessCard from "../../components/Dashboard/BusinessCard/businessCard";
import Billing from "../../components/Dashboard/Billing/billing";
import SubscriptionBanner from "../../components/SubscriptionBanner/Index";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./dashboard.scss";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({});
  const [selectedClientForDevis, setSelectedClientForDevis] = useState(null);
  const [editingDevis, setEditingDevis] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const userMenuRef = useRef(null);

  // Fermer le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Extraire l'ID utilisateur du token JWT
  const decodeToken = (token) => {
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = atob(payloadBase64);
      return JSON.parse(payload);
    } catch (error) {
      console.error("Erreur lors du décodage du token:", error);
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = decodeToken(token);
      if (decodedToken && decodedToken.userId) {
        setUserId(decodedToken.userId);
      } else {
        console.error("❌ Impossible de décoder userId du token");
      }
    } else {
      console.error("❌ Aucun token trouvé");
    }
    
    fetchUserData();
    
    // Vérifier si un onglet est spécifié dans l'URL (hash)
    const hash = location.hash.replace('#', '');
    if (hash && ['dashboard', 'clients', 'devis', 'billing', 'notifications', 'carte', 'settings'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location]);

  const fetchUserData = async () => {
    try {
      const userData = await apiRequest(API_ENDPOINTS.AUTH.ME);
      setUser(userData);
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(API_ENDPOINTS.CLIENTS.BASE);
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur lors de la récupération des clients:", err);
      setError("Erreur lors de la récupération des clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleViewClientDevis = (client) => {
    setSelectedClientForDevis(client);
    setActiveTab("devis-creation");
  };

  const handleEditDevisFromList = (devis) => {
    setEditingDevis(devis);
    setActiveTab("devis-creation");
  };

  const handleCreateNewDevis = () => {
    setEditingDevis(null);
    setSelectedClientForDevis(null);
    // Redirect to prospects page to select a client before creating a quote
    setActiveTab("clients");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Définition des sections de navigation
  const navSections = [
    {
      title: "Principal",
      items: [
        { id: "dashboard", icon: "📊", label: "Tableau de bord" },
        { id: "clients", icon: "👥", label: "Prospects" },
        { id: "devis", icon: "📄", label: "Devis" },
        { id: "billing", icon: "💰", label: "Facturation" },
      ]
    },
    {
      title: "Outils",
      items: [
        { id: "notifications", icon: "🔔", label: "Notifications", badge: unreadNotifications },
        { id: "carte", icon: "💼", label: "Carte de visite" },
      ]
    },
    {
      title: "Compte",
      items: [
        { id: "settings", icon: "⚙️", label: "Paramètres" },
      ]
    }
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard": return "Tableau de bord";
      case "clients": return "Mes Prospects";
      case "devis": return "Mes Devis";
      case "devis-creation": return "Création de Devis";
      case "billing": return "Facturation";
      case "notifications": return "Notifications";
      case "carte": return "Carte de Visite";
      case "settings": return "Paramètres";
      default: return "CRM Pro";
    }
  };

  const getPageIcon = () => {
    switch (activeTab) {
      case "dashboard": return "📊";
      case "clients": return "👥";
      case "devis": return "📄";
      case "devis-creation": return "📝";
      case "billing": return "💰";
      case "notifications": return "🔔";
      case "carte": return "💼";
      case "settings": return "⚙️";
      default: return "📊";
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Subscription Banner */}
      <SubscriptionBanner />
      
      {/* ✅ SIDEBAR MODERNE */}
      <aside className={`dashboard-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo">CRM</div>
            <div className="brand-text">CRM Pro</div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="nav-section">
              <div className="nav-section-title">{section.title}</div>
              
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${
                    activeTab === item.id || 
                    (activeTab === "devis-creation" && item.id === "devis") 
                      ? "active" 
                      : ""
                  }`}
                  onClick={() => {
                    setActiveTab(item.id);
                    // Mettre à jour le hash de l'URL
                    window.location.hash = item.id;
                    if (item.id !== "devis" && item.id !== "devis-creation") {
                      setSelectedClientForDevis(null);
                      setEditingDevis(null);
                    }
                  }}
                  title={item.label}
                >
                  <span className="nav-icon">
                    {item.icon}
                    {item.badge && (
                      <span className="notifications-badge">{item.badge}</span>
                    )}
                  </span>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Développer" : "Réduire"}
        >
          {isSidebarCollapsed ? "→" : "←"}
        </button>
      </aside>

      {/* ✅ CONTENU PRINCIPAL */}
      <main className="dashboard-main">
        {/* ✅ HEADER MODERNE */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="page-title">
              <span>{getPageIcon()}</span> {getPageTitle()}
            </h1>
            <div className="page-breadcrumb">
              <span>CRM Pro</span>
              <span className="breadcrumb-separator">/</span>
              <span>{getPageTitle()}</span>
            </div>
          </div>
          
          <div className="header-right">
            <div className="header-actions">
              <button 
                onClick={() => navigate("/")} 
                className="header-btn"
                title="Retour à l'accueil"
              >
                🏠 Accueil
              </button>
              
              <button 
                className="header-btn primary"
                onClick={() => {
                  if (activeTab === "devis") {
                    handleCreateNewDevis();
                  } else if (activeTab === "clients") {
                    // Ajouter un nouveau prospect
                    navigate("/register-client/" + userId);
                  }
                }}
              >
                ✨ {activeTab === "devis" ? "Nouveau devis" : activeTab === "clients" ? "Nouveau prospect" : "Nouvelle action"}
              </button>
            </div>
            
            <div className="user-profile" onClick={toggleUserMenu} ref={userMenuRef}>
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name || "Utilisateur"}</span>
                <span className="user-email">{user.email || ""}</span>
              </div>
              
              {/* ✅ MENU UTILISATEUR */}
              <div className={`user-menu ${isUserMenuOpen ? 'active' : ''}`}>
                <div className="user-menu-header">
                  <div className="menu-avatar">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <h3 className="menu-user-name">{user.name || "Utilisateur"}</h3>
                  <p className="menu-user-email">{user.email || ""}</p>
                </div>
                
                <div className="user-menu-items">
                  <a href="#settings" className="menu-item" onClick={() => {
                    setActiveTab("settings");
                    setIsUserMenuOpen(false);
                  }}>
                    <span className="menu-item-icon">⚙️</span>
                    <span>Paramètres</span>
                  </a>
                  <a href="#carte" className="menu-item" onClick={() => {
                    setActiveTab("carte");
                    setIsUserMenuOpen(false);
                  }}>
                    <span className="menu-item-icon">💼</span>
                    <span>Ma carte de visite</span>
                  </a>
                  <div className="menu-divider"></div>
                  <button onClick={handleLogout} className="menu-logout">
                    <span className="menu-item-icon">🚪</span>
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ✅ CONTENU DES PAGES */}
        <div className="dashboard-content">
          <div className="content-wrapper">
            {activeTab === "dashboard" && <Analytics />}

            {activeTab === "clients" && (
              <ProspectsPage 
                clients={clients}
                onRefresh={fetchClients}
                onViewClientDevis={handleViewClientDevis}
              />
            )}

            {activeTab === "devis" && (
              <DevisListPage 
                clients={clients}
                onEditDevis={handleEditDevisFromList}
                onCreateDevis={handleCreateNewDevis}
              />
            )}

            {activeTab === "devis-creation" && (
              <Devis 
                clients={clients}
                initialDevisFromClient={editingDevis}
                selectedClientId={selectedClientForDevis?._id}
                onBack={selectedClientForDevis ? () => {
                  setSelectedClientForDevis(null);
                  setEditingDevis(null);
                  setActiveTab("clients");
                } : editingDevis ? () => {
                  setEditingDevis(null);
                  setActiveTab("devis");
                } : null}
              />
            )}

            {activeTab === "billing" && (
              <Billing 
                clients={clients}
                onRefresh={fetchClients}
              />
            )}

            {activeTab === "notifications" && <Notifications />}
            {activeTab === "settings" && <Settings />}
            {activeTab === "carte" && (
              <BusinessCard 
                userId={userId} 
                user={user}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;