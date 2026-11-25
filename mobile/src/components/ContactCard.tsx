import { Linking, Pressable, Text, View } from 'react-native';
import { colors, type } from '@/theme';
import { CONTACT } from '@/data/tours';
import { directionsUrl } from '@/lib/contact';
import { Card, Meta, SoftButton } from './ui';
import { ClockIcon, EnvelopeSimpleIcon, MapPinIcon, PhoneIcon, WhatsappLogoIcon } from './icons';

const digits = (s: string) => s.replace(/[^\d+]/g, '');

/** Office address, email, optional phone / WhatsApp and directions. */
export function ContactCard() {
  const phone = (CONTACT as { phone?: string }).phone ?? '';
  const whatsapp = (CONTACT as { whatsapp?: string }).whatsapp ?? '';
  return (
    <Card style={{ gap: 12 }}>
      <Text style={type.headlineMd}>Contact Mountain Planet</Text>
      <Meta icon={MapPinIcon}>{CONTACT.address}</Meta>
      <Pressable onPress={() => Linking.openURL(`mailto:${CONTACT.email}`)} accessibilityRole="link" accessibilityLabel={`Email ${CONTACT.email}`}>
        <Meta icon={EnvelopeSimpleIcon}>{CONTACT.email}</Meta>
      </Pressable>
      <Meta icon={ClockIcon}>Replies within 24 hours, 7 days a week</Meta>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        {phone ? <SoftButton label="Call us" icon={PhoneIcon} onPress={() => Linking.openURL(`tel:${digits(phone)}`)} /> : null}
        {whatsapp ? <SoftButton label="WhatsApp" icon={WhatsappLogoIcon} onPress={() => Linking.openURL(`https://wa.me/${digits(whatsapp).replace('+', '')}`)} /> : null}
        <SoftButton label="Directions" icon={MapPinIcon} onPress={() => Linking.openURL(directionsUrl())} />
      </View>
      {!phone && !whatsapp ? null : <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>Nepal time is UTC+5:45.</Text>}
    </Card>
  );
}
