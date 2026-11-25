// Privacy policy and terms — shared by the app (src/app/legal) and the website generator.
// Have a lawyer review these before launch.

export const LEGAL_UPDATED = '25 November 2026';

interface Contact { email: string; address: string }

export const privacySections = (c: Contact): [string, string][] => [
  ['Who we are', `Mountain Planet Nepal (“we”) runs this app and website. Contact us at ${c.email} or ${c.address}.`],
  ['What we collect', 'If you create an account: your name, email, and optionally phone number, nationality and preferred currency. When you book or send a trip request: your contact details, dates, guests and the choices you make. When you share a story or review: the text, rating and photos you add. If you allow notifications: a device token so we can tell you about your bookings. When you chat with Planet AI: the messages you type, to answer them.'],
  ['Crash reports and usage statistics', 'To fix problems and improve the app we record crash reports (Sentry) and anonymous usage events such as which screens are opened and whether a booking was sent (PostHog). These do not include your name, email or what you type.'],
  ['What we do not collect', 'We do not track your location, read your contacts, or sell your data. Card and Khalti payments are handled by those providers; we never see or store your card number or wallet PIN.'],
  ['How we use it', 'To arrange and confirm your bookings, reply to requests, send booking updates by email and push notification, answer your questions in Planet AI, show stories and reviews you chose to share (after our team approves them), and keep your saved trips in sync across devices.'],
  ['Who we share it with', 'Only the partners needed to deliver your booking (for example the hotel, driver or airline), and our service providers: Supabase (database and accounts), Resend (email), Expo (push notifications), Khalti and Stripe (payments), Anthropic (Planet AI answers), Sentry (crash reports) and PostHog (usage statistics). Each processes data only to provide their service.'],
  ['How long we keep it', 'Account data until you delete your account. Booking records as long as required for accounting and legal reasons. You can delete your account at any time in the app (Account → Delete my account); this removes your profile and saved trips.'],
  ['Your rights', `You can ask to see, correct or delete your data by emailing ${c.email}.`],
  ['Children', 'The app is not directed at children under 13, and we do not knowingly collect their data.'],
  ['Changes', 'If we change this policy we will update the date below and, for important changes, tell you in the app.'],
];

export const termsSections = (): [string, string][] => [
  ['Bookings are requests', 'When you book a hotel, homestay, ride, flight, ticket or trip, you send a request. It becomes a confirmed booking only after our team confirms availability and price and, where required, you pay.'],
  ['Prices and payment', 'Prices are shown in US dollars; other currencies are estimates for convenience. The amount charged is the one shown at payment (USD by card, or NPR by Khalti at the rate stated). Taxes and fees are listed in your quote.'],
  ['Changes and cancellations', 'You can cancel in the app before you pay. After payment, the cancellation policy in your quote applies; contact us to change or cancel. Mountain flights and treks can be affected by weather — we will help rearrange plans but cannot control airlines or conditions.'],
  ['Sample listings', 'Stays marked “Sample” illustrate the kind of property we arrange; we confirm the actual property before you pay.'],
  ['Planet AI', 'Planet AI answers are generated automatically and may be wrong. Prices, availability and permits are confirmed only by our team.'],
  ['Your safety', 'Trekking at altitude has risks. Travel insurance covering emergency helicopter rescue is required for treks. Follow your guide’s instructions. Health information in the app is general guidance, not medical advice.'],
  ['Your content', 'When you share a story, photos or a review, you confirm you have the right to share them and allow us to show them in the app and on our website. You can ask us to remove them at any time.'],
  ['Accounts', 'Keep your sign-in details private. We may suspend accounts that misuse the app, post abusive content or attempt fraud.'],
  ['Liability', 'We arrange services provided by local partners and take care in choosing them. To the extent allowed by law, our liability is limited to the amount you paid us for the affected booking.'],
  ['Law', 'These terms are governed by the laws of Nepal.'],
];
