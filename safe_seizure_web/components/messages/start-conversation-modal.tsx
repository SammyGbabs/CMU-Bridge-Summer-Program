'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { PatientAvatar } from '@/components/patient-avatar';
import { listPatients } from '@/lib/supabase/patients';
import { getOrCreateConversation, ConversationWithPatient } from '@/lib/supabase/messages';
import { Patient } from '@/lib/types';
import { Search, AlertCircle } from 'lucide-react';

interface StartConversationModalProps {
  open: boolean;
  onClose: () => void;
  onStarted: (conversation: ConversationWithPatient) => void;
  doctorId: string;
  existingPatientIds: string[];
}

export function StartConversationModal({
  open,
  onClose,
  onStarted,
  doctorId,
  existingPatientIds,
}: StartConversationModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    setIsLoading(true);
    listPatients()
      .then((data) => {
        if (isMounted) setPatients(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load patients.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = async (patient: Patient) => {
    setStartingId(patient.id);
    setError('');

    try {
      const conversation = await getOrCreateConversation(doctorId, patient.id);
      onStarted(conversation);
      onClose();
      setSearchQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation.');
    } finally {
      setStartingId(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Conversation" className="max-w-md">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="max-h-80 overflow-y-auto -mx-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Loading patients...
            </p>
          ) : filteredPatients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {patients.length === 0 ? 'No patients registered yet.' : 'No patients found.'}
            </p>
          ) : (
            filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelect(patient)}
                disabled={startingId !== null}
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left disabled:opacity-50"
              >
                <PatientAvatar name={patient.name} avatar={patient.photo} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{patient.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {existingPatientIds.includes(patient.id)
                      ? 'Existing conversation'
                      : patient.diagnoses[0] || 'No diagnosis on file'}
                  </p>
                </div>
                {startingId === patient.id && (
                  <span className="text-xs text-muted-foreground">Opening...</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
