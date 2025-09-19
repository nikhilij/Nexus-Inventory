"use client";

import {useState} from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage(){
  const [method, setMethod] = useState('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState(null);

  async function handlePasswordLogin(e){
    e.preventDefault();
    setMessage('Signing in...');
    try{
      // Example: POST to your auth endpoint
      const res = await fetch('/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password, username }) });
      if(res.ok) setMessage('Signed in (placeholder)'); else setMessage('Sign in failed');
    }catch(err){ setMessage('Network error'); }
  }

  async function handleSendOtp(e){
    e.preventDefault();
    setMessage('Sending OTP...');
    try{
      const res = await fetch('/api/auth/otp/send', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone }) });
      if(res.ok) setMessage('OTP sent'); else setMessage('Failed to send OTP');
    }catch(err){ setMessage('Network error'); }
  }

  async function handleVerifyOtp(e){
    e.preventDefault();
    setMessage('Verifying OTP...');
    try{
      const res = await fetch('/api/auth/otp/verify', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone, otp }) });
      if(res.ok) setMessage('Signed in with OTP (placeholder)'); else setMessage('OTP verification failed');
    }catch(err){ setMessage('Network error'); }
  }

  async function handleMagicLink(e){
    e.preventDefault();
    setMessage('Sending magic link...');
    try{
      const res = await fetch('/api/auth/magic-link', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
      if(res.ok) setMessage('Magic link sent'); else setMessage('Failed to send magic link');
    }catch(err){ setMessage('Network error'); }
  }

  return (
    <main style={{padding:24}}>
      <h1>Sign in</h1>

      <section aria-label="social logins" style={{marginBottom:12}}>
        <p>Sign in with</p>
        <div style={{display:'flex',gap:8}}>
          <button onClick={() => signIn('google', { callbackUrl: '/subscriber' })}>Continue with Google</button>
        </div>
        <p style={{marginTop:8,fontSize:12,color:'#666'}}>Note: Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_SECRET` in your `.env.local` before using Google sign-in.</p>
      </section>

      <section aria-labelledby="methods-heading">
        <h2 id="methods-heading">Other ways to sign in</h2>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <button onClick={()=>setMethod('password')} aria-pressed={method==='password'}>Email / Password</button>
          <button onClick={()=>setMethod('otp')} aria-pressed={method==='otp'}>Phone (OTP)</button>
          <button onClick={()=>setMethod('magic')} aria-pressed={method==='magic'}>Magic Link</button>
        </div>

        {method === 'password' && (
          <form onSubmit={handlePasswordLogin} aria-label="Email and password login">
            <label>Email or username<br/><input value={email} onChange={e=>setEmail(e.target.value)} type="email" name="email" autoComplete="email" required /></label><br/>
            <label>Password<br/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" name="password" autoComplete="current-password" required /></label><br/>
            <button type="submit">Sign in</button>
            <p><Link href="/forgot">Forgot password?</Link></p>
          </form>
        )}

        {method === 'otp' && (
          <div>
            <form onSubmit={handleSendOtp} aria-label="send otp">
              <label>Phone number<br/><input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" name="phone" placeholder="+1..." required /></label>
              <button type="submit">Send OTP</button>
            </form>
            <form onSubmit={handleVerifyOtp} aria-label="verify otp">
              <label>Enter OTP<br/><input value={otp} onChange={e=>setOtp(e.target.value)} type="text" name="otp" inputMode="numeric" /></label>
              <button onClick={handleVerifyOtp}>Verify OTP</button>
            </form>
          </div>
        )}

        {method === 'magic' && (
          <form onSubmit={handleMagicLink} aria-label="magic link">
            <label>Email<br/><input value={email} onChange={e=>setEmail(e.target.value)} type="email" name="email" required /></label>
            <button type="submit">Send magic link</button>
          </form>
        )}
      </section>

      {message && <div role="status" aria-live="polite" style={{marginTop:12}}>{message}</div>}

      <footer style={{marginTop:24}}>
        <p>New here? <Link href="/signup">Create an account</Link></p>
      </footer>
    </main>
  );
}
