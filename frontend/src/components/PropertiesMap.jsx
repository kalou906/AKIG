import { useEffect, useRef } from 'react';

// Lightweight Mapbox GL via CDN approach
// Requires including Mapbox GL CSS/JS in index.html or main layout

const DEFAULT_CENTER = [-13.6982, 9.6412]; // Conakry approx lon, lat

export default function PropertiesMap({ markers = [], height = 360, zoom = 11 }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        if (!window.mapboxgl) return;
        if (mapRef.current) return;
        const mapboxgl = window.mapboxgl;
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: DEFAULT_CENTER,
            zoom
        });
        map.addControl(new mapboxgl.NavigationControl());
        mapRef.current = map;
        return () => map.remove();
    }, [zoom]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !window.mapboxgl) return;
        // Clear existing markers
        if (map._akigMarkers) {
            map._akigMarkers.forEach(m => m.remove());
        }
        map._akigMarkers = (markers || []).map(m => {
            const marker = new window.mapboxgl.Marker().setLngLat([m.lng, m.lat]).addTo(map);
            if (m.popup) {
                const popup = new window.mapboxgl.Popup({ offset: 24 }).setHTML(m.popup);
                marker.setPopup(popup);
            }
            return marker;
        });
    }, [markers]);

    return (
        <div style={{ width: '100%', height }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }} />
        </div>
    );
}
