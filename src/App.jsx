import { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import MapView from './components/MapView';
import VisitForm from './components/VisitForm';
import MainMenu from './components/MainMenu';
import ListView from './components/ListView';
import { fetchVisits, saveVisit, deleteVisitFromSheet } from './api';
import { isConfigured } from './config';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [flyToPosition, setFlyToPosition] = useState(null);

  // 'menu' | 'map' | 'list'
  const [viewMode, setViewMode] = useState('menu');
  const [isLoading, setIsLoading] = useState(false);

  const loadVisits = async () => {
    setIsLoading(true);
    const data = await fetchVisits();
    setVisits(data);
    setIsLoading(false);
  };

  // Load data on mount
  useEffect(() => {
    loadVisits();
  }, []);

  // Save visits to localStorage as backup (always)
  useEffect(() => {
    localStorage.setItem('blue-bird-visits', JSON.stringify(visits));
  }, [visits]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setViewMode('menu');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode('menu');
  };

  const handleAddClick = (location) => {
    setTempLocation(location);
    setIsFormOpen(true);
  };

  const handleSaveVisit = async (visitData) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('ja-JP'); // YYYY/MM/DD

    const newVisit = {
      id: Date.now().toString(),
      timestamp: dateStr,
      Timestamp: dateStr,
      timestam: dateStr,
      ...visitData
    };

    // Add to local state immediately for responsiveness
    setVisits(prev => [...prev, newVisit]);
    setIsFormOpen(false);

    console.log('Saving visit payload:', newVisit);

    // Save to sheet in background (if configured)
    if (isConfigured()) {
      const result = await saveVisit(newVisit);
      if (result.error) {
        console.error('Failed to save to sheet:', result.error);
        // Data is still in localStorage, so not lost
      }
    }
  };

  const handleDeleteVisit = async (id) => {
    // Remove from local state immediately
    setVisits(prev => prev.filter(v => v.id !== id));

    // Delete from sheet in background (if configured)
    if (isConfigured()) {
      const result = await deleteVisitFromSheet(id);
      if (result.error) {
        console.error('Failed to delete from sheet:', result.error);
      }
    }
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      {viewMode === 'menu' && (
        <MainMenu
          onNavigate={setViewMode}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
      )}

      {viewMode === 'map' && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <MapView
            visits={visits}
            onAddClick={handleAddClick}
            flyToPosition={flyToPosition}
            onBack={() => setViewMode('menu')}
            onRefresh={loadVisits}
            isLoading={isLoading}
          />

          <VisitForm
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSave={handleSaveVisit}
            currentUser={currentUser}
            initialLocation={tempLocation || { lat: 35.6812, lng: 139.7671 }}
            onFlyTo={setFlyToPosition}
            visits={visits} // Pass visits for duplicate checking
          />
        </div>
      )}

      {viewMode === 'list' && (
        <ListView
          visits={visits}
          onDelete={handleDeleteVisit}
          onBack={() => setViewMode('menu')}
          onRefresh={loadVisits}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

export default App;
