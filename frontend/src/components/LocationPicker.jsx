import { useEffect, useRef, useState } from 'react';
import './LocationPicker.css';

// Leaflet CSS phải load động để tránh SSR issues
let leafletLoaded = false;

export default function LocationPicker({ onSelect, initialAddress = '' }) {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markerRef   = useRef(null);

  const [query, setQuery]       = useState(initialAddress);
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showMap, setShowMap]   = useState(false);
  const debounceRef = useRef(null);

  // Load Leaflet CSS
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Init map sau khi showMap = true
  useEffect(() => {
    if (!showMap || mapInstance.current) return;

    import('leaflet').then(L => {
      const map = L.map(mapRef.current, {
        center: selected ? [selected.lat, selected.lon] : [21.0285, 105.8542],
        zoom: selected ? 16 : 12,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Custom marker icon
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      });

      if (selected) {
        markerRef.current = L.marker([selected.lat, selected.lon], { icon, draggable: true }).addTo(map);
        markerRef.current.on('dragend', async (e) => {
          const { lat, lng } = e.target.getLatLng();
          const addr = await reverseGeocode(lat, lng);
          const loc = { lat, lon: lng, display_name: addr };
          setSelected(loc);
          setQuery(addr);
          onSelect?.(loc);
        });
      }

      // Click trên bản đồ để đặt marker
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
          markerRef.current.on('dragend', async (ev) => {
            const { lat: la, lng: ln } = ev.target.getLatLng();
            const addr = await reverseGeocode(la, ln);
            const loc = { lat: la, lon: ln, display_name: addr };
            setSelected(loc);
            setQuery(addr);
            onSelect?.(loc);
          });
        }
        const addr = await reverseGeocode(lat, lng);
        const loc = { lat, lon: lng, display_name: addr };
        setSelected(loc);
        setQuery(addr);
        onSelect?.(loc);
      });

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
  }, [showMap]);

  // Khi selected thay đổi, cập nhật map
  useEffect(() => {
    if (!mapInstance.current || !selected) return;
    import('leaflet').then(L => {
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      });
      if (markerRef.current) {
        markerRef.current.setLatLng([selected.lat, selected.lon]);
      } else {
        markerRef.current = L.marker([selected.lat, selected.lon], { icon, draggable: true }).addTo(mapInstance.current);
      }
      mapInstance.current.setView([selected.lat, selected.lon], 16);
    });
  }, [selected]);

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=vi`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  };

  const searchAddress = async (q) => {
    if (!q.trim() || q.length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=vn&accept-language=vi`
      );
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(v), 500);
  };

  const handleSelect = (item) => {
    setSelected(item);
    setQuery(item.display_name);
    setResults([]);
    setShowMap(true);
    onSelect?.(item);
  };

  const handleConfirm = () => {
    if (selected) onSelect?.(selected);
    setResults([]);
  };

  return (
    <div className="lp-wrap">
      {/* Search box */}
      <div className="lp-search-wrap">
        <div className="lp-search-row">
          <span className="lp-search-icon">📍</span>
          <input
            type="text"
            className="lp-search-input"
            placeholder="Tìm kiếm địa chỉ... (VD: 15 Tạ Quang Bửu, Hà Nội)"
            value={query}
            onChange={handleInput}
            onFocus={() => query.length >= 3 && searchAddress(query)}
          />
          {searching && <span className="lp-spinner">⏳</span>}
          {query && (
            <button className="lp-clear-btn" onClick={() => { setQuery(''); setResults([]); setSelected(null); }}>✕</button>
          )}
        </div>

        {/* Dropdown kết quả */}
        {results.length > 0 && (
          <ul className="lp-results">
            {results.map((r, i) => (
              <li key={i} className="lp-result-item" onClick={() => handleSelect(r)}>
                <span className="lp-result-icon">📍</span>
                <span>{r.display_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Toggle map */}
      <button
        type="button"
        className="lp-toggle-map-btn"
        onClick={() => setShowMap(v => !v)}
      >
        {showMap ? '🗺️ Ẩn bản đồ' : '🗺️ Mở bản đồ để ghim vị trí'}
      </button>

      {/* Map */}
      {showMap && (
        <div className="lp-map-wrap">
          <div ref={mapRef} className="lp-map" />
          <p className="lp-map-hint">💡 Click trên bản đồ hoặc kéo marker để chọn vị trí chính xác</p>
        </div>
      )}

      {/* Selected info */}
      {selected && (
        <div className="lp-selected">
          <span className="lp-selected-icon">✅</span>
          <div className="lp-selected-info">
            <p className="lp-selected-addr">{selected.display_name}</p>
            <p className="lp-selected-coords">Tọa độ: {parseFloat(selected.lat).toFixed(5)}, {parseFloat(selected.lon).toFixed(5)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
