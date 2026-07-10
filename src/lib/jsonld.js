/**
 * JSON-LD structured data schema generators.
 * All functions return a plain object — pass to <JsonLd data={...} />.
 * BASE_URL is read at runtime so it works for both dev and production.
 */

function base() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com").replace(/\/$/, "");
}

// ─── Root-level schemas (rendered in layout) ─────────────────────────────────

export function organizationSchema() {
  const url = base();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name: "MyShaadiStore",
    url,
    logo: {
      "@type": "ImageObject",
      url: `${url}/Circular_logo.png`,
      width: 512,
      height: 512,
    },
    description:
      "MyShaadiStore is India's all-in-one wedding planning platform — guided journey steps, curated vendors, and seamless shopping for every couple.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
    areaServed: "IN",
    knowsAbout: [
      "Wedding Planning",
      "Wedding Photography",
      "Wedding Decor",
      "Wedding Catering",
      "Bridal Makeup",
      "Wedding Venue",
      "Wedding Shopping",
    ],
  };
}

export function websiteSchema() {
  const url = base();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name: "MyShaadiStore",
    url,
    description: "India's wedding planning platform",
    publisher: { "@id": `${url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/shopping?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── Page-level schemas ────────────────────────────────────────────────────────

export function webPageSchema({ title, description, url, breadcrumbs } = {}) {
  const b = base();
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { "@id": `${b}/#website` },
    publisher: { "@id": `${b}/#organization` },
    ...(breadcrumbs ? { breadcrumb: breadcrumbSchema(breadcrumbs) } : {}),
  };
}

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function articleSchema({ title, description, url, image, datePublished, dateModified, author } = {}) {
  const b = base();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(image ? { image: [image] } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: { "@type": author ? "Person" : "Organization", name: author || "MyShaadiStore" },
    publisher: { "@type": "Organization", name: "MyShaadiStore", url: b },
  };
}

export function productSchema(item) {
  const b = base();
  const images =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : item.image
      ? [item.image]
      : [`${b}/Circular_logo.png`];

  const price = Number(item.final_price ?? item.price ?? 0);
  const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${b}/items/${item.item_id}#product`,
    name: item.name,
    description:
      item.description ||
      item.subcategory_label ||
      item.category_label ||
      `${item.name} for your wedding`,
    image: images,
    sku: item.item_id,
    url: `${b}/items/${item.item_id}`,
    brand: {
      "@type": "Brand",
      name:
        item.vendor_business_name || item.vendor_name || "MyShaadiStore",
    },
    offers: {
      "@type": "Offer",
      "@id": `${b}/items/${item.item_id}#offer`,
      url: `${b}/items/${item.item_id}`,
      priceCurrency: "INR",
      price,
      priceValidUntil,
      availability:
        item.stock_status === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "MyShaadiStore", url: b },
    },
  };

  if (item.category_label) schema.category = item.category_label;

  if (item.rating_value && Number(item.rating_value) > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(item.rating_value).toFixed(1),
      reviewCount: item.rating_count || 1,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function itemListSchema({ name, description, url, items = [] }) {
  const b = base();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    url: url || b,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 20).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${b}/items/${item.item_id}`,
      image:
        (Array.isArray(item.images) ? item.images[0] : item.image) ||
        `${b}/Circular_logo.png`,
    })),
  };
}

export function howToSchema() {
  const b = base();
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Plan Your Wedding with MyShaadiStore",
    description:
      "A step-by-step guide to planning your perfect wedding using MyShaadiStore's guided platform.",
    image: `${b}/Circular_logo.png`,
    totalTime: "PT30M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Create your account",
        text: "Sign up and tell us about your wedding date, venue, and guest count to personalise your journey.",
        url: `${b}/signup`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Follow your personalised journey",
        text: "Browse curated wedding services for each step — venue, catering, photography, décor, makeup, and more.",
        url: `${b}/journey`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Request quotations",
        text: "Add services to your quote cart and send one inquiry to compare offers from verified vendors.",
        url: `${b}/cart?tab=quotation`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Shop wedding products",
        text: "Browse and order wedding essentials — outfits, décor, gifts, and more — with secure Razorpay checkout.",
        url: `${b}/shopping`,
      },
    ],
  };
}

export function faqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
