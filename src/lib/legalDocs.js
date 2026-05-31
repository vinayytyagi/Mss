/**
 * Source of truth for the 4 legal documents on MyShaadiStore.
 *
 * Each doc renders at `/legal/<slug>` via `src/app/legal/[slug]/page.js`.
 * Adding a new doc → register here AND in `generateStaticParams`.
 *
 * Block types supported by the renderer (PolicyRenderer.jsx):
 *   { type: "p", text }                                      — paragraph
 *   { type: "p", text, lead: true }                          — lead paragraph (larger)
 *   { type: "list", items: [...] }                           — bulleted list
 *   { type: "subheading", text }                             — h3 inside a section
 *   { type: "table", headers: [...], rows: [[...]] }         — data table
 *   { type: "callout", tone: "info"|"warn"|"danger", title?, body }
 *   { type: "spacer" }                                       — vertical gap
 */

export const COMPANY_NAME = "EPICENHANCE SERVICES & PRODUCTION PRIVATE LIMITED";
export const COMPANY_ADDRESS =
  "Shop No. 2, Bandra Plot Bakery, Jhula Maidan Road, Opp Quality, Jogeshwari East, Mumbai — 400060, Maharashtra, India";
export const SUPPORT_HOURS = "10 AM to 8 PM, Monday to Saturday";

// ─── COOKIE POLICY ──────────────────────────────────────────────────────────
const COOKIE_POLICY = {
  title: "Cookie Policy",
  badge: "Cookies",
  tagline:
    "What cookies MyShaadiStore uses on www.myshaadistore.com, why we use them, and how you can control them.",
  effectiveDate: "Effective from 30 March 2026",
  intro:
    "This Cookie Policy should be read alongside our Privacy Policy at /legal/privacy-policy.",
  sections: [
    {
      heading: "1. What are cookies?",
      blocks: [
        { type: "p", text: "Cookies are small text files that are placed on your device — phone, tablet, or computer — when you visit a website. They are widely used to make websites work correctly, remember your preferences, and provide information to website owners about how their site is being used." },
        { type: "p", text: "Cookies are not harmful. They cannot run programmes or deliver viruses. They are stored on your device and can be read by the website that placed them on your next visit." },
        {
          type: "table",
          headers: ["Cookie type", "What it means"],
          rows: [
            ["Session cookies", "Temporary cookies that exist only while your browser is open. Deleted automatically when you close the browser."],
            ["Persistent cookies", "Cookies that remain on your device for a set period or until you delete them manually. Used to remember preferences between visits."],
            ["First-party cookies", "Cookies set by MyShaadiStore directly when you visit our website."],
            ["Third-party cookies", "Cookies set by external services we use — such as Google Analytics. These are governed by the third party's own privacy policy."],
          ],
        },
      ],
    },
    {
      heading: "2. Cookies we use on MyShaadiStore",
      blocks: [
        { type: "p", text: "The following tables list every category of cookie used on www.myshaadistore.com, what each one does, and whether you can opt out." },

        { type: "subheading", text: "Category 1 — Essential Cookies (Always Active)" },
        { type: "p", text: "These cookies are required for the website to function. They cannot be disabled." },
        {
          type: "table",
          headers: ["Cookie name", "Set by", "Purpose", "Expires"],
          rows: [
            ["session_id", "MyShaadiStore", "Maintains your login session so you stay logged in while browsing.", "Session — deleted on browser close"],
            ["userCity", "MyShaadiStore", "Remembers your selected city (Mumbai, Delhi, or Lucknow) so you see the right vendors and listings.", "30 days"],
            ["cart_token", "MyShaadiStore", "Keeps track of items in your shopping cart and quotation basket between pages.", "7 days"],
            ["csrf_token", "MyShaadiStore", "Security cookie that protects against cross-site request forgery attacks.", "Session"],
            ["auth_token", "MyShaadiStore", "Secure authentication token that verifies your identity after OTP login.", "30 days"],
          ],
        },

        { type: "subheading", text: "Category 2 — Analytics Cookies (Require Consent)" },
        { type: "p", text: "These cookies help us understand how visitors use the site. All data is anonymised — no personal information is shared with analytics providers." },
        {
          type: "table",
          headers: ["Cookie name", "Set by", "Purpose", "Expires"],
          rows: [
            ["_ga", "Google Analytics", "Distinguishes unique website visitors. Used to calculate sessions and traffic data. Data is anonymised.", "2 years"],
            ["_ga_[ID]", "Google Analytics", "Stores session state for Google Analytics 4 (GA4). Used to understand user journeys.", "2 years"],
            ["_gid", "Google Analytics", "Identifies visitors for 24 hours. Used to count and track page views within a single day.", "24 hours"],
            ["_gat", "Google Analytics", "Used to throttle the request rate to Google Analytics — limits data collection to avoid performance impact.", "1 minute"],
          ],
        },

        { type: "subheading", text: "Category 3 — Preference Cookies (Require Consent)" },
        { type: "p", text: "These cookies remember your preferences and settings to improve your experience on return visits." },
        {
          type: "table",
          headers: ["Cookie name", "Set by", "Purpose", "Expires"],
          rows: [
            ["mss_city_pref", "MyShaadiStore", "Remembers your preferred city across sessions.", "90 days"],
            ["mss_budget_pref", "MyShaadiStore", "Saves your budget planner settings from your last session.", "30 days"],
            ["mss_cookie_consent", "MyShaadiStore", "Records your cookie consent choices so the consent banner does not appear on every visit.", "12 months"],
            ["mss_lang_pref", "MyShaadiStore", "Remembers your language preference if a Hindi/English toggle is available.", "90 days"],
          ],
        },

        { type: "subheading", text: "Category 4 — Marketing Cookies (Require Explicit Consent)" },
        { type: "p", text: "These cookies track your activity to show you relevant ads on other platforms. We only activate these if you explicitly accept them." },
        {
          type: "table",
          headers: ["Cookie name", "Set by", "Purpose", "Expires"],
          rows: [
            ["_fbp", "Meta (Facebook)", "Used by Facebook/Instagram to track visits across websites and build advertising audiences.", "90 days"],
            ["_fbc", "Meta (Facebook)", "Records when a user clicked on a Facebook/Instagram ad before arriving at the website.", "90 days"],
            ["IDE", "Google (DoubleClick)", "Used by Google Ads to track conversions and show relevant ads.", "13 months"],
          ],
        },

        {
          type: "callout",
          tone: "info",
          title: "Note on Meta Pixel and Google Ads",
          body: "MyShaadiStore does not currently use Meta Pixel or Google Ads at launch. These marketing cookies are listed as a forward-looking reference for when paid advertising campaigns are activated. Marketing cookies will only be placed on user devices after explicit consent is obtained through the cookie consent banner.",
        },
      ],
    },
    {
      heading: "3. Why we use cookies",
      blocks: [
        {
          type: "table",
          headers: ["We use cookies to", "Which category"],
          rows: [
            ["Keep you logged in between pages", "Essential"],
            ["Remember your selected city across the platform", "Essential + Preference"],
            ["Keep your cart and quotation basket active", "Essential"],
            ["Protect your account and form submissions from attacks", "Essential"],
            ["Understand which pages are most visited and how long visitors stay", "Analytics (with consent)"],
            ["Improve the platform based on usage patterns", "Analytics (with consent)"],
            ["Remember your budget planner settings and language preference", "Preference (with consent)"],
            ["Show relevant wedding service ads on Instagram and Google (future)", "Marketing (with explicit consent only)"],
          ],
        },
      ],
    },
    {
      heading: "4. How to control cookies",
      blocks: [
        { type: "subheading", text: "4.1  Through our cookie consent banner" },
        { type: "p", text: "When you first visit MyShaadiStore, a cookie consent banner appears at the bottom of the screen. You can:" },
        {
          type: "list",
          items: [
            "Accept all cookies — essential, analytics, preference, and marketing",
            "Accept essential only — only the cookies needed for the site to function",
            "Customise your preferences — choose which categories to accept individually",
          ],
        },
        { type: "p", text: "You can change your cookie preferences at any time by clicking 'Cookie Settings' in the website footer." },

        { type: "subheading", text: "4.2  Through your browser settings" },
        { type: "p", text: "You can control and delete cookies through your browser settings. Here is how to do it on the most common browsers:" },
        {
          type: "table",
          headers: ["Browser", "How to manage cookies"],
          rows: [
            ["Google Chrome", "Settings → Privacy and Security → Cookies and other site data"],
            ["Safari (iPhone/iPad)", "Settings → Safari → Privacy & Security → Block All Cookies"],
            ["Safari (Mac)", "Safari menu → Preferences → Privacy → Manage Website Data"],
            ["Mozilla Firefox", "Settings → Privacy & Security → Cookies and Site Data"],
            ["Microsoft Edge", "Settings → Cookies and site permissions → Cookies and site data"],
            ["Samsung Internet (Android)", "Settings → Privacy → Cookie Controls"],
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "Important — disabling essential cookies",
          body: "If you disable essential cookies through your browser settings, core features of MyShaadiStore will not work — including login, city selection, and shopping cart. We recommend disabling only analytics and marketing cookies if you have privacy concerns.",
        },
      ],
    },
    {
      heading: "5. Third-party cookies and their policies",
      blocks: [
        { type: "p", text: "Some cookies on MyShaadiStore are set by third-party services we use. These third parties have their own privacy and cookie policies which govern their use of data. We have no control over their cookies once set." },
        {
          type: "table",
          headers: ["Third party", "Why we use them", "Their privacy policy"],
          rows: [
            ["Google Analytics", "Website usage analytics and reporting", "policies.google.com/privacy"],
            ["Razorpay", "Payment processing — all transactions", "razorpay.com/privacy"],
            ["Google (OAuth)", "Optional login with Google account", "policies.google.com/privacy"],
            ["Meta / Facebook", "Future advertising campaigns (not active at launch)", "facebook.com/privacy/policy"],
            ["WhatsApp Business API", "Order notifications and customer support messages", "whatsapp.com/legal/privacy-policy"],
            ["Vercel", "Website hosting infrastructure", "vercel.com/legal/privacy-policy"],
          ],
        },
      ],
    },
    {
      heading: "6. Cookie consent and Indian law",
      blocks: [
        { type: "p", text: "Under the Information Technology Act 2000, the IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules 2011, and the Digital Personal Data Protection Act 2023, MyShaadiStore is required to:" },
        {
          type: "list",
          items: [
            "Inform users about the cookies and tracking technologies used on the platform",
            "Obtain consent before placing non-essential cookies on user devices",
            "Provide users with a clear mechanism to withdraw consent at any time",
            "Not deny service to users who decline non-essential cookies",
          ],
        },
        { type: "p", text: "MyShaadiStore complies with all applicable Indian data protection legislation. Users who decline analytics, preference, or marketing cookies will still have full access to all core platform features — only essential cookies will be placed on their devices." },
      ],
    },
    {
      heading: "7. Changes to this policy",
      blocks: [
        { type: "p", text: "We may update this Cookie Policy from time to time as we add new features, integrate new third-party services, or as legal requirements change. Any changes will be published on this page with an updated effective date." },
        { type: "p", text: "If we make significant changes — for example if we add new marketing cookies — we will re-display the cookie consent banner so you can review and update your preferences." },
      ],
    },
  ],
};

// ─── PRIVACY POLICY ─────────────────────────────────────────────────────────
const PRIVACY_POLICY = {
  title: "Privacy Policy",
  badge: "Your Privacy",
  tagline:
    "How EPICENHANCE SERVICES & PRODUCTION PRIVATE LIMITED (operating as MyShaadiStore) collects, uses, stores, and protects your personal information when you use www.myshaadistore.com.",
  effectiveDate: "Effective from 30 March 2026",
  intro: "By using MyShaadiStore, you agree to the practices described in this policy.",
  sections: [
    {
      heading: "1. Information we collect",
      blocks: [
        { type: "subheading", text: "1.1  Information you give us directly" },
        {
          type: "list",
          items: [
            "Full name and partner's name",
            "Mobile phone number — used for communication, WhatsApp, and order updates",
            "Email address — used for booking confirmations, login, receipts, and notifications",
            "Wedding event date, city, and venue details",
            "Guest count and service preferences",
            "Payment information — we do not store card details. All payment data is handled by Razorpay (PCI-DSS compliant).",
            "Address — for product deliveries only",
            "Communications — messages sent to us via WhatsApp or email",
          ],
        },
        { type: "subheading", text: "1.2  Information collected automatically" },
        {
          type: "list",
          items: [
            "Device type, operating system, and browser type",
            "IP address and approximate location (city level only)",
            "Pages visited, time spent on pages, and links clicked",
            "Referring website or source that brought you to MyShaadiStore",
            "Cookies and similar tracking technologies — see Section 6",
          ],
        },
        { type: "subheading", text: "1.3  Information from third parties" },
        {
          type: "list",
          items: [
            "If you log in using Google OAuth — your name and email as shared by Google",
            "Payment status information shared by Razorpay after transaction completion",
          ],
        },
      ],
    },
    {
      heading: "2. How we use your information",
      blocks: [
        { type: "p", text: "We use the information we collect for the following purposes:" },
        {
          type: "table",
          headers: ["Purpose", "What data is used"],
          rows: [
            ["Creating and managing your account", "Phone number, name, email"],
            ["Processing your service and product orders", "Name, phone, event details, address, payment status"],
            ["Sending order confirmations and receipts", "Email address, WhatsApp number"],
            ["Assigning vendors to your order", "Event date, city, service requirements, guest count"],
            ["Sending balance payment reminders", "Email and WhatsApp number, outstanding amount"],
            ["Processing refunds and store credit", "Payment method details, order history"],
            ["Responding to WhatsApp and email support queries", "Communication content, order details"],
            ["Improving the platform — analytics and testing", "Anonymised usage data, device info"],
            ["Sending marketing messages — with your consent only", "Email and WhatsApp number"],
            ["Complying with legal obligations", "Any information required by law"],
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "We do not sell your data",
          body: "MyShaadiStore never sells, rents, or trades your personal information to third-party marketing companies or data brokers. Your data is used only to provide you with our wedding services.",
        },
      ],
    },
    {
      heading: "3. Sharing your information",
      blocks: [
        { type: "p", text: "We share your information only in the following limited circumstances:" },

        { type: "subheading", text: "3.1  With our vendor network" },
        { type: "p", text: "When a vendor is assigned to your order, we share the following with them — and only what is necessary:" },
        {
          type: "list",
          items: [
            "Your first name only (not full name) — shared at time of order assignment",
            "Event date and venue area (not full address) — shared at time of assignment",
            "Full venue address and contact number — shared only 24 hours before your event date",
            "Special requirements relevant to the service they are delivering",
          ],
        },
        { type: "p", text: "Vendors never see your payment details, order total, MyShaadiStore's markup, or any other orders you have placed." },

        { type: "subheading", text: "3.2  With our service providers" },
        {
          type: "list",
          items: [
            "Razorpay — payment processing. Governed by Razorpay's own privacy policy.",
            "Resend — transactional email delivery",
            "Google — if you use Google OAuth login or Google Workspace email",
            "Oracle / hosting provider — website infrastructure",
            "WhatsApp Business API — for notifications and support messages",
          ],
        },

        { type: "subheading", text: "3.3  For legal compliance" },
        { type: "p", text: "We may disclose your information if required by law, court order, or government authority, or to protect the rights, safety, or property of MyShaadiStore, our customers, or vendors." },

        { type: "subheading", text: "3.4  Business transfer" },
        { type: "p", text: "If MyShaadiStore is acquired, merged, or undergoes a change of ownership, your information may be transferred to the new entity as part of the business assets. We will notify you of any such change." },
      ],
    },
    {
      heading: "4. Data storage and retention",
      blocks: [
        { type: "p", text: "Your personal information is stored on secure servers in India. We retain your data for as long as your account is active and for a reasonable period thereafter to comply with legal obligations, resolve disputes, and enforce our agreements." },
        {
          type: "table",
          headers: ["Data type", "Retention period"],
          rows: [
            ["Account information (name, phone, email)", "Active account + 3 years after last activity"],
            ["Order and booking history", "7 years — required for GST and financial compliance"],
            ["Payment transaction records", "7 years — required by Indian tax law"],
            ["Communication records (WhatsApp, email)", "2 years from last communication"],
            ["Usage and analytics data", "12 months — anonymised after 6 months"],
            ["Vendor application data", "2 years whether accepted or rejected"],
          ],
        },
      ],
    },
    {
      heading: "5. Your rights",
      blocks: [
        { type: "p", text: "Under the Information Technology Act 2000 and the Digital Personal Data Protection Act 2023 (DPDP Act), you have the following rights regarding your personal data:" },
        {
          type: "list",
          items: [
            "Right to access — you can request a copy of the personal data we hold about you",
            "Right to correction — you can request correction of inaccurate or incomplete data",
            "Right to erasure — you can request deletion of your data, subject to legal retention requirements",
            "Right to withdraw consent — you can withdraw consent for marketing messages at any time",
            "Right to grievance redressal — you can raise a complaint about how your data is handled",
          ],
        },
        { type: "p", text: "To exercise any of these rights, contact us on WhatsApp at +91 95685 59915 or email connect@myshaadistore.com. We will respond within 30 days." },
      ],
    },
    {
      heading: "6. Cookies and tracking",
      blocks: [
        { type: "p", text: "MyShaadiStore uses cookies and similar tracking technologies to improve your experience. For full details, see our Cookie Policy at /legal/cookie-policy." },
        {
          type: "table",
          headers: ["Cookie type", "Purpose", "Can you opt out?"],
          rows: [
            ["Essential cookies", "Required for the website to function — login sessions, city selection, basket contents", "No — the site cannot function without these"],
            ["Analytics cookies", "Understand how visitors use the site — pages visited, time spent, errors", "Yes — via browser settings or Cookie Settings"],
            ["Preference cookies", "Remember your city selection and preferences across visits", "Yes — via browser settings or account settings"],
            ["Marketing cookies", "Show relevant wedding service ads — only if you have consented", "Yes — withdraw consent at any time"],
          ],
        },
      ],
    },
    {
      heading: "7. Children's privacy",
      blocks: [
        { type: "p", text: "MyShaadiStore is intended for use by adults aged 18 and above. We do not knowingly collect personal information from anyone under 18. If we become aware that we have collected data from a minor, we will delete it immediately. If you believe a minor has provided us with their personal information, please contact us on WhatsApp." },
      ],
    },
    {
      heading: "8. Security",
      blocks: [
        { type: "p", text: "We implement appropriate administrative, technical, and physical security measures to protect your personal information from unauthorised access, disclosure, alteration, or destruction. These include:" },
        {
          type: "list",
          items: [
            "HTTPS encryption on all pages",
            "Secure password hashing for admin accounts",
            "OTP-based authentication — no passwords stored for customers",
            "Razorpay PCI-DSS compliance for all payment processing",
            "Vendor NDAs requiring data confidentiality",
            "Access controls — only authorised team members can access customer data",
          ],
        },
        { type: "p", text: "No method of data transmission or storage is 100% secure. While we take all reasonable precautions, we cannot guarantee absolute security. In the event of a data breach that affects your rights, we will notify you within 72 hours as required by law." },
      ],
    },
    {
      heading: "9. Third-party links",
      blocks: [
        { type: "p", text: "Our website may contain links to third-party websites — social media platforms (Instagram, Facebook, YouTube), payment gateway (Razorpay), and others. This Privacy Policy applies only to www.myshaadistore.com. We are not responsible for the privacy practices of third-party websites and encourage you to read their policies separately." },
      ],
    },
    {
      heading: "10. WhatsApp communications",
      blocks: [
        { type: "p", text: "MyShaadiStore uses WhatsApp for order notifications, support, and vendor coordination. By providing your mobile number and using our services, you consent to receiving WhatsApp messages related to your orders, bookings, and account." },
        {
          type: "list",
          items: [
            "You can opt out of marketing messages by messaging 'STOP' to our WhatsApp number",
            "Transactional messages — order confirmations, payment receipts, event reminders — cannot be opted out of as they are essential to your order",
            "We do not share your WhatsApp number with vendors until 24 hours before your event date",
          ],
        },
      ],
    },
    {
      heading: "11. Changes to this policy",
      blocks: [
        { type: "p", text: "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. Any changes will be published on this page with the updated effective date. If changes are significant, we will notify you via WhatsApp or email." },
        { type: "p", text: "Continued use of MyShaadiStore after changes constitutes your acceptance of the updated Privacy Policy." },
      ],
    },
    {
      heading: "12. Grievance officer",
      blocks: [
        { type: "p", text: "In accordance with the Information Technology Act 2000 and the DPDP Act 2023, you may contact our Grievance Officer for any data-related complaints:" },
        {
          type: "table",
          headers: ["Field", "Details"],
          rows: [
            ["Grievance Officer", "Designated representative, MyShaadiStore"],
            ["Company", COMPANY_NAME],
            ["Address", COMPANY_ADDRESS],
            ["WhatsApp", "+91 95685 59915"],
            ["Email", "connect@myshaadistore.com"],
            ["Response time", "Within 30 days of receiving a complaint"],
          ],
        },
      ],
    },
  ],
};

// ─── REFUND POLICY ──────────────────────────────────────────────────────────
const REFUND_POLICY = {
  title: "Refund, Cancellation & Store Credit Policy",
  badge: "Refunds & Cancellations",
  tagline:
    "Two types of orders — Service orders (Photography, Decor, Catering etc.) and Product orders (Clothing, Jewellery, Gifts etc.) — have different rules. Read the relevant section before placing your order.",
  effectiveDate: "Effective from 30 March 2026",
  intro: "",
  sections: [
    {
      heading: "Section 1 — Store Credit (MyShaadi Wallet)",
      blocks: [
        { type: "p", text: "For all approved refunds and cancellations, you may choose to receive your money back in one of two ways:" },
        {
          type: "table",
          headers: ["Option A — Refund to original source", "Option B — MyShaadi Store Credit"],
          rows: [
            [
              "Your refund goes back to: card → same card · UPI → same UPI · net banking → same bank · NEFT/cheque → bank transfer · cash → Store Credit (recommended) or cash collection arranged.\n\nProcessing time: 5–7 working days for card/net banking. 2–3 working days for UPI.",
              "Store Credit is added to your MyShaadiStore account:\n• Available instantly — no waiting period\n• Can be used on any future booking — services or products\n• No expiry — credit never expires\n• Visible in your account under 'My Store Credit'\n• Automatically applied at checkout when available\n• Non-transferable — can only be used by the account holder\n\nProcessing time: Instant.",
            ],
          ],
        },
        { type: "p", text: "The choice between Option A and Option B is always yours. MyShaadiStore will never force you to take Store Credit instead of a refund to your original payment source — except in the case of cash payments where bank transfer details are needed." },
      ],
    },
    {
      heading: "Section 2 — Product Orders",
      blocks: [
        { type: "p", text: "Product orders include all physical items purchased through MyShaadiStore: Clothing, Jewellery, Footwear, Accessories, Gifts, Hampers, Invitations, Sweets, Wedding decor items, Electronics (Streedhan), and all other products in the Shopping section." },
        {
          type: "callout",
          tone: "danger",
          title: "🚫 No Return Policy — Please read carefully",
          body: "MyShaadiStore does not accept returns on any product under any circumstances. Wedding products by their nature are purchased for use over a short period — one ceremony, one function, or one event. To protect all customers fairly and prevent misuse, all product sales are final. The only exception is replacement — where the item delivered is genuinely wrong (different from what was ordered) or is damaged before use and evidence is provided at the time of raising the request. A product that has been used, worn, or altered in any way is not eligible for replacement.",
        },

        { type: "subheading", text: "2.1  Cancellation before dispatch" },
        { type: "p", text: "If you cancel a product order before it has been dispatched from our warehouse, you are eligible for a full refund." },
        {
          type: "table",
          headers: ["When", "Refund amount", "Your options"],
          rows: [
            ["Before order is dispatched from warehouse", "100% of amount paid", "Refund to original source OR Store Credit"],
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "How to cancel before dispatch",
          body: "Log into your account → My Orders → Select the order → Click 'Cancel Order'. Cancellation is instant if the order has not yet been dispatched. If dispatch has already happened, cancellation is no longer possible.",
        },

        { type: "subheading", text: "2.2  Wrong or damaged item — Replacement only" },
        { type: "p", text: "If you receive a product that is wrong (different from what you ordered) or is visibly damaged on delivery, you may raise a replacement request within 5 days of delivery. Replacements are not available after 5 days from delivery. MyShaadiStore does not accept returns — the product must remain with the customer." },
        {
          type: "table",
          headers: ["Situation", "Resolution", "If resolution not possible"],
          rows: [
            ["Wrong item delivered", "Replacement of correct item dispatched at no extra cost", "Full refund — original source OR Store Credit"],
            ["Damaged item delivered", "Replacement dispatched at no extra cost", "Full refund — original source OR Store Credit"],
            ["Item missing from delivery", "Missing item dispatched immediately", "Refund for missing item value — original source OR Store Credit"],
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "How to raise a replacement request — evidence required",
          body: "Log into your account → My Orders → Select the order → Click 'Report an Issue'. You must upload: (1) an unboxing video or photos taken at the time of opening the package — before the item was used or worn, and (2) clear photos of the wrong item or the damage. Replacement requests submitted without evidence, or where the item shows signs of use, will not be accepted. Our team will review within 48 hours.",
        },

        { type: "subheading", text: "2.3  Perishable products (flowers, food, sweets, fresh items)" },
        { type: "p", text: "All complaints for perishable items must be raised within 4 hours of delivery." },
        {
          type: "table",
          headers: ["Complaint raised within", "Resolution", "Refund option"],
          rows: [
            ["Within 4 hours of delivery", "Same-day fresh replacement attempted first", "If replacement not possible — original source OR Store Credit"],
            ["After 4 hours of delivery", "Not accepted — perishable nature prevents assessment", "No refund or replacement available"],
          ],
        },

        { type: "subheading", text: "2.4  No returns after delivery — all sales are final" },
        { type: "p", text: "Once a product is delivered, it cannot be returned under any circumstances. MyShaadiStore does not operate a return model. If the product delivered is correct and undamaged, the sale is final." },
        { type: "p", text: "The only situations where a replacement is considered after delivery are:" },
        {
          type: "list",
          items: [
            "Wrong item delivered — item received is different from what was ordered",
            "Item damaged before use — damage is visible at the time of unboxing and evidence is provided immediately",
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "Used products are not eligible for replacement",
          body: "If a product has been used, worn, tried on, altered, or is no longer in its original packaged condition, it is not eligible for replacement. Our team will verify the evidence submitted and if signs of use are detected, the replacement request will be declined.",
        },

        { type: "subheading", text: "2.5  Items not eligible for replacement or refund" },
        {
          type: "list",
          items: [
            "Customised or personalised items (name-printed items, custom invitations, personalised gifts) once the customisation process has begun",
            "Innerwear, lingerie, or personal hygiene products",
            "Digital products (digital invitations, wedding websites) once delivered",
            "Items damaged due to customer misuse after delivery",
            "Items raised after the 5-day replacement window has passed from delivery date",
          ],
        },
      ],
    },
    {
      heading: "Section 3 — Service Orders",
      blocks: [
        { type: "p", text: "Service orders include all bookings where a vendor delivers a service on or before your event date: Photography, Videography, Decoration, Catering, Bridal Makeup, Mehendi, Entertainment, Pandit services, Venue coordination, Guest management, Pre-wedding shoots, Honeymoon packages." },

        { type: "subheading", text: "3.1  How service payments work" },
        {
          type: "table",
          headers: ["Payment stage", "What it is", "Refundable?"],
          rows: [
            ["Token / Booking advance", "Minimum advance paid at the time of booking to confirm the order. Amount varies by service category.", "Non-refundable once a vendor has been assigned and briefed. Fully refundable if MyShaadiStore cannot assign a vendor."],
            ["Balance payment", "Remaining amount due — can be paid as a lump sum or in instalments as agreed.", "Refundable as per the cancellation timeline in Section 3.2."],
          ],
        },

        { type: "subheading", text: "3.2  Customer cancellation — refund by timeline" },
        { type: "p", text: "If you cancel a confirmed service order, the refund amount depends on how many days remain before your event date at the time of cancellation:" },
        {
          type: "table",
          headers: ["Days before event", "Token", "Refund on balance paid", "Your options"],
          rows: [
            ["30 or more days", "Forfeited", "100% of balance paid", "Original source OR Store Credit"],
            ["15 to 29 days", "Forfeited", "75% of balance paid", "Original source OR Store Credit"],
            ["7 to 14 days", "Forfeited", "50% of balance paid", "Original source OR Store Credit"],
            ["Less than 7 days", "Forfeited", "No refund", "—"],
            ["Day of event", "Forfeited", "No refund", "—"],
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "Example",
          body: "You booked a Photography package for ₹30,000 — ₹9,000 token + ₹21,000 balance. You cancel 20 days before the event. Token ₹9,000 is forfeited. 75% of balance paid (₹21,000 × 75% = ₹15,750) is refunded. Your choice: ₹15,750 back to your original source, or ₹15,750 as Store Credit.",
        },

        { type: "subheading", text: "3.3  Payment methods for service orders" },
        {
          type: "table",
          headers: ["Payment method", "Refund processing", "Processing time"],
          rows: [
            ["Credit / debit card (Razorpay)", "Refunded automatically to original card", "5–7 working days"],
            ["UPI — GPay, PhonePe, Paytm etc. (Razorpay)", "Refunded automatically to original UPI", "2–3 working days"],
            ["Net banking (Razorpay)", "Refunded automatically to original bank account", "5–7 working days"],
            ["Bank transfer / NEFT / IMPS", "Our team contacts you to confirm account details and processes NEFT", "3–5 working days after confirmation"],
            ["Cheque", "Our team contacts you to confirm bank account details", "5–7 working days after confirmation"],
            ["Cash", "Refunded as Store Credit (recommended) or cash collection arranged — city dependent", "Store Credit: instant. Cash: 3–5 working days"],
          ],
        },

        { type: "subheading", text: "3.4  Cancellation by MyShaadiStore" },
        { type: "p", text: "In rare circumstances, MyShaadiStore may need to cancel a confirmed service order due to an operational failure on our part. In these cases, you are entitled to a full refund including the token amount." },
        {
          type: "table",
          headers: ["MyShaadiStore cancellation", "Your entitlement"],
          rows: [
            ["MyShaadiStore cancels due to inability to fulfil", "100% refund — full amount including token. Your choice: Original payment source OR Store Credit. Processing time: 7 working days."],
          ],
        },

        { type: "subheading", text: "3.5  Razorpay technical error — double charge or failed transaction" },
        { type: "p", text: "If a payment fails but the amount has been debited from your account, or if you are charged twice for the same order:" },
        {
          type: "list",
          items: [
            "Contact us immediately on WhatsApp with your payment details and bank statement screenshot",
            "Our team will verify with Razorpay within 24 hours",
            "If confirmed, the extra amount is automatically reversed by Razorpay to your original account",
            "Processing time: 5–7 working days from verification",
          ],
        },
      ],
    },
    {
      heading: "Section 4 — How to Request a Cancellation or Refund",
      blocks: [
        {
          type: "table",
          headers: ["Step", "Action", "What happens next"],
          rows: [
            ["1", "Log into your MyShaadiStore account", "Go to www.myshaadistore.com and log in with your registered phone number"],
            ["2", "Go to My Orders or My Bookings", "Find the order you want to cancel or raise an issue with"],
            ["3", "Click 'Cancel Order' or 'Report an Issue'", "Select the reason for cancellation or describe the issue. Upload photos if reporting a product problem."],
            ["4", "Our team reviews your request", "We review within 24 hours for standard requests. Same-day review for urgent cases (event within 7 days)."],
            ["5", "We confirm the refund amount", "You receive a WhatsApp message and email confirming order cancelled, refund amount, and your two options."],
            ["6", "You choose your refund method", "Reply on WhatsApp or select in your account: original source OR Store Credit."],
            ["7", "Refund processed", "Original source: 2–7 working days depending on payment method. Store Credit: instant."],
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "For urgent cancellations or issues",
          body: "Contact us directly on WhatsApp using the link in the website footer. Our team is available " + SUPPORT_HOURS + ". For event-day emergencies, we respond within 30 minutes.",
        },
      ],
    },
    {
      heading: "Section 5 — Disputes and Escalations",
      blocks: [
        { type: "p", text: "If you believe a cancellation or refund has been processed incorrectly, or if you are not satisfied with the resolution offered:" },
        {
          type: "list",
          items: [
            "Contact us on WhatsApp within 7 days of receiving the refund confirmation",
            "Provide your Order ID, the issue description, and any supporting evidence (photos, screenshots, communication)",
            "Our senior team will review and respond within 48 hours",
            "If the dispute cannot be resolved through WhatsApp, please email us at connect@myshaadistore.com with all details",
          ],
        },
        { type: "p", text: "MyShaadiStore is committed to fair resolution of all disputes. We follow the guidelines of the Consumer Protection Act 2019 and the Information Technology Act 2000 in handling all customer complaints." },
      ],
    },
    {
      heading: "Section 6 — General Terms",
      blocks: [
        { type: "subheading", text: "6.1  Refunds are processed to the original account holder only" },
        { type: "p", text: "Refunds — whether to original payment source or Store Credit — will only be processed to the person who made the original payment. Refunds cannot be redirected to a third-party account or a different payment method than what was used." },

        { type: "subheading", text: "6.2  Store Credit is non-transferable and non-encashable" },
        { type: "p", text: "Store Credit in your MyShaadiStore account cannot be transferred to another customer account, cannot be converted to cash, and cannot be withdrawn. It can only be used for future purchases and bookings on www.myshaadistore.com." },

        { type: "subheading", text: "6.3  Fraudulent refund claims" },
        { type: "p", text: "MyShaadiStore takes fraudulent refund claims seriously. If a customer is found to have submitted false claims, fabricated damage, or abused the refund process, their account may be suspended and we reserve the right to pursue recovery of any amounts refunded in error." },

        { type: "subheading", text: "6.4  Changes to this policy" },
        { type: "p", text: "MyShaadiStore reserves the right to update this Refund, Cancellation and Store Credit Policy at any time. Any changes will be published on this page with the updated effective date. If you have a pending order at the time of a policy change, the policy in effect at the time of your booking applies to that order." },

        { type: "subheading", text: "6.5  Governing law and jurisdiction" },
        { type: "p", text: "This policy and any disputes arising from it are governed by the laws of the Republic of India. All disputes are subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra. By placing an order on MyShaadiStore, you agree to this jurisdiction." },
      ],
    },
  ],
};

// ─── TERMS OF SERVICE ───────────────────────────────────────────────────────
const TERMS_OF_SERVICE = {
  title: "Terms of Service",
  badge: "Agreement",
  tagline:
    "These Terms of Service govern your use of www.myshaadistore.com and all related services offered by EPICENHANCE SERVICES & PRODUCTION PRIVATE LIMITED.",
  effectiveDate: "Effective from 30 March 2026",
  intro: "By accessing or using our platform, you agree to be bound by these Terms. If you do not agree, please do not use MyShaadiStore.",
  sections: [
    {
      heading: "1. About MyShaadiStore",
      blocks: [
        { type: "p", text: "MyShaadiStore is a managed wedding services platform. We connect customers with verified vendors for wedding-related services (Photography, Decoration, Catering, Makeup, Mehendi, Entertainment, Pandit services, Venue coordination, Honeymoon packages, and more) and wedding-related products (Clothing, Jewellery, Gifts, Invitations, Electronics, and more)." },
        { type: "p", text: "MyShaadiStore is not a marketplace or directory. We act as the principal service provider to the customer. All services and products are offered under the MyShaadiStore brand. Vendors are our service partners — they are not your direct contractors." },
      ],
    },
    {
      heading: "2. Eligibility",
      blocks: [
        {
          type: "list",
          items: [
            "You must be legally capable of entering into a binding contract under Indian law for wedding.",
            "If you are using MyShaadiStore on behalf of another person or family, you confirm that you have their authority to do so and that they agree to these Terms. In case of family, no authority is required.",
            "By using the platform, you confirm that all information you provide is accurate, current, and complete.",
          ],
        },
      ],
    },
    {
      heading: "3. Account and login",
      blocks: [
        {
          type: "list",
          items: [
            "Accounts are created using your email address and verification.",
            "You are responsible for keeping your phone number secure and for all activity on your account.",
            "If you believe your account has been accessed without authorisation, contact us immediately on WhatsApp.",
            "We reserve the right to suspend or terminate accounts that violate these Terms or are used for fraudulent activity.",
          ],
        },
      ],
    },
    {
      heading: "4. Service orders — how bookings work",
      blocks: [
        { type: "p", text: "Service orders (Photography, Decoration, Catering, Makeup, Mehendi, Entertainment, Pandit, Venue coordination, etc.) follow this process:" },
        {
          type: "table",
          headers: ["#", "Step", "Your obligation"],
          rows: [
            ["1", "Submit enquiry", "Provide accurate event date, city, guest count, and service requirements"],
            ["2", "Review quote", "Review the quote MyShaadiStore sends you. Quotes are valid for 48 hours unless stated otherwise."],
            ["3", "Approve quote", "By clicking Approve, you confirm your acceptance of the quoted price and inclusions."],
            ["4", "Make payment", "Pay minimum advance or full amount as per the payment options available. Payment confirms the booking."],
            ["5", "Receive booking confirmation", "You receive an Order ID and booking confirmation via WhatsApp and email."],
            ["6", "Event delivery", "Vendor delivers the service on your event date as briefed by MyShaadiStore."],
            ["7", "Confirm delivery", "After the event, confirm delivery on your dashboard or via WhatsApp. This triggers the vendor payout."],
          ],
        },
      ],
    },
    {
      heading: "5. Product orders — how shopping works",
      blocks: [
        { type: "p", text: "Product orders follow standard e-commerce conventions with the following specific terms:" },
        {
          type: "list",
          items: [
            "All product prices shown on the platform are inclusive of MyShaadiStore's service margin. The vendor rate is never shown to the customer.",
            "Product orders are fulfilled by MyShaadiStore — vendor packs and ships to our warehouse, our team inspects and repacks, and we ship to you.",
            "Delivery timelines are shown on each product listing. Customised items (personalised invitations, custom gifts) have longer delivery timelines as specified.",
            "MyShaadiStore does not accept returns on any product once delivered — see our Refund Policy for the replacement process.",
            "Replacement is available only for wrong or damaged items — within 5 days of delivery for standard products and 4 hours for perishable items.",
          ],
        },
      ],
    },
    {
      heading: "6. Payments",
      blocks: [
        { type: "subheading", text: "6.1  Payment processing" },
        { type: "p", text: "All payments on MyShaadiStore are processed through Razorpay, a PCI-DSS compliant payment gateway. We accept UPI, credit card, debit card, net banking, and EMI (for orders above ₹25,000). Cash, cheque, and bank transfer are accepted for service orders only — contact our team on WhatsApp." },

        { type: "subheading", text: "6.2  Price accuracy" },
        { type: "p", text: "We make every effort to ensure prices shown on the platform are accurate. In the rare case of a pricing error, we will contact you before processing your order and give you the option to proceed at the correct price or cancel without charge." },

        { type: "subheading", text: "6.3  GST and taxes" },
        { type: "p", text: "Prices shown on MyShaadiStore are inclusive of applicable GST unless stated otherwise. A GST invoice is available for all orders on request — contact connect@myshaadistore.com." },

        { type: "subheading", text: "6.4  Token payment" },
        { type: "p", text: "Service orders require a minimum token payment (advance) to confirm the booking. The token amount varies by service category and is set by MyShaadiStore. The token is non-refundable once a vendor has been assigned and briefed, unless MyShaadiStore is unable to fulfil the order." },
      ],
    },
    {
      heading: "7. Cancellation and refunds",
      blocks: [
        { type: "p", text: "Cancellation and refund terms are governed by our Refund, Cancellation and Store Credit Policy at /legal/refund-policy. Key points:" },
        {
          type: "list",
          items: [
            "Service orders — cancellation results in a tiered refund based on days remaining before event date. Token is always forfeited once vendor is assigned.",
            "Product orders — cancellation before dispatch results in a full refund. No cancellation after dispatch unless item is wrong or damaged.",
            "No returns on products — replacement only, for wrong or damaged items within the replacement window.",
            "Refunds are processed to the original payment source or as Store Credit — customer's choice.",
            "MyShaadiStore does not process cash refunds for customer-initiated cancellations except where the fault is entirely ours.",
          ],
        },
      ],
    },
    {
      heading: "8. Vendor relationship and our liability",
      blocks: [
        { type: "p", text: "MyShaadiStore selects, verifies, and manages all vendors on our platform. However:" },
        {
          type: "list",
          items: [
            "MyShaadiStore acts as the principal — your contract is with us, not with the vendor directly.",
            "Vendors are independent service partners. They are not employees or agents of MyShaadiStore.",
            "MyShaadiStore is not responsible for the overall quality and delivery of the service as described in the booking. If a vendor fails to deliver, we will either arrange an alternative or inform vendor for the same.",
            "MyShaadiStore's liability for any single order is capped at the total amount paid by you for that order.",
            "We are not liable for indirect, consequential, or incidental damages — including emotional distress — arising from any service failure due to vendor.",
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "Our commitment to you",
          body: "If anything goes wrong on your event day — you call us, not the vendor. Our Ops team is available on WhatsApp throughout your event day and we will do everything in our power to resolve the issue. We take full operational accountability for every booking made through MyShaadiStore.",
        },
      ],
    },
    {
      heading: "9. Prohibited conduct",
      blocks: [
        { type: "p", text: "By using MyShaadiStore, you agree not to:" },
        {
          type: "list",
          items: [
            "Contact or transact with any vendor directly, bypassing MyShaadiStore, for orders initiated through our platform",
            "Provide false information when placing orders or raising complaints",
            "Abuse the replacement or refund process by misrepresenting the condition of delivered items",
            "Attempt to access other users' accounts or data",
            "Use the platform for any unlawful purpose including money laundering or fraud",
            "Reproduce, distribute, or create derivative works from any MyShaadiStore content without written permission",
            "Attempt to reverse engineer, disrupt, or interfere with the platform's technical infrastructure",
          ],
        },
        { type: "p", text: "Violation of any prohibited conduct may result in immediate account suspension, cancellation of active orders without refund, and legal action." },
      ],
    },
    {
      heading: "10. Intellectual property",
      blocks: [
        { type: "p", text: "All content on www.myshaadistore.com — including the brand name, logo, design, text, images, and software — is owned by or licensed to EPICENHANCE SERVICES & PRODUCTION PRIVATE LIMITED and is protected under Indian intellectual property law." },
        {
          type: "list",
          items: [
            "You may view, print, and download content for personal, non-commercial use only",
            "You may not use the MyShaadiStore name, logo, or branding without our written permission",
            "Vendor portfolio images and content uploaded to the platform remain the intellectual property of the respective vendor but are licensed to MyShaadiStore for use on the platform",
          ],
        },
      ],
    },
    {
      heading: "11. Anti-dowry compliance",
      blocks: [
        { type: "p", text: "MyShaadiStore strictly complies with the Dowry Prohibition Act 1961 and all related Indian legislation. Our platform does not facilitate, encourage, or promote the giving or taking of dowry in any form. The 'Streedhan' category on our platform refers to gifts given voluntarily by family to the bride as a cultural tradition — it is not dowry and is not positioned as such." },
        { type: "p", text: "Any vendor found to be facilitating or promoting dowry practices will be immediately removed from the platform and reported to appropriate authorities." },
      ],
    },
    {
      heading: "12. Governing law and dispute resolution",
      blocks: [
        {
          type: "list",
          items: [
            "These Terms are governed by the laws of the Republic of India",
            "All disputes arising from these Terms or from your use of MyShaadiStore are subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra",
            "Before initiating legal proceedings, you agree to attempt resolution through our WhatsApp support channel — most disputes are resolved within 48 hours",
            "If WhatsApp resolution fails, disputes may be escalated to our email at connect@myshaadistore.com. We will respond within 7 working days.",
          ],
        },
      ],
    },
    {
      heading: "13. Changes to these terms",
      blocks: [
        { type: "p", text: "MyShaadiStore reserves the right to update these Terms of Service at any time. Changes will be published on this page with an updated effective date. For significant changes, we will notify you via WhatsApp or email." },
        { type: "p", text: "Continued use of MyShaadiStore after changes constitutes your acceptance of the updated Terms. If you do not agree with any changes, you must stop using the platform." },
      ],
    },
    {
      heading: "14. Severability",
      blocks: [
        { type: "p", text: "If any provision of these Terms is found to be unlawful, void, or unenforceable by a court of competent jurisdiction, that provision will be deemed severable from these Terms and will not affect the validity and enforceability of the remaining provisions." },
      ],
    },
  ],
};

export const LEGAL_DOCS = {
  "cookie-policy": COOKIE_POLICY,
  "privacy-policy": PRIVACY_POLICY,
  "refund-policy": REFUND_POLICY,
  "terms-of-service": TERMS_OF_SERVICE,
};

export const LEGAL_LINKS = [
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-of-service", label: "Terms of Service" },
  { slug: "refund-policy", label: "Refund Policy" },
  { slug: "cookie-policy", label: "Cookie Policy" },
];
