// Partner onboarding (hotels & homestays first). Data lives in Supabase `partners` and
// `partner_documents`; verification files go to the PRIVATE `partner-docs` bucket and are only
// readable by the partner who uploaded them and by staff (through short-lived signed links).
import { useCallback, useEffect, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { supabase } from './supabase';

export type PartnerKind = 'hotel' | 'homestay' | 'cab' | 'trek';
export type PartnerStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'suspended';
export type DocType = 'owner_id' | 'pan_vat' | 'company_registration' | 'tourism_license' | 'homestay_registration' | 'bank_proof' | 'property_photo' | 'other';

export interface Partner {
  id: string;
  owner_id: string;
  kind: PartnerKind;
  status: PartnerStatus;
  business_name: string;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  address: string | null;
  pan_vat: string | null;
  rooms_count: number | null;
  about: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  commission_pct: number;
  agreement_accepted_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export interface PartnerDoc { id: string; partner_id: string; doc_type: DocType; path: string; file_name: string | null; mime: string | null; created_at: string }

export type PartnerFields = Pick<Partner, 'kind' | 'business_name' | 'owner_name' | 'email' | 'phone' | 'whatsapp' | 'city' | 'address' | 'pan_vat' | 'rooms_count' | 'about' | 'bank_name' | 'bank_account_name' | 'bank_account_number' | 'bank_branch'>;

export const AGREEMENT_VERSION = '2026-11-v1';
export const COMMISSION_PCT = 10;

export const KIND_LABEL: Record<PartnerKind, string> = { hotel: 'Hotel', homestay: 'Homestay', cab: 'Cab / transport', trek: 'Trek / tour operator' };
export const STATUS_TEXT: Record<PartnerStatus, string> = {
  draft: 'Application not sent yet',
  submitted: 'Under review',
  approved: 'Verified partner',
  rejected: 'Needs changes',
  suspended: 'Paused',
};

/** Documents we ask for, per partner type. `required` matches the checks in submit_partner_application(). */
export function docsFor(kind: PartnerKind): { type: DocType; label: string; hint: string; required: boolean }[] {
  const common = [
    { type: 'owner_id' as const, label: 'Owner’s citizenship or passport', hint: 'Front and back, clear photo or PDF', required: true },
    { type: 'pan_vat' as const, label: 'PAN / VAT certificate', hint: 'Issued by the Inland Revenue Department', required: true },
  ];
  const specific =
    kind === 'homestay'
      ? [{ type: 'homestay_registration' as const, label: 'Homestay registration', hint: 'From your municipality or tourism office', required: true }]
      : [
          { type: 'company_registration' as const, label: 'Company / firm registration', hint: 'Office of the Company Registrar or ward office', required: false },
          { type: 'tourism_license' as const, label: 'Tourism licence', hint: 'Department of Tourism licence or classification (one of these two is required)', required: false },
        ];
  return [
    ...common,
    ...specific,
    { type: 'bank_proof' as const, label: 'Bank proof', hint: 'Cheque leaf or bank letter with the account name', required: false },
    { type: 'property_photo' as const, label: 'Photos of your property', hint: 'Outside, reception, a room — add at least one', required: true },
  ];
}

/** The signed-in person's partner application (or null), with its documents. */
export function useMyPartner(userId?: string) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [docs, setDocs] = useState<PartnerDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase || !userId) {
      setPartner(null);
      setDocs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('partners').select('*').eq('owner_id', userId).maybeSingle();
    setPartner((data as Partner) ?? null);
    if (data) {
      const { data: d } = await supabase.from('partner_documents').select('*').eq('partner_id', data.id).order('created_at');
      setDocs((d as PartnerDoc[]) ?? []);
    } else setDocs([]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading data from the server for this user
    refresh();
  }, [refresh]);

  return { partner, docs, loading, refresh };
}

const friendly = (m?: string) => (m ?? 'Something went wrong. Please try again.').replace(/^.*?ERROR:\s*/i, '');

/** Creates the draft on first save, then updates it. */
export async function savePartner(userId: string, existing: Partner | null, fields: Partial<PartnerFields>): Promise<Partner> {
  if (!supabase) throw new Error('Partner sign-up needs an internet connection.');
  const q = existing
    ? supabase.from('partners').update(fields).eq('id', existing.id).select('*').single()
    : supabase.from('partners').insert({ owner_id: userId, kind: fields.kind ?? 'hotel', business_name: fields.business_name ?? '', ...fields }).select('*').single();
  const { data, error } = await q;
  if (error) throw new Error(error.message.includes('row-level security') ? 'This application can’t be changed while it is being reviewed.' : friendly(error.message));
  return data as Partner;
}

type Picked = { uri: string; name: string; mime: string; size?: number };

/** Lets the partner choose a PDF or photo from files, or a photo from the gallery. */
export async function pickDocument(source: 'files' | 'photos'): Promise<Picked | null> {
  if (source === 'photos') {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (r.canceled || !r.assets?.[0]) return null;
    const a = r.assets[0];
    return { uri: a.uri, name: a.fileName ?? 'photo.jpg', mime: a.mimeType ?? 'image/jpeg', size: a.fileSize };
  }
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true });
  if (r.canceled || !r.assets?.[0]) return null;
  const a = r.assets[0];
  return { uri: a.uri, name: a.name, mime: a.mimeType ?? 'application/pdf', size: a.size };
}

export async function uploadPartnerDoc(userId: string, partner: Partner, type: DocType, file: Picked): Promise<void> {
  if (!supabase) throw new Error('Uploading needs an internet connection.');
  if (file.size && file.size > 10 * 1024 * 1024) throw new Error('That file is over 10 MB. Please choose a smaller one.');
  const ext = file.mime === 'application/pdf' ? 'pdf' : file.mime === 'image/png' ? 'png' : file.mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${type}-${Date.now()}.${ext}`;
  const bytes = await new File(file.uri).arrayBuffer();
  const up = await supabase.storage.from('partner-docs').upload(path, bytes, { contentType: file.mime, upsert: false });
  if (up.error) throw new Error('Upload failed. Please check your connection and try again.');
  const { error } = await supabase.from('partner_documents').insert({ partner_id: partner.id, doc_type: type, path, file_name: file.name.slice(0, 200), mime: file.mime });
  if (error) {
    await supabase.storage.from('partner-docs').remove([path]);
    throw new Error(error.message.includes('row-level security') ? 'Documents can’t be changed while the application is being reviewed.' : friendly(error.message));
  }
}

export async function removePartnerDoc(doc: PartnerDoc): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('partner_documents').delete().eq('id', doc.id);
  if (error) throw new Error(friendly(error.message));
  await supabase.storage.from('partner-docs').remove([doc.path]);
}

export async function submitPartnerApplication(): Promise<void> {
  if (!supabase) throw new Error('Sending needs an internet connection.');
  const { error } = await supabase.rpc('submit_partner_application', { agreement: AGREEMENT_VERSION });
  if (error) throw new Error(friendly(error.message));
}

/* ---------- staff ---------- */

export async function listPartners(status: PartnerStatus | 'all'): Promise<Partner[]> {
  if (!supabase) return [];
  let q = supabase.from('partners').select('*').order('submitted_at', { ascending: false, nullsFirst: false }).limit(200);
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new Error(friendly(error.message));
  return (data as Partner[]) ?? [];
}

export async function getPartnerForStaff(id: string): Promise<{ partner: Partner; docs: PartnerDoc[] } | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('partners').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  const { data: d } = await supabase.from('partner_documents').select('*').eq('partner_id', id).order('doc_type');
  return { partner: data as Partner, docs: (d as PartnerDoc[]) ?? [] };
}

/** A link to view a private document, valid for 10 minutes. */
export async function docLink(path: string): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.storage.from('partner-docs').createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

export async function reviewPartner(id: string, decision: 'approved' | 'rejected' | 'suspended', note?: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('review_partner', { partner_id: id, decision, note: note ?? null });
  if (error) throw new Error(friendly(error.message));
}
