import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Report } from '../api/client';
import { StatusBadge } from './StatusBadge';
import { Link } from 'react-router-dom';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Category-based colored SVGs for map pins
const getCategoryIcon = (category: string, isDraggable = false) => {
  const colors: Record<string, string> = {
    pothole: '#ef4444',            // Red
    garbage: '#f97316',            // Orange
    water_leakage: '#0ea5e9',      // Blue
    broken_streetlight: '#eab308', // Yellow
    drainage: '#6366f1',           // Indigo
    unsafe_infrastructure: '#a855f7' // Purple
  };

  const fill = isDraggable ? '#14b8a6' : (colors[category] || '#64748b');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="${fill}" stroke="#ffffff" stroke-width="1.5">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>`;

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });
};

interface MapProps {
  reports?: Report[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  draggablePin?: boolean;
  pinPosition?: [number, number];
  onPinChange?: (lat: number, lng: number) => void;
}

const LocationPicker: React.FC<{
  position: [number, number];
  onChange: (lat: number, lng: number) => void;
}> = ({ position, onChange }) => {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={position}
      draggable={true}
      icon={getCategoryIcon('picker', true)}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          onChange(pos.lat, pos.lng);
        },
      }}
    >
      <Popup>
        <div className="text-xs font-semibold text-slate-800">
          📍 Drag pin to exact defect location
        </div>
      </Popup>
    </Marker>
  );
};

const RecenterMap: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

export const MapComponent: React.FC<MapProps> = ({
  reports = [],
  center = [13.0415, 80.2330], // Chennai default
  zoom = 13,
  height = '480px',
  draggablePin = false,
  pinPosition,
  onPinChange,
}) => {
  return (
    <div style={{ height, width: '100%' }} className="relative rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {center && <RecenterMap center={center} />}

        {/* Draggable pin mode */}
        {draggablePin && pinPosition && onPinChange && (
          <LocationPicker position={pinPosition} onChange={onPinChange} />
        )}

        {/* Report markers */}
        {reports.map((rep) => (
          <Marker
            key={rep.id}
            position={[rep.lat, rep.lng]}
            icon={getCategoryIcon(rep.category)}
          >
            <Popup>
              <div className="p-1 min-w-[220px]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    {rep.category.replace('_', ' ')}
                  </span>
                  <StatusBadge status={rep.status} size="sm" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1 leading-tight">
                  {rep.title}
                </h4>
                <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">
                  {rep.description}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="font-mono font-bold text-civic-600">
                    Priority: {rep.priority_score.toFixed(0)}
                  </span>
                  <Link
                    to={`/reports/${rep.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    View Proof &rarr;
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
