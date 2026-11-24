"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents
} from "react-leaflet";

const marcador = L.divIcon({
  className: "sistemainmo-marker",
  html: '<div style="width:26px;height:26px;background:#2563eb;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px #0006"></div>',
  iconSize: [30, 38],
  iconAnchor: [15, 36]
});

function ActualizarVista({ position }) {
  const mapa = useMap();

  useEffect(() => {
    mapa.flyTo(
      [position.lat, position.lng],
      Math.max(mapa.getZoom(), 15),
      { duration: 0.6 }
    );
  }, [mapa, position.lat, position.lng]);

  return null;
}

function EventosMapa({ onChange }) {
  useMapEvents({
    click(evento) {
      onChange({
        lat: evento.latlng.lat,
        lng: evento.latlng.lng
      });
    }
  });

  return null;
}

export default function MapaUbicacion({
  position,
  onPositionChange
}) {
  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={15}
      scrollWheelZoom={false}
      style={{
        height: "350px",
        width: "100%",
        borderRadius: "12px"
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <ActualizarVista position={position} />

      <EventosMapa onChange={onPositionChange} />

      <Marker
        position={[position.lat, position.lng]}
        icon={marcador}
        draggable
        eventHandlers={{
          dragend(evento) {
            const punto = evento.target.getLatLng();

            onPositionChange({
              lat: punto.lat,
              lng: punto.lng
            });
          }
        }}
      />
    </MapContainer>
  );
}
