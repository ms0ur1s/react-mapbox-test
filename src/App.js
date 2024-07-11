import './App.css';
import React from 'react';
import MapboxMap from './components/mapboxMap/mapboxMap';
import MapboxMapSupercluster from './components/mapboxMap/mapboxMapSupercluster';

function App() {
  return (
    <div className="App">
      <main>
        {/* <MapboxMap /> */}
        <MapboxMapSupercluster />
      </main>
    </div>
  );
}

export default App;
