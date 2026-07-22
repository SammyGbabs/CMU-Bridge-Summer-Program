'use client';

import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Patient, Alert } from '@/lib/types';

interface PatientMapProps {
  patients: Patient[];
  alerts: Alert[];
}

function getIndicatorColor(patient: Patient, alerts: Alert[]) {
  const hasActiveAlert = alerts.some(
    (a) => a.patientId === patient.id && a.status === 'active'
  );
  if (hasActiveAlert || patient.status === 'alert') return '#EF4444';
  if (patient.status === 'monitoring') return '#F59E0B';
  if (patient.status === 'offline') return '#9CA3AF';
  return '#10B981';
}

export function PatientMap({ patients, alerts }: PatientMapProps) {
  const located = patients.filter((p) => p.currentLocation);

  const center: [number, number] = located.length
    ? [
        located.reduce((sum, p) => sum + p.currentLocation!.latitude, 0) /
          located.length,
        located.reduce((sum, p) => sum + p.currentLocation!.longitude, 0) /
          located.length,
      ]
    : [-1.9441, 30.0619];

  return (
    <div className="relative isolate rounded-lg overflow-hidden border border-border h-full min-h-[420px]">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[420px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((patient) => (
          <CircleMarker
            key={patient.id}
            center={[
              patient.currentLocation!.latitude,
              patient.currentLocation!.longitude,
            ]}
            radius={10}
            pathOptions={{
              color: '#FFFFFF',
              weight: 2,
              fillColor: getIndicatorColor(patient, alerts),
              fillOpacity: 0.9,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <div className="text-xs font-medium">
                {patient.name}
                <br />
                <span className="capitalize">{patient.status}</span>
                {patient.currentLocation?.address && (
                  <>
                    <br />
                    {patient.currentLocation.address}
                  </>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
