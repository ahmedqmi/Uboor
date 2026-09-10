import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TravelProvider } from './context/TravelContext';
import { Header } from './components/Header';
import { TravelerPage } from './pages/TravelerPage';
import { AdminPage } from './pages/AdminPage';
import { V2Layout } from './pages/v2/V2Layout';
import { TravelerPageV2 } from './pages/v2/TravelerPageV2';
import { AdminPageV2 } from './pages/v2/AdminPageV2';
import { PassengerHistoryPage } from './pages/v2/PassengerHistoryPage';
import './App.css';

function App() {
  return (
    <TravelProvider>
      <Router>
        <Routes>
          <Route
            path="/*"
            element={
              <div className="app">
                <Header />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<TravelerPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                  </Routes>
                </main>
              </div>
            }
          />
          <Route path="/v2" element={<V2Layout />}>
            <Route index element={<TravelerPageV2 />} />
            <Route path="admin" element={<AdminPageV2 />} />
            <Route path="passenger/:documentNumber" element={<PassengerHistoryPage />} />
          </Route>
        </Routes>
      </Router>
    </TravelProvider>
  );
}

export default App;
