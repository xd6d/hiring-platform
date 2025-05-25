import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import GlobalAppMessage from './components/GlobalAppMessage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import VacanciesPage from './pages/VacanciesPage';
import UserProfilePage from './pages/UserProfilePage';

function App() {
  const [globalMessage, setGlobalMessage] = useState(null);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);

  const refreshHeader = () => {
    setHeaderRefreshKey(prev => prev + 1);
  };

  return (
    <Router>
      <Header refreshKey={headerRefreshKey} />
      <GlobalAppMessage trigger={globalMessage} />
      <Routes>
        <Route path="/" element={<VacanciesPage />} />
        <Route path="/login" element={<LoginPage refreshHeader={refreshHeader} />} />
        <Route path="/sign-up" element={<SignUpPage setGlobalAppMessage={setGlobalMessage} refreshHeader={refreshHeader} />} />
        <Route path="/profile" element={<UserProfilePage refreshHeader={refreshHeader} />} />
      </Routes>
    </Router>
  );
}

export default App;
