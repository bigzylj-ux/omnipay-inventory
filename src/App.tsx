import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ImportPage } from './components/ImportPage';
import { InventoryPage } from './components/InventoryPage';
import { ReconciliationPage } from './components/ReconciliationPage';
import { TrackingPage } from './components/TrackingPage';
import { VendorsPage } from './components/VendorsPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/reconciliation" element={<ReconciliationPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
