import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VacanciesPage from './pages/VacanciesPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VacanciesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
