import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CitizenPortal from './Pages/CitizenPortal';
import AdminDashboard from './Pages/AdminDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('citizen');

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pb-12">
        {activeTab === 'citizen' ? <CitizenPortal /> : <AdminDashboard />}
      </main>
    </div>
  );
}
