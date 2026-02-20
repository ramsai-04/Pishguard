import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles: Record<string, string> = {
  '/': 'URL Scanner',
  '/history': 'Scan History',
  '/dashboard': 'Dashboard',
  '/safe-sites': 'Safe Sites',
  '/fake-sites': 'Fake Sites',
  '/categories': 'Categories',
  '/safety-center': 'Safety Center',
  '/about': 'About PhishGuard',
  '/privacy': 'Privacy & Safety',
};

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'PhishGuard';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
