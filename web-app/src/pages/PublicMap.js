import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Navbar from '../components/Navbar';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  'Phishing': '#FFB800',
  'Financial Fraud': '#22D3EE',
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

export default function PublicMap() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const { data } = await analyticsAPI.publicMapPoints();
        setPoints(data.data.points || []);
      } catch (err) {
        toast.error('Failed to load threat intelligence data');
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  const getColor = (category, severity) => {
    if (severity?.toLowerCase() === 'critical') return '#FF2A6D';
    return CATEGORY_COLORS[category] || '#22D3EE';
  };

  const filteredPoints = activeFilter === 'ALL'
    ? points
    : points.filter(p => (p.category || 'Other').toUpperCase() === activeFilter.toUpperCase());

  return (
    <div className="public-map-page" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#070707', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <Navbar />
      <div style={{ flex: 1, position: 'relative' }}>
        
        {/* Statistics Header & Filter Bar */}
        <div style={{ 
          position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', 
          zIndex: 1000, background: '#0d0d0d', padding: '10px 24px', 
          borderRadius: '8px', border: '1px solid #30302d', 
          color: '#f2f0ea', 
          fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', letterSpacing: '1px',
          fontWeight: 700,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: '15px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3DF5C0' }}></span>
            NATIONAL CYBER THREAT HOTSPOT RADAR • {filteredPoints.length} VERIFIED INCIDENTS
          </span>
        </div>

        <MapContainer 
          center={[20.5937, 78.9629]} 
          zoom={5} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.google.com/intl/en_us/help/terms_maps/">Google Maps</a>'
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          />
          {filteredPoints.map((p) => {
            const pColor = getColor(p.category, p.severity);
            return (
              <CircleMarker
                key={p._id}
                center={[p.location.coordinates[1], p.location.coordinates[0]]}
                radius={p.severity === 'critical' ? 10 : 8}
                pathOptions={{
                  fillColor: pColor,
                  color: '#fff',
                  weight: 1.5,
                  fillOpacity: 0.8
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px', background: '#0d0d0d', color: '#f2f0ea', padding: '10px' }}>
                    <div style={{ fontSize: '10px', color: pColor, fontWeight: 'bold', marginBottom: '4px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '1px' }}>
                      {(p.severity || 'HIGH').toUpperCase()} THREAT CLASSIFICATION
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {p.category || 'General Cybercrime'}
                    </div>
                    {p.subCategory && (
                      <div style={{ fontSize: '11px', color: '#b8b8b0', marginBottom: '6px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        Vector: {p.subCategory}
                      </div>
                    )}
                    <div style={{ fontSize: '10px', color: '#777', fontFamily: "'IBM Plex Mono', monospace" }}>
                      Geospatial Node Active
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div style={{ 
          position: 'absolute', bottom: '24px', right: '24px', zIndex: 1000, 
          background: '#0d0d0d', padding: '18px 22px', borderRadius: '20px', 
          border: '1px solid #30302d',
          maxWidth: '280px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#888880', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>
            INCIDENT CLASSIFICATIONS
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>
            {Object.entries(CATEGORY_COLORS).slice(0, 8).map(([cat, col]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col, flexShrink: 0 }}></span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
      <style>{`
        .leaflet-container { background: #070707 !important; }
        .leaflet-popup-content-wrapper { background: #0d0d0d !important; color: #fff !important; border: 1px solid #30302d !important; border-radius: 12px !important; }
        .leaflet-popup-tip { background: #0d0d0d !important; }
      `}</style>
    </div>
  );
}
