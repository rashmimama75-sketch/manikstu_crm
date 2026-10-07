// State and district for an order or customer address. The backend stores city, state and pincode
// but no district. The state comes from the stored name (or the PIN code's first digits); Odisha
// districts are worked out from the PIN code, falling back to the town name. For other states the
// town is shown until the backend stores the district directly.

/** All 28 states. */
export const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const;

/** All 8 union territories. */
export const INDIA_UTS = [
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;

const ALIASES: Record<string, string> = {
  orissa: 'Odisha', 'nct of delhi': 'Delhi', 'new delhi': 'Delhi', pondicherry: 'Puducherry', 'j&k': 'Jammu and Kashmir',
  'jammu & kashmir': 'Jammu and Kashmir', 'andaman & nicobar islands': 'Andaman and Nicobar Islands', uttaranchal: 'Uttarakhand',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu', 'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  up: 'Uttar Pradesh', mp: 'Madhya Pradesh', wb: 'West Bengal', tn: 'Tamil Nadu', ap: 'Andhra Pradesh',
};

// State from a PIN code's first digits (postal circles). Longest match wins.
const STATE_BY_PIN: [string, string][] = [
  ['11', 'Delhi'], ['12', 'Haryana'], ['13', 'Haryana'], ['14', 'Punjab'], ['15', 'Punjab'], ['160', 'Chandigarh'],
  ['16', 'Punjab'], ['17', 'Himachal Pradesh'], ['18', 'Jammu and Kashmir'], ['19', 'Jammu and Kashmir'], ['194', 'Ladakh'],
  ['20', 'Uttar Pradesh'], ['21', 'Uttar Pradesh'], ['22', 'Uttar Pradesh'], ['23', 'Uttar Pradesh'], ['24', 'Uttar Pradesh'],
  ['246', 'Uttarakhand'], ['247', 'Uttarakhand'], ['248', 'Uttarakhand'], ['249', 'Uttarakhand'], ['25', 'Uttar Pradesh'],
  ['26', 'Uttarakhand'], ['27', 'Uttar Pradesh'], ['28', 'Uttar Pradesh'], ['30', 'Rajasthan'], ['31', 'Rajasthan'],
  ['32', 'Rajasthan'], ['33', 'Rajasthan'], ['34', 'Rajasthan'], ['36', 'Gujarat'], ['37', 'Gujarat'], ['38', 'Gujarat'],
  ['39', 'Gujarat'], ['396', 'Dadra and Nagar Haveli and Daman and Diu'], ['40', 'Maharashtra'], ['403', 'Goa'],
  ['41', 'Maharashtra'], ['42', 'Maharashtra'], ['43', 'Maharashtra'], ['44', 'Maharashtra'], ['45', 'Madhya Pradesh'],
  ['46', 'Madhya Pradesh'], ['47', 'Madhya Pradesh'], ['48', 'Madhya Pradesh'], ['49', 'Chhattisgarh'], ['50', 'Telangana'],
  ['51', 'Andhra Pradesh'], ['52', 'Andhra Pradesh'], ['53', 'Andhra Pradesh'], ['56', 'Karnataka'], ['57', 'Karnataka'],
  ['58', 'Karnataka'], ['59', 'Karnataka'], ['60', 'Tamil Nadu'], ['605', 'Puducherry'], ['61', 'Tamil Nadu'], ['62', 'Tamil Nadu'],
  ['63', 'Tamil Nadu'], ['64', 'Tamil Nadu'], ['67', 'Kerala'], ['68', 'Kerala'], ['6825', 'Lakshadweep'], ['69', 'Kerala'],
  ['70', 'West Bengal'], ['71', 'West Bengal'], ['72', 'West Bengal'], ['73', 'West Bengal'], ['737', 'Sikkim'],
  ['74', 'West Bengal'], ['744', 'Andaman and Nicobar Islands'], ['75', 'Odisha'], ['76', 'Odisha'], ['77', 'Odisha'],
  ['78', 'Assam'], ['790', 'Arunachal Pradesh'], ['791', 'Arunachal Pradesh'], ['792', 'Arunachal Pradesh'], ['793', 'Meghalaya'],
  ['794', 'Meghalaya'], ['795', 'Manipur'], ['796', 'Mizoram'], ['797', 'Nagaland'], ['798', 'Nagaland'], ['799', 'Tripura'],
  ['80', 'Bihar'], ['81', 'Bihar'], ['814', 'Jharkhand'], ['815', 'Jharkhand'], ['816', 'Jharkhand'], ['82', 'Bihar'],
  ['825', 'Jharkhand'], ['826', 'Jharkhand'], ['827', 'Jharkhand'], ['828', 'Jharkhand'], ['829', 'Jharkhand'], ['83', 'Jharkhand'],
  ['84', 'Bihar'], ['85', 'Bihar'],
];

const longestPrefix = (pin: string, table: [string, string][]) =>
  table.filter(([p]) => pin.startsWith(p)).sort((a, b) => b[0].length - a[0].length)[0]?.[1];

/** State or UT for an address: the stored state if it's a known name, otherwise from the PIN code. */
export function stateFor(state: string | null | undefined, pincode: string | null | undefined): string {
  const t = (state ?? '').trim().toLowerCase();
  const known = [...INDIA_STATES, ...INDIA_UTS].find(s => s.toLowerCase() === t) ?? ALIASES[t];
  if (known) return known;
  const pin = (pincode ?? '').replace(/\D/g, '');
  return (pin.length === 6 && longestPrefix(pin, STATE_BY_PIN)) || 'Unknown';
}

export const ODISHA_DISTRICTS = [
  'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati',
  'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Keonjhar', 'Khordha',
  'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur',
  'Subarnapur', 'Sundargarh',
] as const;

// Odisha PIN code prefixes → district (longest match wins). Approximate at area level, good enough for a sales report.
const ODISHA_BY_PIN: [string, string][] = [
  ['751', 'Khordha'], ['7520', 'Puri'], ['7521', 'Khordha'], ['7522', 'Nayagarh'], ['753', 'Cuttack'],
  ['7540', 'Cuttack'], ['7541', 'Jagatsinghpur'], ['7542', 'Kendrapara'], ['755', 'Jajpur'], ['7550', 'Jajpur'],
  ['7560', 'Balasore'], ['7561', 'Bhadrak'], ['757', 'Mayurbhanj'], ['758', 'Keonjhar'], ['7590', 'Dhenkanal'],
  ['7591', 'Angul'], ['760', 'Ganjam'], ['7610', 'Ganjam'], ['7612', 'Gajapati'], ['762', 'Kandhamal'],
  ['7620', 'Kandhamal'], ['7630', 'Nabarangpur'], ['764', 'Koraput'], ['7640', 'Koraput'], ['7644', 'Nabarangpur'],
  ['7645', 'Malkangiri'], ['765', 'Rayagada'], ['7660', 'Kalahandi'], ['7661', 'Nuapada'], ['767', 'Balangir'],
  ['7670', 'Balangir'], ['7671', 'Subarnapur'], ['7680', 'Sambalpur'], ['7681', 'Deogarh'], ['7682', 'Jharsuguda'],
  ['7683', 'Bargarh'], ['769', 'Sundargarh'], ['770', 'Sundargarh'],
];

// Odisha town names → district, for addresses without a usable PIN code.
const ODISHA_BY_TOWN: Record<string, string> = {
  bhubaneswar: 'Khordha', khordha: 'Khordha', puri: 'Puri', cuttack: 'Cuttack', berhampur: 'Ganjam', brahmapur: 'Ganjam',
  sambalpur: 'Sambalpur', balasore: 'Balasore', baleswar: 'Balasore', koraput: 'Koraput', jeypore: 'Koraput',
  rayagada: 'Rayagada', bolangir: 'Balangir', balangir: 'Balangir', keonjhar: 'Keonjhar', kendujhar: 'Keonjhar',
  angul: 'Angul', baripada: 'Mayurbhanj', rairangpur: 'Mayurbhanj', karanjia: 'Mayurbhanj', udala: 'Mayurbhanj',
  bhadrak: 'Bhadrak', jajpur: 'Jajpur', dhenkanal: 'Dhenkanal', rourkela: 'Sundargarh', sundargarh: 'Sundargarh',
  bargarh: 'Bargarh', jharsuguda: 'Jharsuguda', bhawanipatna: 'Kalahandi', phulbani: 'Kandhamal', nayagarh: 'Nayagarh',
  kendrapara: 'Kendrapara', jagatsinghpur: 'Jagatsinghpur', paradip: 'Jagatsinghpur',
};

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

/**
 * District for an address. Odisha: from the PIN code, or the town name. Other states: the town, until
 * the backend stores the district.
 */
export function districtFor(state: string | null | undefined, pincode: string | null | undefined, city: string | null | undefined): string {
  const town = (city ?? '').trim();
  if (stateFor(state, pincode) === 'Odisha') {
    const pin = (pincode ?? '').replace(/\D/g, '');
    return longestPrefix(pin, ODISHA_BY_PIN) ?? ODISHA_BY_TOWN[town.toLowerCase()] ?? (town ? titleCase(town) : 'Unknown');
  }
  return town ? titleCase(town) : 'Unknown';
}
