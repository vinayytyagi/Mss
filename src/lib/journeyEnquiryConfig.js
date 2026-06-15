/**
 * journeyEnquiryConfig — declarative form definitions for the four
 * "enquiry / request-builder" journey steps (per the Part 1 / Part 2
 * mockups): honeymoon, pagfera, streedhan, wedding-invitation.
 *
 * Rendered by <JourneyEnquiryPage>. Section types:
 *   destinationPicker — segmented toggle + single-select tile grid + "other" input
 *   formGrid          — labelled selects / date / text / textarea fields
 *   checkCards        — multi-select checklist cards (+ optional chip row)
 *   chipsWithText     — multi-select chip row + free-text textarea
 *   serviceCards      — multi-select gating cards ("What do you need?")
 *   serviceBlocks     — per-service detail blocks, disabled until the
 *                       matching serviceCards entry is selected
 *   optionCards       — single-select option cards (+ optional custom input)
 *
 * All field keys are globally unique within a step — page state is one
 * flat object keyed by them.
 */

const HONEYMOON = {
  heroBadges: [
    { icon: "✈️", label: "Domestic & International" },
    { icon: "🛡️", label: "Verified hotels & operators" },
    { icon: "💗", label: "Honeymoon room setup included" },
    { icon: "⏱️", label: "Quote within 24 hours" },
  ],
  sections: [
    {
      type: "destinationPicker",
      key: "destination",
      title: "Domestic or International?",
      subtitle: "Choose your travel type — destination options will update below",
      toggles: [
        { value: "domestic", label: "Domestic — Sneh Safar" },
        { value: "international", label: "International" },
      ],
      tileSets: {
        domestic: [
          { icon: "🏖️", name: "Goa", tag: "Beach" },
          { icon: "🏔️", name: "Kashmir", tag: "Mountains" },
          { icon: "🌿", name: "Kerala", tag: "Backwaters" },
          { icon: "🏝️", name: "Andaman", tag: "Islands" },
          { icon: "🏔️", name: "Manali", tag: "Snow" },
          { icon: "🌄", name: "Shimla", tag: "Hills" },
          { icon: "🌺", name: "Ooty", tag: "Nilgiris" },
          { icon: "🏯", name: "Rajasthan", tag: "Royal" },
          { icon: "🌊", name: "Coorg", tag: "Plantations" },
          { icon: "⛰️", name: "Darjeeling", tag: "Tea gardens" },
          { icon: "🌸", name: "Mussoorie", tag: "Hills" },
          { icon: "🏝️", name: "Lakshadweep", tag: "Lagoons" },
        ],
        international: [
          { icon: "🇹🇭", name: "Thailand", tag: "Beaches" },
          { icon: "🇲🇻", name: "Maldives", tag: "Overwater" },
          { icon: "🇮🇩", name: "Bali", tag: "Culture" },
          { icon: "🇸🇬", name: "Singapore", tag: "City" },
          { icon: "🇦🇪", name: "Dubai", tag: "Luxury" },
          { icon: "🇨🇭", name: "Switzerland", tag: "Alps" },
          { icon: "🇮🇹", name: "Italy", tag: "Romance" },
          { icon: "🇬🇷", name: "Greece", tag: "Santorini" },
          { icon: "🇫🇷", name: "Paris", tag: "City of love" },
          { icon: "🇱🇰", name: "Sri Lanka", tag: "Scenic" },
          { icon: "🇲🇾", name: "Malaysia", tag: "Diverse" },
          { icon: "🇯🇵", name: "Japan", tag: "Culture" },
        ],
      },
      otherLabel: "Other destination",
      otherPlaceholder: "Type a destination not listed above…",
    },
    {
      type: "formGrid",
      title: "Trip details",
      subtitle: "Help us understand your trip so we can plan the perfect package",
      fields: [
        { key: "travel_from", label: "Travel from", input: "select", options: ["Mumbai", "Delhi", "Lucknow", "Other"] },
        {
          key: "nights",
          label: "No. of nights",
          input: "select",
          options: ["3 nights", "4 nights", "5 nights", "6 nights", "7 nights", "8–10 nights", "10+ nights"],
        },
        {
          key: "travelling_as",
          label: "Travelling as",
          input: "select",
          options: ["Couple (2 people)", "Couple + 1 child", "Couple + 2 children"],
        },
        {
          key: "budget",
          label: "Total budget",
          input: "select",
          options: ["Under ₹50K", "₹50K–₹1L", "₹1L–₹2L", "₹2L–₹3L", "₹3L–₹5L", "₹5L+"],
        },
        {
          key: "hotel_pref",
          label: "Hotel preference",
          input: "select",
          options: ["3 star", "4 star", "5 star", "Boutique / resort", "Overwater villa", "No preference"],
        },
        {
          key: "travel_mode",
          label: "Travel mode",
          input: "select",
          options: ["Flight", "Train", "Car / road trip", "Flight + train", "We'll arrange ourselves"],
        },
      ],
    },
    {
      type: "checkCards",
      key: "inclusions",
      title: "What to include?",
      subtitle: "Select everything you want in your package",
      options: [
        { icon: "✈️", title: "Flights / Train", desc: "Return tickets from your city" },
        { icon: "🛏️", title: "Hotel / Resort", desc: "Accommodation for all nights" },
        { icon: "🚗", title: "Transfers", desc: "Airport to hotel & back" },
        { icon: "🗺️", title: "Sightseeing", desc: "Guided tours & day trips" },
        { icon: "🍽️", title: "Meals", desc: "Breakfast, dinner or all-inclusive" },
        { icon: "🚣", title: "Activities", desc: "Adventure, water sports, experiences" },
        { icon: "💗", title: "Honeymoon Setup", desc: "Room decor, flowers, cake, candles" },
        { icon: "📷", title: "Couple Photoshoot", desc: "Professional shoot at destination" },
      ],
      chipsLabel: "Honeymoon room setup — what to include?",
      chipsKey: "room_setup",
      chipsOptions: [
        "Flower bed decoration", "Rose petals", "Candle setup", "Welcome cake",
        "Welcome drink", "Balloon decoration", "Couple's name board", "Bathtub decoration",
      ],
    },
    {
      type: "chipsWithText",
      key: "special_requests",
      title: "Special requests",
      subtitle: "Anything specific you'd like us to arrange or keep in mind",
      options: [
        "Surprise setup for partner", "Anniversary / birthday during trip", "Vegetarian meals only",
        "No spicy food", "Wheelchair accessible", "Sea-facing room", "Mountain view room",
        "Private pool villa", "Late checkout", "Early check-in",
      ],
      textKey: "special_notes",
      placeholder:
        "e.g. My partner loves surprises — please arrange a candlelight dinner on day 2. We prefer a quiet resort away from crowds…",
    },
  ],
  summary: {
    rows: [
      { icon: "📍", get: (s) => s.destination_choice || s.destination_other, empty: "No destination selected" },
      { icon: "🌙", get: (s) => s.nights, empty: "— nights" },
      { icon: "👥", get: (s) => s.travelling_as, empty: "2 people" },
      { icon: "💰", get: (s) => s.budget, empty: "Budget not set" },
    ],
  },
  submit: {
    cta: "Submit honeymoon request → custom package within 24 hours",
    refPrefix: "HON",
    successTitle: "Request received!",
    successBody:
      "Our team will put together a custom honeymoon package for you and send it on WhatsApp within 24 hours.",
  },
};

const PAGFERA = {
  heroBadges: [
    { icon: "📅", label: "1–3 days after wedding" },
    { icon: "🏠", label: "At bride's parents home" },
    { icon: "🛡️", label: "Fully managed by MyShaadi" },
  ],
  sections: [
    {
      type: "serviceCards",
      key: "services",
      title: "What do you need?",
      subtitle: "Select all that apply — fill details below for each",
      options: [
        {
          key: "doli",
          icon: "🚗",
          title: "Pagfera Doli",
          desc: "Bride's escort from marital home — decorated car, brother's escort, honourable send-off",
        },
        {
          key: "homecoming",
          icon: "🏡",
          title: "Homecoming",
          desc: "Welcome party at bride's parents home — decoration, catering, feast of her favourite dishes",
        },
        {
          key: "shagun",
          icon: "🎁",
          title: "Shagun",
          desc: "Gifts from bride's parents to the bride and groom — clothing, jewellery, sweets, shagun envelope",
        },
        {
          key: "sweets",
          icon: "🍬",
          title: "Sweets for Sasural",
          desc: "Sweets, mithai, and gifts sent back with the bride to her marital home as a gesture of love",
        },
      ],
    },
    {
      type: "serviceBlocks",
      forKey: "services",
      title: "Tell us more",
      subtitle: "Share details for each selected service",
      blocks: [
        {
          key: "doli",
          icon: "🚗",
          title: "Pagfera Doli — Send-off",
          fields: [
            {
              kind: "chips",
              key: "doli_items",
              label: "What do you need?",
              options: [
                "Car decoration (floral)", "Car decoration (ribbon)", "Traditional marigold",
                "Photographer for send-off", "MyShaadi coordinator",
              ],
            },
            { kind: "select", key: "doli_budget", label: "Budget range", options: ["Under ₹5K", "₹5K–₹10K", "₹10K–₹20K", "₹20K+"] },
            { kind: "select", key: "doli_city", label: "City", options: ["Mumbai", "Delhi", "Lucknow", "Other"] },
            {
              kind: "textarea",
              key: "doli_notes",
              label: "Additional notes",
              placeholder: "e.g. Need car decorated with fresh flowers, photographer to capture the emotional send-off…",
            },
          ],
        },
        {
          key: "homecoming",
          icon: "🏡",
          title: "Homecoming — Welcome Party",
          fields: [
            {
              kind: "chips",
              key: "home_areas",
              label: "Decoration: which areas?",
              options: ["Main entrance / gate", "Living room", "Dining area", "Terrace / balcony", "Bride's room"],
            },
            {
              kind: "chips",
              key: "home_catering",
              label: "Catering: what to include?",
              options: [
                "Bride's favourite dishes", "Full home-style feast", "Sweets & desserts",
                "Snacks & starters", "Live counters", "Beverages",
              ],
            },
            { kind: "select", key: "home_guests", label: "Guest count", options: ["Up to 20", "20–50", "50–100", "100+"] },
            { kind: "select", key: "home_budget", label: "Total budget", options: ["Under ₹20K", "₹20K–₹50K", "₹50K–₹1L", "₹1L+"] },
            {
              kind: "textarea",
              key: "home_notes",
              label: "Special notes",
              placeholder: "e.g. Bride loves Rajasthani food — dal baati churma, kheer. Approx 40 guests…",
            },
          ],
        },
        {
          key: "shagun",
          icon: "🎁",
          title: "Shagun — For Bride & Groom",
          fields: [
            {
              kind: "chips",
              key: "shagun_bride",
              label: "For the bride",
              options: ["Saree / lehenga", "Jewellery set", "Cosmetics & beauty", "Cash shagun envelope", "Sweets box"],
            },
            {
              kind: "chips",
              key: "shagun_groom",
              label: "For the groom",
              options: ["Kurta / sherwani set", "Cash shagun envelope", "Dry fruits box", "Sweets box", "Accessories"],
            },
            {
              kind: "select",
              key: "shagun_budget",
              label: "Total shagun budget",
              options: ["Under ₹10K", "₹10K–₹25K", "₹25K–₹50K", "₹50K–₹1L", "₹1L+"],
            },
            { kind: "select", key: "shagun_packaging", label: "Packaging", options: ["Premium gift box", "Traditional thali", "Decorative basket"] },
            {
              kind: "textarea",
              key: "shagun_notes",
              label: "Special notes",
              placeholder: "e.g. Need red saree for bride, kurta set for groom, 2 boxes kaju katli…",
            },
          ],
        },
        {
          key: "sweets",
          icon: "🍬",
          title: "Sweets for Sasural",
          fields: [
            {
              kind: "chips",
              key: "sweets_items",
              label: "What to send to sasural?",
              options: [
                "Assorted mithai box", "Kaju katli", "Motichoor ladoo", "Dry fruits box",
                "Home-made sweets", "Gift hamper", "Namkeen box", "Puja items",
              ],
            },
            {
              kind: "chips",
              key: "sweets_packaging",
              label: "Packaging & presentation",
              options: ["Branded box with couple's name", "Traditional thali", "Decorative basket", "Gift wrapped box"],
            },
            { kind: "select", key: "sweets_budget", label: "Budget range", options: ["Under ₹3K", "₹3K–₹7K", "₹7K–₹15K", "₹15K+"] },
            { kind: "select", key: "sweets_qty", label: "Quantity of boxes", options: ["1–2 boxes", "3–5 boxes", "6–10 boxes", "10+ boxes"] },
            {
              kind: "textarea",
              key: "sweets_notes",
              label: "Special notes",
              placeholder: "e.g. Need 3 boxes of assorted mithai, branded packaging with bride & groom's name…",
            },
          ],
        },
      ],
    },
    {
      type: "formGrid",
      title: "Event details",
      subtitle: "A few final details and we'll get back to you within 4 hours",
      fields: [
        { key: "pagfera_date", label: "Pagfera date", input: "date" },
        { key: "city", label: "City", input: "select", options: ["Mumbai", "Delhi", "Lucknow", "Other"] },
        { key: "guests", label: "Approx. guest count", input: "select", options: ["Under 20", "20–50", "50–100", "100+"] },
        {
          key: "extra_notes",
          label: "Anything else you'd like us to know",
          input: "textarea",
          placeholder:
            "e.g. This is our daughter's first Pagfera — we want it to be very special. She loves marigold decorations…",
        },
      ],
    },
  ],
  submit: {
    cta: "Submit Pagfera request → we'll call within 4 hours",
    refPrefix: "PAG",
    successTitle: "Request received!",
    successBody: "Our team will review your Pagfera request and call you within 4 hours to plan everything.",
  },
};

const STREEDHAN = {
  heroBadges: [
    { icon: "🛡️", label: "Verified vendors only" },
    { icon: "📋", label: "Custom proposal sent" },
    { icon: "🚚", label: "Doorstep delivery" },
    { icon: "⏱️", label: "Quote within 24 hours" },
  ],
  sections: [
    {
      type: "serviceCards",
      key: "categories",
      title: "What do you need?",
      subtitle: "Select all categories that apply — fill details below for each",
      options: [
        { key: "gold", icon: "💎", title: "Gold Jewellery", desc: "Necklace, bangles, sets" },
        { key: "furniture", icon: "🛋️", title: "Furniture", desc: "Bedroom, living, storage" },
        { key: "household", icon: "🏠", title: "Household", desc: "Utensils, cookware, linen" },
        { key: "electronics", icon: "📺", title: "Electronics", desc: "Appliances, gadgets" },
        { key: "automobile", icon: "🚗", title: "Automobile", desc: "Car, bike, scooter" },
      ],
    },
    {
      type: "serviceBlocks",
      forKey: "categories",
      title: "Tell us more",
      subtitle: "Share details for each selected category",
      blocks: [
        {
          key: "gold",
          icon: "💎",
          title: "Gold Jewellery",
          fields: [
            {
              kind: "chips",
              key: "gold_items",
              label: "What do you need?",
              options: [
                "Necklace set", "Bangles / Chuda", "Earrings", "Mangalsutra", "Nose ring",
                "Anklets", "Full bridal set", "Ring", "Maang tikka", "Haath phool",
              ],
            },
            {
              kind: "textarea",
              key: "gold_notes",
              label: "Details & preferences",
              placeholder: "e.g. Need a full bridal gold set — necklace, earrings, bangles. Yellow gold preferred, 22 carat…",
            },
            { kind: "select", key: "gold_budget", label: "Budget range", options: ["Under ₹50K", "₹50K–₹2L", "₹2L–₹5L", "₹5L–₹10L", "₹10L+"] },
            { kind: "select", key: "gold_timeline", label: "Needed by", options: ["Within 1 week", "2–3 weeks", "1 month", "1–3 months", "Flexible"] },
          ],
        },
        {
          key: "furniture",
          icon: "🛋️",
          title: "Furniture",
          fields: [
            {
              kind: "chips",
              key: "furniture_items",
              label: "What do you need?",
              options: [
                "Double bed with storage", "Wardrobe", "Dressing table", "Sofa set", "Dining table set",
                "Study table & chair", "Shoe rack", "TV unit", "Centre table", "Chest of drawers",
              ],
            },
            {
              kind: "textarea",
              key: "furniture_notes",
              label: "Details & preferences",
              placeholder: "e.g. King size bed with hydraulic storage, Sheesham wood preferred, walnut finish…",
            },
            { kind: "select", key: "furniture_budget", label: "Budget range", options: ["Under ₹50K", "₹50K–₹1L", "₹1L–₹2L", "₹2L–₹5L", "₹5L+"] },
            { kind: "select", key: "furniture_timeline", label: "Needed by", options: ["Within 1 week", "2–3 weeks", "1 month", "1–3 months", "Flexible"] },
          ],
        },
        {
          key: "household",
          icon: "🏠",
          title: "Household",
          fields: [
            {
              kind: "chips",
              key: "household_items",
              label: "What do you need?",
              options: [
                "Cookware set", "Steel utensils", "Dinner set", "Pressure cooker", "Bedsheet set", "Towel set",
                "Comforter / Razai", "Pooja thali set", "Copper items", "Crockery set", "Storage containers", "Curtains",
              ],
            },
            {
              kind: "textarea",
              key: "household_notes",
              label: "Details & preferences",
              placeholder: "e.g. Full kitchen setup for a new home — triply cookware, bone china dinner set for 6…",
            },
            { kind: "select", key: "household_budget", label: "Budget range", options: ["Under ₹10K", "₹10K–₹30K", "₹30K–₹75K", "₹75K–₹1.5L", "₹1.5L+"] },
            { kind: "select", key: "household_timeline", label: "Needed by", options: ["Within 1 week", "2–3 weeks", "1 month", "1–3 months", "Flexible"] },
          ],
        },
        {
          key: "electronics",
          icon: "📺",
          title: "Electronics & Appliances",
          fields: [
            {
              kind: "chips",
              key: "electronics_items",
              label: "What do you need?",
              options: [
                "Smart TV", "Refrigerator", "Washing machine", "Microwave / OTG", "Mixer grinder", "Air conditioner",
                "Smartphone", "Laptop / Tablet", "Air purifier", "Smart watch", "Geyser / Water heater", "Vacuum cleaner",
              ],
            },
            {
              kind: "textarea",
              key: "electronics_notes",
              label: "Details & preferences",
              placeholder: "e.g. Samsung 55 inch smart TV, LG double door fridge (500L), front load washing machine…",
            },
            { kind: "select", key: "electronics_budget", label: "Budget range", options: ["Under ₹50K", "₹50K–₹1L", "₹1L–₹2L", "₹2L–₹5L", "₹5L+"] },
            { kind: "select", key: "electronics_timeline", label: "Needed by", options: ["Within 1 week", "2–3 weeks", "1 month", "1–3 months", "Flexible"] },
          ],
        },
        {
          key: "automobile",
          icon: "🚗",
          title: "Automobile",
          fields: [
            {
              kind: "chips",
              key: "auto_items",
              label: "What do you need?",
              options: ["Car", "Bike", "Scooter / Scooty", "Electric vehicle (EV)", "Electric scooter"],
            },
            {
              kind: "textarea",
              key: "auto_notes",
              label: "Details & preferences",
              placeholder: "e.g. Maruti Swift (white or silver), automatic transmission preferred…",
            },
            { kind: "select", key: "auto_budget", label: "Budget range", options: ["Under ₹1L", "₹1L–₹5L", "₹5L–₹10L", "₹10L–₹20L", "₹20L+"] },
            { kind: "select", key: "auto_timeline", label: "Needed by", options: ["Within 1 week", "2–3 weeks", "1 month", "1–3 months", "Flexible"] },
          ],
        },
      ],
    },
    {
      type: "formGrid",
      title: "Event details",
      subtitle: "When is the wedding / event so we can plan delivery?",
      fields: [
        { key: "event_date", label: "Wedding / event date", input: "date" },
      ],
    },
  ],
  submit: {
    cta: "Submit Streedhan request → we'll send a proposal within 24 hours",
    refPrefix: "STR",
    successTitle: "Request received!",
    successBody: "Our team will send a detailed Streedhan proposal on WhatsApp within 24 hours.",
  },
};

const INVITATIONS = {
  heroBadges: [
    { icon: "✉️", label: "Lagan Patrika" },
    { icon: "🖨️", label: "Print & digital options" },
    { icon: "⏱️", label: "Quote within 4 hours" },
  ],
  sections: [
    {
      type: "optionCards",
      key: "style",
      title: "What type of invitation do you want?",
      options: [
        { value: "Paper Cards", icon: "📄", desc: "Classic printed card — single, folded or multi-page" },
        { value: "Digital Invite", icon: "📱", desc: "WhatsApp / email — static or animated" },
        { value: "Scroll Invite", icon: "📜", desc: "Rolled scroll with ribbon — traditional feel" },
        { value: "Box Invitation", icon: "🎁", desc: "Luxury velvet box — premium gifting experience" },
        { value: "Video Invite", icon: "🎬", desc: "Cinematic 60-sec video with your photos" },
      ],
    },
    {
      type: "optionCards",
      key: "quantity",
      title: "How many invitations do you need?",
      compact: true,
      options: ["50", "100", "200", "300", "500", "1000"].map((n) => ({
        value: `${n} cards`,
        icon: n,
        desc: "cards",
      })),
      customInput: {
        key: "quantity_custom",
        label: "Custom quantity",
        placeholder: "e.g. 750",
        type: "number",
      },
    },
    {
      type: "optionCards",
      key: "printing",
      title: "Choose your preferred print finish",
      horizontal: true,
      options: [
        { value: "Digital Print", icon: "🖨️", desc: "Clean, vibrant colours — budget friendly" },
        { value: "Offset Print", icon: "📰", desc: "High quality — best for large quantities" },
        { value: "Gold Foil", icon: "✨", desc: "Shiny metallic gold accents — premium look" },
        { value: "Embossed", icon: "🪪", desc: "Raised 3D print — elegant texture feel" },
        { value: "Laser Cut", icon: "💠", desc: "Intricate cut patterns — luxury wedding cards" },
        { value: "Silver Foil", icon: "🌟", desc: "Shiny silver accents — modern premium look" },
      ],
    },
  ],
  summary: {
    title: "📋 Your selection summary",
    rows: [
      { icon: "🎨", label: "Style", get: (s) => s.style, empty: "Not selected" },
      {
        icon: "🔢",
        label: "Quantity",
        get: (s) => (s.quantity_custom ? `${s.quantity_custom} cards (custom)` : s.quantity),
        empty: "Not selected",
      },
      { icon: "🖨️", label: "Printing type", get: (s) => s.printing, empty: "Not selected" },
      { icon: "💰", label: "Pricing", get: () => "Custom quote — sent within 4 hours" },
    ],
    footer: "A digital proof will be sent for approval before printing begins",
  },
  submit: {
    cta: "Get pricing → we'll send a quote within 4 hours",
    refPrefix: "LP",
    successTitle: "Request received!",
    successBody: "Our team will send you the best Lagan Patrika options with pricing on WhatsApp within 4 hours.",
  },
};

const ENQUIRY_CONFIGS = {
  honeymoon: HONEYMOON,
  pagfera: PAGFERA,
  streedhan: STREEDHAN,
  "wedding-invitation": INVITATIONS,
};

export function getEnquiryConfig(slug) {
  return ENQUIRY_CONFIGS[String(slug || "").toLowerCase()] || null;
}
