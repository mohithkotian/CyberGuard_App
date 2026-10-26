import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Navbar from '../components/Navbar';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  'Phishing': '#FFB800',
  'Financial Fraud': '#00B4FF',
  'Ransomware': '#FF3366',
  'Identity Theft': '#A855F7',
  'Cyber Bullying': '#FF6B35',
  'Hacking': '#9C27B0',
  'Data Breach': '#EC4899',
  'Online Fraud': '#3B82F6',
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
    return CATEGORY_COLORS[category] || '#00B4FF';
  };

  const filteredPoints = activeFilter === 'ALL'
    ? points
    : points.filter(p => (p.category || 'Other').toUpperCase() === activeFilter.toUpperCase());

  return (
    <div className="public-map-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />
      <div style={{ flex: 1, position: 'relative' }}>
        
        {/* Statistics Header & Filter Bar */}
        <div style={{ 
          position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', 
          zIndex: 1000, background: '#0B0B0B', padding: '10px 18px', 
          borderRadius: '6px', border: '1px solid #292929', 
          color: '#A7A7A7', 
          fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.04em',
          boxShadow: 'none',
          display: 'flex', alignItems: 'center', gap: '15px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22D3EE' }}></span>
            LIVE AI THREAT INTELLIGENCE MAP • {filteredPoints.length} VERIFIED INCIDENTS
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
                  <div style={{ minWidth: '180px', background: '#0B0B0B', color: '#fff', padding: '8px' }}>
                    <div style={{ fontSize: '10px', color: pColor, fontWeight: 'bold', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>
                      {(p.severity || 'HIGH').toUpperCase()} THREAT CLASSIFICATION
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {p.category || 'General Cybercrime'}
                    </div>
                    {p.subCategory && (
                      <div style={{ fontSize: '11px', color: '#00B4FF', marginBottom: '6px' }}>
                        Sub-Type: {p.subCategory}
                      </div>
                    )}
                    <div style={{ fontSize: '10px', color: '#8892B0' }}>
                      Geospatial Threat Coordinate Active
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '9px', color: '#5A6480', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '5px' }}>
                      Categorized by CyberGuard AI ML Engine
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div style={{ 
          position: 'absolute', bottom: '30px', right: '20px', zIndex: 1000, 
          background: '#0B0B0B', padding: '14px', borderRadius: '8px', 
          border: '1px solid #292929',
          maxWidth: '260px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#22D3EE', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>
            CYBERCRIME CATEGORIES
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', color: '#E0E8FF' }}>
            {Object.entries(CATEGORY_COLORS).slice(0, 8).map(([cat, col]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col }}></span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
      <style>{`
        .public-map-page > nav > div:nth-child(2) > div:nth-child(2) {
          padding-left: 52px !important;
          padding-right: 72px !important;
        }

        .public-map-page > nav > div:nth-child(2) > button {
          width: 28px !important;
          height: 40px !important;
          background: #0B0B0B !important;
          border-color: #292929 !important;
          box-shadow: none !important;
          font-size: 16px !important;
        }

        .leaflet-container { background: #050505 !important; }
        .leaflet-popup-content-wrapper { background: #0B0B0B !important; color: #fff !important; border: 1px solid #292929 !important; border-radius: 6px !important; }
        .leaflet-popup-tip { background: #0B0B0B !important; }

        @media (max-width: 760px) {
          .public-map-page > nav > div:nth-child(2) > div:nth-child(2) {
            padding-left: 46px !important;
            padding-right: 58px !important;
          }

          .public-map-page > div:nth-child(2) > div:first-child {
            top: 12px !important;
            max-width: calc(100% - 24px) !important;
            padding: 9px 12px !important;
            font-size: 10px !important;
            white-space: nowrap;
          }

          .public-map-page > div:nth-child(2) > div:last-child {
            left: 12px !important;
            right: 12px !important;
            bottom: 12px !important;
            max-width: none !important;
          }

          .public-map-page > div:nth-child(2) > div:last-child > div {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}
