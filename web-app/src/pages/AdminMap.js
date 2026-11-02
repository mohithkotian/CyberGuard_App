import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from '../components/Navbar';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORY_COLORS = {
  'Phishing': '#FFB800',
  'Financial Fraud': '#EFEDE8',
  'Ransomware': '#FF3366',
  'Identity Theft': '#C7C4BC',
  'Cyber Bullying': '#FF6B35',
  'Hacking': '#9C27B0',
  'Data Breach': '#EC4899',
  'Online Fraud': '#8E8B85',
  'Child Exploitation': '#EF4444',
  'Women/Child Safety': '#FF2A6D',
  'DDoS / Network Attacks': '#F97316',
  'Cryptocurrency Scams': '#10B981',
  'Other': '#64748B'
};

const createCustomIcon = (category, severity) => {
  const color = severity === 'critical' ? '#FF2A6D' : (CATEGORY_COLORS[category] || '#EFEDE8');
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

export default function AdminMap() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const { data } = await analyticsAPI.mapPoints();
        setPoints(data.data.points || []);
      } catch (err) {
        toast.error('Failed to load map data');
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#070707' }}>
      <Navbar />
      <div style={{ flex: 1, position: 'relative' }}>
        {loading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, background: 'rgba(7,7,7,0.9)', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: '0.08em' }}>
            SCANNING GEOGRAPHIC THREAT VECTORS...
          </div>
        ) : (
          <MapContainer 
            center={[20.5937, 78.9629]} 
            zoom={5} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.google.com/intl/en_us/help/terms_maps/">Google Maps</a>'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
            {points.map((p) => {
              const pColor = p.severity === 'critical' ? '#FF2A6D' : (CATEGORY_COLORS[p.category] || '#EFEDE8');
              return (
                <Marker 
                  key={p._id} 
                  position={[p.location.coordinates[1], p.location.coordinates[0]]}
                  icon={createCustomIcon(p.category, p.severity)}
                >
                  <Popup>
                    <div style={{ minWidth: '200px', color: '#fff', background: '#0d0d0d', padding: '6px' }}>
                      <div style={{ fontSize: '10px', color: pColor, marginBottom: '4px', fontWeight: 'bold', fontFamily: 'var(--font-sans)' }}>
                        {p.complaintId} â€¢ {(p.severity || 'HIGH').toUpperCase()}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}>{p.title}</div>
                      <div style={{ fontSize: '11px', color: '#EFEDE8', marginBottom: '4px' }}>
                        Type: {p.category} {p.subCategory ? `â€¢ ${p.subCategory}` : ''}
                      </div>
                      <div style={{ fontSize: '10px', color: '#8892B0', marginBottom: '8px' }}>
                        Status: <span style={{ textTransform: 'capitalize', color: p.status === 'resolved' ? '#00ffaa' : '#ffcc00' }}>{p.status}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '5px' }}>
                        <span style={{ fontSize: '9px', color: '#5A6480' }}>
                          {format(new Date(p.createdAt), 'dd MMM yyyy')}
                        </span>
                        <a 
                          href={`/track/${p.complaintId}`} 
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '10px', color: '#00ffaa', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                          OPEN DOSSIER â†’
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
        
        {/* Overlay Legend */}
        <div style={{ 
          position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000, 
          background: 'rgba(10,15,30,0.85)', padding: '15px', borderRadius: '12px', 
          border: '1px solid rgba(0,180,255,0.2)', backdropFilter: 'none',
          boxShadow: 'none',
          maxWidth: '280px'
        }}>
          <h4 style={{ fontSize: '11px', margin: '0 0 10px 0', color: '#EFEDE8', fontFamily: 'var(--font-sans)', letterSpacing: '1px' }}>HOTSPOT INCIDENT MATRIX</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', color: '#E0E8FF' }}>
            {Object.entries(CATEGORY_COLORS).slice(0, 8).map(([cat, col]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col,  }}></span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', color: '#EFEDE8', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
            TOTAL MONITORED THREATS: {points.length}
          </div>
        </div>
      </div>
      
      <style>{`
        .leaflet-popup-content-wrapper {
          background: #0d0d0d !important;
          color: #fff !important;
          border: 1px solid #30302d !important;
          border-radius: 16px !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 12px !important;
        }
        .leaflet-popup-tip {
          background: #0d0d0d !important;
          border: 1px solid #30302d !important;
        }
      `}</style>
    </div>
  );
}

