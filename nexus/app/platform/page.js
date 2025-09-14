export const metadata = {
  title: 'Platform — Nexus Inventory',
  description: 'Technical overview of Nexus Inventory platform: architecture, integrations, APIs, security and deployment options for enterprise-grade inventory control.'
};

export default function PlatformPage(){
  return (
    <main>
      <section>
        <h1>Platform built for reliable, scalable inventory operations</h1>
        <p>API-first, cloud-native, secure — integrates with commerce, accounting, and warehouse systems.</p>
      </section>

      <section>
        <h2>Capabilities</h2>
        <ul>
          <li>Realtime inventory</li>
          <li>Batch & expiry tracking</li>
          <li>Reorder automations & AI forecasting</li>
          <li>Mobile scanning & offline support</li>
        </ul>
      </section>

      <section>
        <h2>Architecture overview</h2>
        <p>Diagram: Client UI, API layer, workers, DB, integrations, AI pipeline.</p>
      </section>

      <section>
        <h2>APIs & developer resources</h2>
        <p>Links to API docs, SDKs, and sandbox environment.</p>
      </section>

      <section>
        <h2>Security & compliance</h2>
        <p>Encryption, SOC2, GDPR, SSO/SAML, RBAC and audit trails.</p>
      </section>
    </main>
  );
}
