// Profile photo: pick from the gallery, crop square, shrink, upload to avatars/<user id>/ and
// return its public URL (the caller saves it on the profile).
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import { compress } from './stories';

/** Returns the new photo URL, or null if the person cancelled. Throws a friendly error on failure. */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  if (!supabase) throw new Error('Profile photos need an internet connection to our servers.');
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  const out = await compress({ uri: a.uri, width: a.width, height: a.height }, 512, 0.82);
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(path, decode(out.base64 ?? ''), { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error('Photo upload failed. Please check your connection and try again.');
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
