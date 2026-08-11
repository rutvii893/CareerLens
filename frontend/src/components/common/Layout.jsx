import React from 'react';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';

const Layout = ({ children, hideSidebar = false, isLanding = false }) => {
  return (
    <div className={`min-h-screen ${isLanding ? 'bg-transparent' : 'bg-[#f9f9ff]'}`}>
      <Navbar isLanding={isLanding} />
      {!hideSidebar && <Sidebar />}
      
      <main className={`${!isLanding ? 'pt-[64px]' : ''} min-h-screen ${!hideSidebar ? 'md:ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
