import React from 'react';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';

const Layout = ({ children, hideSidebar = false, isLanding = false }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className={`min-h-screen ${isLanding ? 'bg-transparent' : 'app-shell'}`}>
      <Navbar isLanding={isLanding} onMenuToggle={() => setSidebarOpen((open) => !open)} />
      {!hideSidebar && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      
      <main className={`${!isLanding ? 'pt-[72px]' : ''} min-h-screen ${!hideSidebar ? 'md:ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
