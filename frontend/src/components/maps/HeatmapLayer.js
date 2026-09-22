import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// leaflet.heat attaches itself to a GLOBAL `L`, but RP bundlers give us the
// module instance. Expose the imported instance as the global BEFORE the
// plugin runs (require is synchronous and ordered, unlike hoisted `import`).
if (typeof window !== 'undefined') {
  window.L = window.L || L;
}
if (!L.heatLayer) {
  require('leaflet.heat');
}

/**
 * Renders a real Leaflet heat layer from heatmap data.
 * data is an array of { location: { coordinates: [lng, lat] }, intensity }
 */
const HeatmapLayer = ({ data = [], radius = 30, blur = 22 }) => {
  const map = useMap();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const points = data
      .filter(d => d.location && Array.isArray(d.location.coordinates) && d.location.coordinates.length === 2)
      .map(d => {
        const [lng, lat] = d.location.coordinates;
        return [lat, lng, d.intensity || d.count || 1];
      });

    if (points.length === 0) return;

    const heat = L.heatLayer(points, {
      radius,
      blur,
      maxZoom: 17,
      gradient: { 0.2: '#3b82f6', 0.5: '#f59e0b', 0.8: '#ef4444' }
    });

    heat.addTo(map);
    return () => {
      map.removeLayer(heat);
    };
  }, [data, map, radius, blur]);

  return null;
};

export default HeatmapLayer;