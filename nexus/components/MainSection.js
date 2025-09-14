import Link from 'next/link';

export default function MainSection(){
  return (
    <main aria-labelledby="hero-heading" className="main-section" style={{padding:24}}>
      {/* Hero */}
      <section className="hero" aria-labelledby="hero-heading" style={{display:'grid',gap:12,marginBottom:24}}>
        <div>
          <h1 id="hero-heading">Intelligent Inventory Management for Growing Businesses</h1>
          <p className="lead">Real-time stock, automated reorders, and AI forecasting — streamline operations across warehouses, sales channels, and suppliers.</p>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <Link href="/signup"><button>Start free trial</button></Link>
            <Link href="/contact"><button>Request demo</button></Link>
          </div>
          <ul style={{display:'flex',gap:12,marginTop:12,listStyle:'none',padding:0}}>
            <li>No credit card required</li>
            <li>Multi-warehouse ready</li>
            <li>Integrates with Shopify & QuickBooks</li>
          </ul>
        </div>
        <div aria-hidden className="hero-visual">[Illustration or video]</div>
      </section>

      {/* Key value propositions */}
      <section aria-labelledby="values-heading" className="values" style={{marginBottom:24}}>
        <h2 id="values-heading">Why teams choose Nexus</h2>
        <ul style={{display:'flex',gap:12,listStyle:'none',padding:0}}>
          <li><strong>Reduce stockouts</strong><div>AI predicts demand and suggests reorder quantities.</div></li>
          <li><strong>Save time</strong><div>Automate purchase orders and supplier workflows.</div></li>
          <li><strong>Stay compliant</strong><div>Audit-ready logs, batch & expiry tracking.</div></li>
        </ul>
      </section>

      {/* Product tour / How it works */}
      <section aria-labelledby="tour-heading" className="tour" style={{marginBottom:24}}>
        <h2 id="tour-heading">How it works</h2>
        <ol>
          <li><strong>Connect your catalogs</strong> — import SKUs from CSV, Shopify, or ERP.</li>
          <li><strong>Map warehouses & locations</strong> — set minimums and storage zones.</li>
          <li><strong>Automate reorders</strong> — set rules or use AI recommendations.</li>
          <li><strong>Measure & improve</strong> — dashboards, alerts, and audit logs.</li>
        </ol>
      </section>

      {/* Core features */}
      <section aria-labelledby="features-heading" className="features" style={{marginBottom:24}}>
        <h2 id="features-heading">Core features</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
          <article>
            <h3>Inventory Tracking</h3>
            <p>Real-time stock levels by warehouse, batch, and expiry.</p>
          </article>
          <article>
            <h3>Reorder Automation</h3>
            <p>Auto-create POs based on safety stock, sales trends, and lead times.</p>
          </article>
          <article>
            <h3>Barcode & Mobile Scanning</h3>
            <p>Fast receiving, picking, and cycle counts with mobile-first flows.</p>
          </article>
          <article>
            <h3>Forecasting & AI</h3>
            <p>Demand forecasts tuned to your SKUs and seasonal trends.</p>
          </article>
        </div>
      </section>

      {/* Integrations */}
      <section aria-labelledby="integrations-heading" className="integrations" style={{marginBottom:24}}>
        <h2 id="integrations-heading">Integrations & ecosystem</h2>
        <p>Connect Shopify, QuickBooks, Xero, barcode hardware and more — keep stock synced across channels.</p>
        <Link href="/integrations">See all integrations</Link>
      </section>

      {/* Pricing snapshot */}
      <section aria-labelledby="pricing-heading" className="pricing" style={{marginBottom:24}}>
        <h2 id="pricing-heading">Pricing snapshot</h2>
        <div style={{display:'flex',gap:12}}>
          <div>
            <h3>Starter</h3>
            <p>Up to 2 warehouses · Basic inventory · Email support</p>
          </div>
          <div>
            <h3>Growth</h3>
            <p>Multi-warehouse · Forecasting & automations · Phone support</p>
          </div>
          <div>
            <h3>Enterprise</h3>
            <p>Custom SLAs · Dedicated onboarding · Advanced integrations</p>
          </div>
        </div>
        <div style={{marginTop:12}}>
          <Link href="/pricing">Compare plans</Link>
        </div>
      </section>

      {/* Social proof */}
      <section aria-labelledby="trust-heading" className="trust" style={{marginBottom:24}}>
        <h2 id="trust-heading">Trusted by teams worldwide</h2>
        <blockquote>Nexus Inventory reduced stockouts by 32% in 3 months — Sarah K., Head of Operations</blockquote>
      </section>

      {/* Demo / Try */}
      <section aria-labelledby="cta-heading" className="cta" style={{marginBottom:24}}>
        <h2 id="cta-heading">See it in action</h2>
        <p>Book a 30-minute demo or start a free trial — no credit card required.</p>
        <div style={{display:'flex',gap:8}}>
          <Link href="/signup"><button>Start free trial</button></Link>
          <Link href="/contact"><button>Schedule demo</button></Link>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="faq" style={{marginBottom:24}}>
        <h2 id="faq-heading">FAQ</h2>
        <dl>
          <dt>Do I need to install anything?</dt>
          <dd>No — the app is web-based. Mobile scanning uses our lightweight web UI or optional handheld app.</dd>
          <dt>Can I migrate data from my current system?</dt>
          <dd>Yes — CSV import and guided onboarding available. Enterprise migrations supported.</dd>
        </dl>
      </section>
    </main>
  );
}
