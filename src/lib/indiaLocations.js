export const IN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

// Curated “wedding-relevant” city list per state (searchable + allows custom text too).
// Keep this file lightweight; dropdown still supports free text for any city.
export const IN_CITIES_BY_STATE = {
  Delhi: ["Delhi", "New Delhi", "Noida", "Gurugram", "Faridabad", "Ghaziabad"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Kolhapur"],
  Rajasthan: ["Jaipur", "Udaipur", "Jodhpur", "Ajmer", "Pushkar", "Bikaner", "Kota"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Ghaziabad", "Varanasi", "Agra", "Kanpur", "Prayagraj"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Tirupati", "Guntur", "Kurnool"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  "West Bengal": ["Kolkata", "Siliguri", "Howrah", "Durgapur", "Asansol"],
  Punjab: ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  Assam: ["Guwahati", "Dibrugarh", "Silchar", "Jorhat"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Puri"],
  Goa: ["Panaji", "Margao", "Vasco da Gama"],
  Chandigarh: ["Chandigarh"],
  Uttarakhand: ["Dehradun", "Haridwar", "Rishikesh", "Nainital"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan"],
  "Jammu and Kashmir": ["Srinagar", "Jammu"],
  Ladakh: ["Leh", "Kargil"],
  Puducherry: ["Puducherry"],
};

export function normalizeText(v) {
  return String(v || "").trim();
}

export function buildLocationLabel(city, state) {
  const c = normalizeText(city);
  const s = normalizeText(state);
  if (!c && !s) return "";
  // Always include the comma so the string can round-trip "state-only"
  // vs "city-only" without ambiguity. "Maharashtra" alone was being
  // mis-parsed back into the city field on re-render.
  return `${c}, ${s}`;
}

/**
 * Inverse of buildLocationLabel. Returns `{ city, state }`. Treats empty
 * segments as truly empty (so ", Maharashtra" → { city: "", state: "Maharashtra" }).
 *
 * Backwards-compat: a string with no comma is assumed to be the city
 * (matches old "City"-only payloads stored before the comma-always fix).
 */
export function parseLocationLabel(raw) {
  const s = normalizeText(raw);
  if (!s) return { city: "", state: "" };
  if (!s.includes(",")) {
    return { city: s, state: "" };
  }
  const [first, ...rest] = s.split(",");
  return {
    city: normalizeText(first),
    state: normalizeText(rest.join(",")),
  };
}

