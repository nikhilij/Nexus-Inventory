"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const InventoryTable = dynamic(() => import('../../components/InventoryTable'), { ssr: false });

export default function InventoryPage(){
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await fetch('/api/inventory-session');
        const json = await res.json();
        if (!mounted) return;
        if (json?.authorized) setAuthorized(true);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }
    check();
    return () => { mounted = false; };
  }, []);

  async function handleSubmit(e){
    e.preventDefault();
    setMessage(null);
    if (!/^[0-9]{5}$/.test(pin)){
      setMessage('Enter a valid 5-digit PIN');
      return;
    }
    setLoading(true);
    try{
      const res = await fetch('/api/validate-inventory-pin', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ pin }) });
      const json = await res.json();
      if (res.ok && json?.ok) {
        setAuthorized(true);
      } else {
        setMessage(json?.error || 'Invalid PIN');
      }
    }catch(err){
      setMessage('Network error');
    }finally{ setLoading(false); }
  }

  if (checkingSession) return <main id="content" style={{padding:24}}>Checking session…</main>;

  if (!authorized) {
    return (
      <main id="content" style={{padding:24}}>
        <h1>Enter access PIN</h1>
        <p>To access the inventory, enter your 5-digit access PIN provided by your administrator.</p>
        <form onSubmit={handleSubmit} style={{marginTop:12}}>
          <label htmlFor="inventory-pin">5-digit PIN</label>
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <input id="inventory-pin" value={pin} onChange={e=>setPin(e.target.value.replace(/[^0-9]/g,'').slice(0,5))} inputMode="numeric" maxLength={5} />
            <button type="submit" disabled={loading}>{loading ? 'Checking…' : 'Enter'}</button>
          </div>
          {message && <div role="alert" style={{marginTop:8}}>{message}</div>}
        </form>
        <div style={{marginTop:12}}>
          <p>Do not have a PIN? <Link href="/contact">Contact your administrator</Link> or <Link href="/signup">start a subscription</Link>.</p>
        </div>
      </main>
    );
  }

  // Authorized: simple inventory dashboard placeholder
  return (
    <main id="content" style={{padding:24}}>
      <h1>Inventory Dashboard</h1>
      <p role="status">Access granted.</p>
      <section style={{marginTop:12}} aria-labelledby="inventory-list">
        <h2 id="inventory-list">SKUs</h2>
        <InventoryTable />
      </section>
    </main>
  );
}
