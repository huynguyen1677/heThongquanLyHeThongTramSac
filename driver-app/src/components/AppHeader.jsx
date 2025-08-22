import React from 'react';
import UserProfile from './UserProfile';

const AppHeader = ({ onMenuClick, user, onSignOut, onLocationUpdate }) => (
  <>
    <style>
      {`
      .app-header {
        position: sticky;
        top: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 72px;
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #10b981 100%);
        color: #fff;
        padding: 0 2rem;
        box-shadow: 0 4px 20px rgba(30, 64, 175, 0.15);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .app-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
        pointer-events: none;
      }
      
      .app-header-left {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        position: relative;
        z-index: 1;
      }
      
      .app-header-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      
      .app-header-logo {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        transition: all 0.3s ease;
      }
      
      .app-header-logo:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
      }
      
      .app-header-logo-icon {
        width: 24px;
        height: 24px;
        color: white;
      }
      
      .app-header-title {
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.025em;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .app-header-subtitle {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 500;
        margin-top: -2px;
        letter-spacing: 0.05em;
      }
      
      .app-header-menu-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 0.75rem;
        border-radius: 12px;
        transition: all 0.3s ease;
        color: inherit;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
      }
      
      .app-header-menu-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s ease;
      }
      
      .app-header-menu-btn:hover::before {
        left: 100%;
      }
      
      .app-header-menu-btn:hover,
      .app-header-menu-btn:focus {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        outline: none;
      }
      
      .app-header-menu-btn:active {
        transform: translateY(0);
      }
      
      .app-header-menu-icon {
        width: 20px;
        height: 20px;
        display: block;
        transition: transform 0.3s ease;
        position: relative;
        z-index: 1;
      }
      
      .app-header-menu-btn:hover .app-header-menu-icon {
        transform: rotate(90deg);
      }
      
      .app-header-right {
        position: relative;
        z-index: 1;
      }
      
      /* Mobile Responsive */
      @media (max-width: 768px) {
        .app-header {
          height: 64px;
          padding: 0 1rem;
        }
        
        .app-header-left {
          gap: 1rem;
        }
        
        .app-header-logo {
          width: 36px;
          height: 36px;
        }
        
        .app-header-logo-icon {
          width: 20px;
          height: 20px;
        }
        
        .app-header-title {
          font-size: 1.25rem;
        }
        
        .app-header-subtitle {
          display: none;
        }
        
        .app-header-menu-btn {
          padding: 0.5rem;
        }
      }
      
      @media (max-width: 480px) {
        .app-header {
          padding: 0 0.75rem;
        }
        
        .app-header-title {
          font-size: 1.125rem;
        }
      }
      `}
    </style>
    <header className="app-header">
      <div className="app-header-left">
        <button
          onClick={onMenuClick}
          className="app-header-menu-btn"
          aria-label="Mở menu"
        >
          <svg className="app-header-menu-icon" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="app-header-brand">
          <div className="app-header-logo">
            <svg className="app-header-logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="app-header-title">EV Driver</div>
            <div className="app-header-subtitle">Charging Made Easy</div>
          </div>
        </div>
      </div>
      
      <div className="app-header-right">
        <UserProfile
          user={user}
          onSignOut={onSignOut}
          onLocationUpdate={onLocationUpdate}
        />
      </div>
    </header>
  </>
);

export default AppHeader;