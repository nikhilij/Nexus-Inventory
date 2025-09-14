export const metadata = {
  title: 'Contact — Nexus Inventory',
  description: 'Contact Nexus Inventory for sales, support, demos, or to request an on-site consultation.'
};

export default function ContactPage(){
  return (
    <main>
      <section>
        <h1>Get in touch — sales, support, or request an on-site consultation</h1>
        <p>Use the quick form below or reach us via email or phone.</p>
      </section>

      <section>
        <h2>Contact form</h2>
        <form action="/api/lead" method="post">
          <label>Name<br/><input name="name" /></label><br/>
          <label>Email<br/><input name="email" type="email" /></label><br/>
          <label>Company<br/><input name="company" /></label><br/>
          <label>Type<br/>
            <select name="type">
              <option value="sales">Sales</option>
              <option value="support">Support</option>
              <option value="press">Press</option>
              <option value="partnership">Partnership</option>
            </select>
          </label><br/>
          <label>Message<br/><textarea name="message"></textarea></label><br/>
          <button type="submit">Submit</button>
        </form>
      </section>

      <section>
        <h2>Direct contact</h2>
        <p>Support: support@yourdomain.com</p>
        <p>Sales: sales@yourdomain.com</p>
        <p>Phone: +1-555-555-5555</p>
      </section>
    </main>
  );
}
