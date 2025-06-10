import React from 'react';
import './ActionButtons.scss';

const ActionButtons = ({ actions, onWebsiteVisit, onDownload }) => {
  if (!actions || actions.length === 0) return null;
  
  return (
    <div className="actions-manual">
      {actions
        .filter(action => action.active)
        .sort((a, b) => (a.order || 1) - (b.order || 1))
        .map((action, index) => (
          <div key={action.id || index} className="action-manual-item">
            {action.type === 'website' && (
              <button 
                onClick={onWebsiteVisit}
                className="action-btn website-btn"
              >
                <span className="btn-icon">🌐</span>
                <span className="btn-text">Visiter notre site web</span>
              </button>
            )}
            
            {action.type === 'download' && (
              <button 
                onClick={onDownload}
                className="action-btn download-btn"
              >
                <span className="btn-icon">📥</span>
                <span className="btn-text">Télécharger notre carte de visite</span>
              </button>
            )}
          </div>
        ))}
    </div>
  );
};

export default ActionButtons;