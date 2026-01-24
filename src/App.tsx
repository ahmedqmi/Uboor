import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TravelProvider } from './context/TravelContext';
import { Header } from './components/Header';
import { TravelerPage } from './pages/TravelerPage';
import { AdminPage } from './pages/AdminPage';
import './App.css';

function App() {
  return (
    <TravelProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<TravelerPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </TravelProvider>
  );
}

export default App;
