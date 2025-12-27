// Database utilities using Supabase
// Requires Supabase configuration via environment variables

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase configuration is required. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY environment variables.'
  );
}

// Single client using publishable key for all operations
export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface Chat {
  id: string;
  created_at: string;
  expires_at: string;
  status: 'active' | 'closed' | 'expired';
}

export interface Message {
  id: string;
  chat_id: string;
  sender: 'patient' | 'doctor';
  content: string;
  created_at: string;
}

export interface IntakeData {
  chat_id: string;
  age: number | null;
  sex: 'Male' | 'Female' | null;
  complaint: string | null;
  duration: string | null;
  emergency: boolean | null;
  emergency_symptoms: string[] | null;
  conditions: string | null;
  medications: string | null;
  completed_at: string | null;
}

export interface Doctor {
  id: string;
  email: string;
  password_hash: string;
  fcm_tokens: string[];
  created_at: string;
}

// Chat operations
export async function createChat(): Promise<Chat> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const { data, error } = await supabase
    .from('chats')
    .insert({
      expires_at: expiresAt.toISOString(),
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function expireChats() {
  const { error } = await supabase
    .from('chats')
    .update({ status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'active');

  if (error) throw error;
}

// Message operations
export async function createMessage(
  chatId: string,
  sender: 'patient' | 'doctor',
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error(`[createMessage] Failed to create ${sender} message:`, error);
    if (error.code === '42501') {
      console.error('[createMessage] RLS policy error. Make sure you have applied the RLS policies:');
      console.error('  - "Allow doctor message insert" policy for sender="doctor"');
      console.error('  - "Allow anonymous message insert" policy for sender="patient"');
    }
    throw error;
  }
  return data;
}

export async function getMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Intake operations
export async function saveIntakeData(
  chatId: string,
  intake: Partial<IntakeData>
): Promise<IntakeData> {
  const { data, error } = await supabase
    .from('intake_data')
    .upsert({
      chat_id: chatId,
      ...intake,
      completed_at: intake.completed_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getIntakeData(chatId: string): Promise<IntakeData | null> {
  const { data, error } = await supabase
    .from('intake_data')
    .select('*')
    .eq('chat_id', chatId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// Doctor operations
export async function getDoctorByEmail(email: string): Promise<Doctor | null> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getAllChats(): Promise<(Chat & { last_message?: Message; intake?: IntakeData })[]> {
  const { data: chats, error } = await supabase
    .from('chats')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get last message and intake for each chat
  const chatsWithDetails = await Promise.all(
    (chats || []).map(async (chat) => {
      const [messages, intake] = await Promise.all([
        getMessages(chat.id),
        getIntakeData(chat.id),
      ]);

      return {
        ...chat,
        last_message: messages[messages.length - 1],
        intake: intake || undefined,
      };
    })
  );

  return chatsWithDetails;
}

export async function getAllDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function updateDoctorFCMTokens(
  doctorId: string,
  tokens: string[]
): Promise<void> {
  const { error } = await supabase
    .from('doctors')
    .update({ fcm_tokens: tokens })
    .eq('id', doctorId);

  if (error) throw error;
}
