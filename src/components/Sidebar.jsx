import React from 'react';
import { Shield, BookOpen, LayoutDashboard, Users } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="sidebar">
      {/* Brand Logo Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box glow-emerald">
          <Shield className="icon-md" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none text-white tracking-wide">TBH-ES</h1>
          <span className="brand-title">Tome Bug Hunter</span>
        </div>
      </div>

      {/* Navigation Options */}
      <nav className="sidebar-nav">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`sidebar-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard className="icon-sm" />
          Dashboard Simulator
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`sidebar-nav-btn ${activeTab === 'docs' ? 'active' : ''}`}
        >
          <BookOpen className="icon-sm" />
          Knowledge Base
        </button>
      </nav>

      {/* Team Profile (Easter Egg from User request) */}
      <div className="sidebar-team-section">
        <div className="team-title">
          <Users className="icon-sm" />
          <span>Project Team</span>
        </div>
        
        <div className="team-list">
          <div className="team-card">
            <span>Senior Manager</span>
            <span className="role-badge badge-lead">Lead</span>
          </div>
          <div className="team-card">
            <span>Senior Dev (You)</span>
            <span className="role-badge badge-code">Code</span>
          </div>
          <div className="team-card">
            <span>Senior Engineer</span>
            <span className="role-badge badge-arch">Arch</span>
          </div>
          <div className="team-card">
            <span>Full Stack Dev</span>
            <span className="role-badge badge-stack">Stack</span>
          </div>
          <div className="team-card">
            <span>QA Engineer</span>
            <span className="role-badge badge-verify">Verify</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
