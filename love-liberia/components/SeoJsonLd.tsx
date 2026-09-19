type SeoJsonLdProps = { title: string; description: string; url: string };

export default function SeoJsonLd({ title, description, url }: SeoJsonLdProps) {
  const graph = [
    { "@type": "WebSite", "@id": `${url}#website`, url, name: "Love Liberia", description, potentialAction: { "@type": "SearchAction", target: `${url}/discover?city={search_term_string}`, "query-input": "required name=search_term_string" } },
    { "@type": "WebPage", "@id": `${url}#webpage`, url, name: title, description, isPartOf: { "@id": `${url}#website` } },
    { "@type": "Organization", name: "Love Liberia", url, logo: `${url}/icon.svg`, sameAs: ["https://www.facebook.com/loveliberia", "https://www.instagram.com/loveliberia", "https://www.tiktok.com/@loveliberia", "https://x.com/loveliberia", "https://www.youtube.com/@loveliberia"] },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }} />;
}
