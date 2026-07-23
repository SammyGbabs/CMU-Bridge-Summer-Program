import { createClient } from '@/lib/supabase/client';
import { Conversation, Message, MessageType, UserRole, Patient } from '@/lib/types';

interface PatientRow {
  id: string;
  name: string;
  photo: string | null;
  status: Patient['status'];
}

interface ConversationRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  created_at: string;
  updated_at: string;
  patients?: PatientRow | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  type: MessageType;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  timestamp: string;
}

export interface ConversationWithPatient extends Conversation {
  patient?: {
    name: string;
    photo?: string;
    status: Patient['status'];
  };
}

function mapConversation(row: ConversationRow): ConversationWithPatient {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    participantIds: [row.patient_id, row.doctor_id],
    participantNames: [row.patients?.name ?? 'Unknown', ''],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    patient: row.patients
      ? {
          name: row.patients.name,
          photo: row.patients.photo ?? undefined,
          status: row.patients.status,
        }
      : undefined,
  };
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    type: row.type,
    content: row.content,
    attachmentUrl: row.attachment_url ?? undefined,
    isRead: row.is_read,
    timestamp: new Date(row.timestamp),
  };
}

export async function getUnreadMessageCount(doctorId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('messages')
    .select('id, conversations!inner(doctor_id)', { count: 'exact', head: true })
    .eq('conversations.doctor_id', doctorId)
    .eq('is_read', false)
    .neq('sender_role', 'doctor');

  if (error) return 0;
  return count ?? 0;
}

export async function listConversations(doctorId: string): Promise<ConversationWithPatient[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*, patients(id, name, photo, status)')
    .eq('doctor_id', doctorId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as ConversationRow[]).map(mapConversation);
}

export async function getOrCreateConversation(
  doctorId: string,
  patientId: string
): Promise<ConversationWithPatient> {
  const supabase = createClient();

  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*, patients(id, name, photo, status)')
    .eq('doctor_id', doctorId)
    .eq('patient_id', patientId)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return mapConversation(existing as ConversationRow);

  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({ doctor_id: doctorId, patient_id: patientId })
    .select('*, patients(id, name, photo, status)')
    .single();

  if (createError) throw createError;
  return mapConversation(created as ConversationRow);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_role', 'doctor');
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return (data as MessageRow[]).map(mapMessage);
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
}): Promise<Message> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      sender_name: input.senderName,
      sender_role: input.senderRole,
      type: 'text',
      content: input.content,
      is_read: false,
    })
    .select('*')
    .single();

  if (error) throw error;

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', input.conversationId);

  return mapMessage(data as MessageRow);
}
