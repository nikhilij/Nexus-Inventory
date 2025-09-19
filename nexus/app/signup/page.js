"use client";

import {useState} from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

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
          <button onClick={() => signIn('google', { callbackUrl: '/subscriber' })}>Continue with Google</button>
        </div>
        <p style={{marginTop:8,fontSize:12,color:'#666'}}>Note: Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_SECRET` in your `.env.local` before using Google sign-in.</p>
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
