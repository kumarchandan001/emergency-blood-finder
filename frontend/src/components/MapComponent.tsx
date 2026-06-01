import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DonorMarker {
  id: string;
  name: string;
  bloodGroup: string;
  latitude: number;
  longitude: number;
  phone: string;
  distance: number;
}

interface MapComponentProps {
  center: [number, number]; // [lat, lng]
  donors?: DonorMarker[];
  hospitalName?: string;
  selectedDonorId?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  donors = [],
  hospitalName = 'Emergency Location',
  selectedDonorId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // SVG for Hospital Location Marker
  const hospitalIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute w-8 h-8 rounded-full bg-red-500/30 animate-ping"></span>
        <div class="w-6 h-6 rounded-full bg-red-600 border border-white flex items-center justify-center shadow-lg shadow-red-600/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </div>
      </div>
    `,
    className: 'custom-leaflet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // SVG for Available Donor Location Marker
  const donorIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-6 h-6 rounded-full bg-emerald-600 border border-white flex items-center justify-center shadow-lg shadow-emerald-600/50">
          <span class="text-[9px] font-extrabold text-white">O+</span>
        </div>
      </div>
    `,
    className: 'custom-leaflet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Create Donor icon with specific blood group text
  const createDonorIcon = (bloodGroup: string, isSelected: boolean) => {
    const bgColor = isSelected ? 'bg-red-600 border-red-200' : 'bg-emerald-600 border-white';
    const shadowColor = isSelected ? 'shadow-red-600/60' : 'shadow-emerald-600/40';
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          ${isSelected ? '<span class="absolute w-8 h-8 rounded-full bg-red-600/30 animate-ping"></span>' : ''}
          <div class="w-7 h-7 rounded-full ${bgColor} border-2 flex items-center justify-center shadow-lg ${shadowColor}">
            <span class="text-[9px] font-extrabold text-white">${bloodGroup}</span>
          </div>
        </div>
      `,
      className: 'custom-leaflet-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 13,
      zoomControl: true,
    });

    // Load OpenStreetMap tiles (Dark Theme Mode Map Style via CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    // Add layers group
    const markersLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;

    return () => {
      map.remove();
    };
  }, []);

  // Update Markers & Paths dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear old markers
    markersLayer.clearLayers();

    // Clear old polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Update map view center coordinates
    map.setView(center, map.getZoom());

    // 1. Add Hospital Marker
    L.marker(center, { icon: hospitalIcon })
      .bindPopup(`<b>${hospitalName}</b><br/>Emergency Patient Center`)
      .addTo(markersLayer)
      .openPopup();

    // 2. Add Donors Markers
    let selectedDonorCoords: [number, number] | null = null;

    donors.forEach((donor) => {
      const isSelected = selectedDonorId === donor.id;
      const donorCoords: [number, number] = [donor.latitude, donor.longitude];

      if (isSelected) {
        selectedDonorCoords = donorCoords;
      }

      L.marker(donorCoords, {
        icon: createDonorIcon(donor.bloodGroup, isSelected),
      })
        .bindPopup(`
          <div class="text-slate-900 font-sans p-1">
            <h4 class="font-bold text-sm">${donor.name} (${donor.bloodGroup})</h4>
            <p class="text-xs text-slate-500">Distance: ${donor.distance} km</p>
            <p class="text-xs text-slate-500">Phone: ${donor.phone}</p>
          </div>
        `)
        .addTo(markersLayer);
    });

    // 3. Draw Polyline Route if donor selected
    if (selectedDonorCoords) {
      const line = L.polyline([center, selectedDonorCoords], {
        color: '#ef4444',
        weight: 3,
        dashArray: '5, 10',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = line;

      // Fit map boundary to include both points
      const bounds = L.latLngBounds([center, selectedDonorCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [center, donors, selectedDonorId, hospitalName]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] border border-slate-800 rounded-xl overflow-hidden shadow-2xl" />
      <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg z-20 text-[10px] text-slate-400 backdrop-blur-md">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
            <span>Emergency center</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Nearby Donors</span>
          </div>
        </div>
      </div>
    </div>
  );
};
