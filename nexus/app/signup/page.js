"use client";

import {useState} from 'react';
import Link from 'next/link';

export default function SignupPage(){
  const [method, setMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(null);

  async function handleEmailSignup(e){
    e.preventDefault();
    setMessage('Creating account...');
    try{
      const res = await fetch('/api/auth/signup', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password, company, phone }) });
      if(res.ok) setMessage('Account created (placeholder)'); else setMessage('Signup failed');
    }catch(err){ setMessage('Network error'); }
  }

  return (
    <main style={{padding:24}}>
      <h1>Create your account</h1>

      <section aria-label="social signups" style={{marginBottom:12}}>
        <p>Continue with</p>
        <div style={{display:'flex',gap:8}}>
          <a href="/api/auth/google"><button>Continue with Google</button></a>
          <a href="/api/auth/github"><button>Continue with GitHub</button></a>
        </div>
      </section>

      <section>
        <h2>Signup methods</h2>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <button onClick={()=>setMethod('email')} aria-pressed={method==='email'}>Email</button>
          <button onClick={()=>setMethod('phone')} aria-pressed={method==='phone'}>Phone</button>
        </div>

        {method === 'email' && (
          <form onSubmit={handleEmailSignup}>
            <label>Full name<br/><input value={name} onChange={e=>setName(e.target.value)} required /></label><br/>
            <label>Company<br/><input value={company} onChange={e=>setCompany(e.target.value)} /></label><br/>
            <label>Email<br/><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required /></label><br/>
            <label>Password<br/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" required /></label><br/>
            <button type="submit">Create account</button>
          </form>
        )}

        {method === 'phone' && (
          <form>
            <label>Phone<br/><input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" required /></label><br/>
            <button>Continue with phone</button>
          </form>
        )}
      </section>

      {message && <div role="status" aria-live="polite" style={{marginTop:12}}>{message}</div>}

      <footer style={{marginTop:24}}>
        <p>Already have an account? <Link href="/login">Sign in</Link></p>
      </footer>
    </main>
  );
}
