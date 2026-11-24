import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { ExploreMapPage } from './pages/ExploreMapPage';
import { ReportFormPage } from './pages/ReportFormPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { OfficerQueuePage } from './pages/OfficerQueuePage';
import { AccountabilityDashboardPage } from './pages/AccountabilityDashboardPage';
import { SupervisionQueuePage } from './pages/SupervisionQueuePage';
import { LoginPage } from './pages/LoginPage';
import './i18n';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/map" element={<ExploreMapPage />} />
                <Route path="/report" element={<ReportFormPage />} />
                <Route path="/reports/:id" element={<ReportDetailPage />} />
                <Route path="/queue" element={<OfficerQueuePage />} />
                <Route path="/accountability" element={<AccountabilityDashboardPage />} />
                <Route path="/supervision" element={<SupervisionQueuePage />} />
                <Route path="/login" element={<LoginPage />} />
              </Routes>
            </main>
            <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                  <strong>FixProof</strong> — Don't just report it. Prove it's fixed.
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span>Multilingual Civic Tech</span>
                  <span>•</span>
                  <span>Chennai Civic Pilot</span>
                  <span>•</span>
                  <span className="font-mono">v1.0.0</span>
                </div>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
