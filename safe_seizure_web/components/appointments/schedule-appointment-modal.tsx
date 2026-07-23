'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { listPatients } from '@/lib/supabase/patients';
import { createAppointment, AppointmentWithPatient } from '@/lib/supabase/appointments';
import { Patient } from '@/lib/types';
import { AlertCircle } from 'lucide-react';

interface ScheduleAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onScheduled: (appointment: AppointmentWithPatient) => void;
  doctorId: string;
}

type AppointmentType = 'consultation' | 'follow-up' | 'medication-review' | 'emergency';

export function ScheduleAppointmentModal({
  open,
  onClose,
  onScheduled,
  doctorId,
}: ScheduleAppointmentModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState<AppointmentType>('consultation');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    listPatients()
      .then((data) => {
        if (isMounted) setPatients(data);
      })
      .catch(() => {
        /* Non-fatal: the picker just shows empty */
      })
      .finally(() => {
        if (isMounted) setIsLoadingPatients(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  const resetAndClose = () => {
    onClose();
    setPatientId('');
    setType('consultation');
    setDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setNotes('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!patientId) {
      setError('Please select a patient');
      return;
    }
    if (!date || !startTime || !endTime) {
      setError('Date, start time, and end time are required');
      return;
    }

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (end <= start) {
      setError('End time must be after start time');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const appointment = await createAppointment({
        doctorId,
        patientId,
        type,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onScheduled(appointment);
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={resetAndClose} title="Schedule Appointment" className="max-w-lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Patient <span className="text-destructive">*</span>
          </label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className={inputClass()}
            disabled={isLoadingPatients}
          >
            <option value="">
              {isLoadingPatients ? 'Loading patients...' : 'Select a patient'}
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AppointmentType)}
            className={inputClass()}
          >
            <option value="consultation">Consultation</option>
            <option value="follow-up">Follow-up</option>
            <option value="medication-review">Medication Review</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Date <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass()}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Start Time <span className="text-destructive">*</span>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              End Time <span className="text-destructive">*</span>
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass()}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Central Medical Center - Room 204, or Telehealth"
            className={inputClass()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes about this appointment"
            className={inputClass()}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={resetAndClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function inputClass() {
  return 'w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm';
}
