'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Patient, RiskLevel, PatientStatus } from '@/lib/types';
import { createPatient } from '@/lib/supabase/patients';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface RegisterPatientModalProps {
  open: boolean;
  onClose: () => void;
  onRegister: (patient: Patient) => void;
  doctorId: string;
}

const STEPS = ['Personal Info', 'Medical Details', 'Address', 'Emergency Contact'];

const COUNTRY_CODES = [
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+257', flag: '🇧🇮', name: 'Burundi' },
  { code: '+243', flag: '🇨🇩', name: 'DR Congo' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
];

interface FormState {
  /* Personal Info */
  name: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  /* Medical Details */
  diagnosis: string;
  riskLevel: RiskLevel;
  status: PatientStatus;
  seizureFrequency: string;
  /* Address */
  country: string;
  city: string;
  state: string;
  houseAddress: string;
  zipCode: string;
  locationEnabled: boolean;
  /* Emergency Contact */
  emergencyFullName: string;
  emergencyRelation: string;
  emergencyEmail: string;
  emergencyPhoneCountryCode: string;
  emergencyPhone: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  dateOfBirth: '',
  gender: '',
  email: '',
  phone: '',
  diagnosis: '',
  riskLevel: 'low',
  status: 'stable',
  seizureFrequency: '',
  country: '',
  city: '',
  state: '',
  houseAddress: '',
  zipCode: '',
  locationEnabled: false,
  emergencyFullName: '',
  emergencyRelation: '',
  emergencyEmail: '',
  emergencyPhoneCountryCode: '+250',
  emergencyPhone: '',
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export function RegisterPatientModal({
  open,
  onClose,
  onRegister,
  doctorId,
}: RegisterPatientModalProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const update = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (index: number) => {
    const newErrors: FormErrors = {};

    if (index === 0) {
      if (!form.name.trim()) newErrors.name = 'Full name is required';
      if (!form.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!form.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = 'Enter a valid email address';
      }
    }

    if (index === 1) {
      if (!form.diagnosis.trim()) newErrors.diagnosis = 'Diagnosis is required';
    }

    if (index === 2) {
      if (!form.country.trim()) newErrors.country = 'Country is required';
      if (!form.city.trim()) newErrors.city = 'City is required';
      if (!form.houseAddress.trim())
        newErrors.houseAddress = 'House address is required';
    }

    if (index === 3) {
      if (!form.emergencyFullName.trim())
        newErrors.emergencyFullName = 'Full name is required';
      if (!form.emergencyRelation.trim())
        newErrors.emergencyRelation = 'Relation to patient is required';
      if (!form.emergencyPhone.trim())
        newErrors.emergencyPhone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetAndClose = () => {
    onClose();
    setStep(0);
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitted(false);
    setSubmitError('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const patient = await createPatient({
        doctorId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender || undefined,
        status: form.status,
        riskLevel: form.riskLevel,
        diagnoses: [form.diagnosis.trim()],
        seizureFrequency: form.seizureFrequency.trim() || undefined,
        locationEnabled: form.locationEnabled,
        address: {
          country: form.country.trim(),
          city: form.city.trim(),
          state: form.state.trim() || undefined,
          houseAddress: form.houseAddress.trim(),
          zipCode: form.zipCode.trim() || undefined,
        },
        emergencyContact: {
          fullName: form.emergencyFullName.trim(),
          relation: form.emergencyRelation.trim(),
          email: form.emergencyEmail.trim() || undefined,
          phoneCountryCode: form.emergencyPhoneCountryCode,
          phone: form.emergencyPhone.trim(),
        },
      });

      onRegister(patient);
      setSubmitted(true);
      setTimeout(resetAndClose, 1600);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to register patient. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    if (step === STEPS.length - 1) {
      handleSubmit();
      return;
    }

    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <Modal open={open} onClose={resetAndClose} title="Register Patient" className="max-w-lg">
      {submitted ? (
        <div className="flex flex-col items-center text-center py-8 gap-3">
          <CheckCircle2 className="w-12 h-12 text-accent" />
          <p className="text-lg font-semibold text-foreground">
            Patient registered successfully
          </p>
          <p className="text-sm text-muted-foreground">
            {form.name} has been added to your patient roster.
          </p>
        </div>
      ) : (
        <>
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              {STEPS.map((label, index) => (
                <div key={label} className="flex-1 flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                      index < step
                        ? 'bg-primary text-primary-foreground'
                        : index === step
                          ? 'bg-primary/10 text-primary border-2 border-primary'
                          : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        index < step ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-foreground">{STEPS[step]}</p>
          </div>

          {/* Step content */}
          <div className="space-y-4">
            {step === 0 && (
              <>
                <Field label="Full Name" required error={errors.name}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className={inputClass(!!errors.name)}
                    placeholder="Jane Doe"
                  />
                </Field>
                <Field label="Date of Birth" required error={errors.dateOfBirth}>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => update('dateOfBirth', e.target.value)}
                    className={inputClass(!!errors.dateOfBirth)}
                  />
                </Field>
                <Field label="Gender">
                  <select
                    value={form.gender}
                    onChange={(e) => update('gender', e.target.value)}
                    className={inputClass(false)}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field label="Email" required error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className={inputClass(!!errors.email)}
                    placeholder="patient@example.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    className={inputClass(false)}
                    placeholder="+250 7xx xxx xxx"
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Diagnosis" required error={errors.diagnosis}>
                  <input
                    type="text"
                    value={form.diagnosis}
                    onChange={(e) => update('diagnosis', e.target.value)}
                    className={inputClass(!!errors.diagnosis)}
                    placeholder="e.g. Focal Seizures"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Risk Level">
                    <select
                      value={form.riskLevel}
                      onChange={(e) => update('riskLevel', e.target.value)}
                      className={inputClass(false)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      value={form.status}
                      onChange={(e) => update('status', e.target.value)}
                      className={inputClass(false)}
                    >
                      <option value="stable">Stable</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="alert">Alert</option>
                      <option value="offline">Offline</option>
                    </select>
                  </Field>
                </div>
                <Field label="Seizure Frequency">
                  <input
                    type="text"
                    value={form.seizureFrequency}
                    onChange={(e) => update('seizureFrequency', e.target.value)}
                    className={inputClass(false)}
                    placeholder="e.g. 2-3 per week"
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Address</h3>
                  <p className="text-xs text-muted-foreground">
                    Provide address details for the patient
                  </p>
                </div>
                <Field label="Country" required error={errors.country}>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => update('country', e.target.value)}
                    className={inputClass(!!errors.country)}
                    placeholder="Country"
                  />
                </Field>
                <Field label="City" required error={errors.city}>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    className={inputClass(!!errors.city)}
                    placeholder="City"
                  />
                </Field>
                <Field label="State">
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                    className={inputClass(false)}
                    placeholder="State / Province"
                  />
                </Field>
                <Field label="House Address" required error={errors.houseAddress}>
                  <input
                    type="text"
                    value={form.houseAddress}
                    onChange={(e) => update('houseAddress', e.target.value)}
                    className={inputClass(!!errors.houseAddress)}
                    placeholder="House Address"
                  />
                </Field>
                <Field label="ZIP Code">
                  <input
                    type="text"
                    value={form.zipCode}
                    onChange={(e) => update('zipCode', e.target.value)}
                    className={inputClass(false)}
                    placeholder="ZIP Code"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.locationEnabled}
                    onChange={(e) => update('locationEnabled', e.target.checked)}
                    className="w-4 h-4 rounded border border-border"
                  />
                  Enable location sharing
                </label>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Emergency Contact
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Provide primary emergency contact
                  </p>
                </div>
                <Field label="Full Names" required error={errors.emergencyFullName}>
                  <input
                    type="text"
                    value={form.emergencyFullName}
                    onChange={(e) => update('emergencyFullName', e.target.value)}
                    className={inputClass(!!errors.emergencyFullName)}
                    placeholder="Full Names"
                  />
                </Field>
                <Field label="Relation to Patient" required error={errors.emergencyRelation}>
                  <input
                    type="text"
                    value={form.emergencyRelation}
                    onChange={(e) => update('emergencyRelation', e.target.value)}
                    className={inputClass(!!errors.emergencyRelation)}
                    placeholder="e.g. Parent, Spouse, Sibling"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={form.emergencyEmail}
                    onChange={(e) => update('emergencyEmail', e.target.value)}
                    className={inputClass(false)}
                    placeholder="Email"
                  />
                </Field>
                <Field label="Phone Number" required error={errors.emergencyPhone}>
                  <div
                    className={`flex items-stretch rounded-lg border bg-background overflow-hidden ${
                      errors.emergencyPhone ? 'border-destructive' : 'border-border'
                    }`}
                  >
                    <select
                      value={form.emergencyPhoneCountryCode}
                      onChange={(e) =>
                        update('emergencyPhoneCountryCode', e.target.value)
                      }
                      className="px-2 py-2 text-sm bg-transparent border-r border-border focus:outline-none"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={form.emergencyPhone}
                      onChange={(e) => update('emergencyPhone', e.target.value)}
                      placeholder="Phone Number"
                      className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none text-foreground"
                    />
                  </div>
                </Field>
              </>
            )}
          </div>

          {submitError && (
            <div className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            <button
              type="button"
              onClick={step === 0 ? resetAndClose : handleBack}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting
                ? 'Submitting...'
                : step === STEPS.length - 1
                  ? 'Submit'
                  : 'Next'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm ${
    hasError ? 'border-destructive' : 'border-border'
  }`;
}
