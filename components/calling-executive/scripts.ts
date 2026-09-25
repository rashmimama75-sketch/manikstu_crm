// Short call scripts per product vertical (vertical ids from data/managerDashboard.ts).
// {customer} and {caller} are filled in when shown.

export interface CallScript {
  opening: string;
  points: string[];
  close: string;
}

const GENERIC: CallScript = {
  opening: 'Namaskar {customer}, this is {caller} calling from Manikstu Agri Network. Is this a good time to talk for two minutes?',
  points: [
    'Confirm what they were interested in and how many goats they keep.',
    'Answer questions on price, delivery and payment (UPI or cash on delivery).',
    'Agree a clear next step before ending the call.',
  ],
  close: 'Thank you {customer}. I will call you back as agreed. You can also reach us on our helpline any time.',
};

const SCRIPTS: Record<number, CallScript> = {
  1: {
    opening: 'Namaskar {customer}, this is {caller} from Manikstu. You asked about our goat health products. Is now a good time?',
    points: [
      'Ask how many goats they have and any current health problems (worms, fever, weak kids).',
      'Suggest the right kit: deworming, mineral mixture or vaccination support.',
      'Explain dosage simply and that delivery reaches the village in 3–5 days.',
      'Offer to book the order now; payment by UPI or cash on delivery.',
    ],
    close: 'Thank you {customer}. Your order details will come by SMS. Please call us if the goats show any new symptoms.',
  },
  2: {
    opening: 'Namaskar {customer}, this is {caller} from Manikstu calling about goat insurance. Do you have two minutes?',
    points: [
      'Ask how many goats they want to insure and their approximate age and value.',
      'Explain the cover: death due to disease or accident, with tagging and a vet check.',
      'Share the premium for their herd size and the documents needed (Aadhaar, photos).',
      'Book a tagging visit with the field agent if they agree.',
    ],
    close: 'Thank you {customer}. Our field agent will call before the tagging visit. Keep your Aadhaar ready.',
  },
  3: {
    opening: 'Namaskar {customer}, this is {caller} from Manikstu about the Goat Bank scheme. Is this a good time?',
    points: [
      'Check whether they want to take goats under the scheme or return kids from an earlier loan.',
      'Explain the terms: goats given now, kids returned to the bank later, no cash interest.',
      'Confirm eligibility: village, SHG or FPO membership, shed space.',
      'Set up the enrolment visit and list the documents to keep ready.',
    ],
    close: 'Thank you {customer}. We will confirm the enrolment visit date by SMS.',
  },
};

export const scriptFor = (verticalId: number): CallScript => SCRIPTS[verticalId] ?? GENERIC;

export const fillScript = (text: string, customer: string, caller: string) =>
  text.replace(/\{customer\}/g, customer.split(' ')[0]).replace(/\{caller\}/g, caller.split(' ')[0]);
