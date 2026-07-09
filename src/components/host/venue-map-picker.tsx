"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type VenueMapPickerProps = {
  center: { lat: number; lng: number };
  position: { lat: number; lng: number } | null;
  onPositionChange: (position: { lat: number; lng: number }) => void;
};

function MapClickHandler({
  onPositionChange,
}: {
  onPositionChange: (position: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onPositionChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

function RecenterMap({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng, map]);

  return null;
}

export function VenueMapPicker({
  center,
  position,
  onPositionChange,
}: VenueMapPickerProps) {
  const markerPosition = useMemo(
    () => (position ? [position.lat, position.lng] as [number, number] : null),
    [position],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom
        className="z-0 h-72 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} />
        <MapClickHandler onPositionChange={onPositionChange} />
        {markerPosition ? (
          <Marker
            position={markerPosition}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const marker = event.target;
                const latlng = marker.getLatLng();
                onPositionChange({ lat: latlng.lat, lng: latlng.lng });
              },
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
