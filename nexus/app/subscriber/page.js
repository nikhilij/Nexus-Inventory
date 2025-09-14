"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SubscriberGatePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [pin, setPin] = useState("");
  const [validating, setValidating] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      try {
        const res = await fetch('/api/user');
        const json = await res.json();
        if (!mounted) return;
        setUser(json);
      } catch (e) {
        if (!mounted) return;
        setError('Unable to reach authentication service.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchUser();
    return () => { mounted = false; };
  }, []);

  async function handleSubmitPin(e) {
    e.preventDefault();
    setMessage(null);
    if (!/^[0-9]{6}$/.test(pin)) {
      setMessage('Please enter a valid 6-digit PIN.');
      return;
    }
    setValidating(true);
    try {
      const res = await fetch('/api/validate-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (res.ok && json?.ok) {
        setAuthorized(true);
      } else {
        setMessage(json?.error || 'Invalid PIN.');
      }
    } catch (e) {
      setMessage('Network error while validating PIN.');
    } finally {
      setValidating(false);
    }
  }

  if (loading) return <main id="content" style={{ padding: 24 }}>Loading…</main>;
  if (error) return <main id="content" style={{ padding: 24 }}><p role="alert">{error}</p></main>;

  // If user is not authenticated, prompt to sign in
  if (!user?.authenticated) {
    return (
      <main id="content" style={{ padding: 24 }}>
        <h1>Access requires sign in</h1>
        <p>You must be signed in to access subscriber-only areas.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/login"><button>Sign in</button></Link>
          <Link href="/signup"><button>Sign up</button></Link>
        </div>
      </main>
    );
  }

  // User is signed in but not subscribed
  if (!user?.subscribed) {
    return (
      <main id="content" style={{ padding: 24 }}>
        <h1>You are not subscribed yet</h1>
        <p role="status">Hi {user?.user?.name ?? 'there'}, it looks like you do not have an active subscription for our product inventory service.</p>

        <section aria-labelledby="contact-cta">
          <h2 id="contact-cta">Need help getting started?</h2>
          <p>
            Share about your business, tell us what you are planning, and let the team know if you need assistance setting up inventory tracking, integrations, or workflows.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Link href="/contact"><button>Contact our team</button></Link>
            <Link href="/signup"><button>Start a subscription</button></Link>
          </div>
          <p style={{ marginTop: 12 }}>Prefer to talk? Email <a href="mailto:sales@example.com">sales@example.com</a> or call +1 (555) 555-5555.</p>
        </section>
      </main>
    );
  }

  // Subscribed user: require 6-digit PIN to proceed
  if (!authorized) {
    return (
      <main id="content" style={{ padding: 24 }}>
        <h1>Enter your 6‑digit access PIN</h1>
        <p role="status">As an extra security step, please enter the 6-digit PIN provided by your organization to access the product inventory.</p>

        <form onSubmit={handleSubmitPin} aria-describedby="pin-help" style={{ marginTop: 12 }}>
          <label htmlFor="access-pin">6-digit PIN</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input
              id="access-pin"
              name="pin"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              aria-required="true"
            />
            <button type="submit" disabled={validating}>{validating ? 'Validating…' : 'Unlock'}</button>
          </div>
          <div id="pin-help" style={{ marginTop: 8 }}>
            <small>{message}</small>
          </div>
        </form>

        <div style={{ marginTop: 18 }}>
          <p>If you do not have a PIN, contact your organization administrator or <Link href="/contact">contact our support team</Link>.</p>
        </div>
      </main>
    );
  }

  // Authorized — render protected product inventory entry point (simple placeholder)
  return (
    <main id="content" style={{ padding: 24 }}>
      <h1>Welcome to the Inventory</h1>
      <p role="status">Access granted. You may now enter the product inventory.</p>
      <div style={{ marginTop: 12 }}>
        <Link href="/inventory"><button>Enter Inventory</button></Link>
      </div>
    </main>
  );
}
