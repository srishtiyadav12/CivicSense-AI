import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default city center (used as the initial marker position)
const DEFAULT_POSITION = [28.7041, 77.1025]; // New Delhi

// Custom marker icon drawn via CSS (avoids the broken default Leaflet icon paths)
const customIcon = L.divIcon({
  className: '',
  html: '<div style="width:26px;height:26px;background:#dc2626;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26]
});

function ClickCatcher({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6))]);
    }
  });
  return null;
}

/**
 * A small map the user can click to choose a location.
 * Controlled component: props = { position: [lat,lng], onChange([lat,lng]) }
 */
const LocationPicker = ({ position = DEFAULT_POSITION, onChange }) => {
  const didInit = useRef(false);

  // Emit the initial position once so the parent always has valid coordinates
  useEffect(() => {
    if (!didInit.current && position) {
      didInit.current = true;
      if (onChange) onChange(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const MapRecenter = ({ position }) => {
    const m = useMap();
    useEffect(() => {
      if (position) {
        m.flyTo(position, 14);
      }
    }, [position, m]);
    return null;
  };

  return (
    <MapContainer
      center={position || DEFAULT_POSITION}
      zoom={13}
      style={{ height: 280, width: '100%', borderRadius: 10, zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCatcher onPick={onChange} />
      <MapRecenter position={position} />
      {position && <Marker position={position} icon={customIcon} />}
    </MapContainer>
  );
};

export default LocationPicker;