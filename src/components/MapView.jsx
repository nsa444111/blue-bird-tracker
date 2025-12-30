import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks
function LocationMarker({ onLocationSelect }) {
    const [position, setPosition] = useState(null);
    const map = useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
        locationfound(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, 16);
        },
    });

    useEffect(() => {
        map.locate();
    }, [map]);

    return position === null ? null : (
        <Marker position={position}>
            <Popup>現在地</Popup>
        </Marker>
    );
}

// Component to center map controls
function Controls({ onCenter, onRefresh, isLoading }) {
    return (
        <div className="overlay-controls">
            <button className="btn-icon" onClick={onCenter}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            </button>
            <button className="btn-icon" onClick={onRefresh} disabled={isLoading}>
                <svg className={isLoading ? 'spin' : ''} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
            </button>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
}

export default function MapView({ visits, onAddClick, flyToPosition, onBack, onRefresh, isLoading }) {
    const [map, setMap] = useState(null);

    const handleCenter = () => {
        if (map) map.locate();
    };

    useEffect(() => {
        if (map && flyToPosition) {
            map.flyTo([flyToPosition.lat, flyToPosition.lng], 18);
        }
    }, [map, flyToPosition]);

    return (
        <div className="map-container">
            <MapContainer
                center={[35.6812, 139.7671]} // Default Tokyo
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                ref={setMap}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker onLocationSelect={onAddClick} />

                {(visits || []).map(visit => {
                    // Safe parsing
                    const lat = parseFloat(visit.lat);
                    const lng = parseFloat(visit.lng);

                    // Check validity
                    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;

                    return (
                        <Marker key={visit.id} position={[lat, lng]}>
                            <Popup>
                                <strong>{visit.shopName}</strong><br />
                                {visit.status}<br />
                                担当: {visit.castName}
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            <div className="overlay-controls" style={{ bottom: '2rem', top: 'auto' }}>
                <button className="btn-icon" style={{ background: 'var(--primary)', color: 'white' }} onClick={() => {
                    // Get current center or user location
                    const center = map ? map.getCenter() : { lat: 35.6812, lng: 139.7671 };
                    onAddClick(center);
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                </button>
                <button className="btn-icon" onClick={handleCenter}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                </button>
                <button className="btn-icon" onClick={onRefresh} disabled={isLoading}>
                    <svg className={isLoading ? 'spin' : ''} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                </button>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
            </div>

            {/* Back Button */}
            <button
                style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 1000,
                    background: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '3rem',
                    height: '3rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}
                onClick={onBack}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
        </div>
    );
}
