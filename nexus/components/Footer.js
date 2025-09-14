"use client";

import {useRef, useState} from 'react';
import Link from 'next/link';

export default function Footer({
  siteMeta = { name: 'Nexus Inventory', logoUrl: null, tagline: 'Inventory management that scales' },
  navGroups = [
    { title: 'Product', links: [ {label:'Products', href:'/products'}, {label:'Inventory', href:'/inventory'}, {label:'Pricing', href:'/pricing'}, {label:'Demo', href:'/demo'} ] },
    { title: 'Company', links: [ {label:'About', href:'/about'}, {label:'Careers', href:'/careers'}, {label:'Blog', href:'/blog'} ] },
    { title: 'Resources', links: [ {label:'Docs', href:'/docs'}, {label:'API', href:'/api'}, {label:'Tutorials', href:'/tutorials'}, {label:'Status', href:'/status'} ] },
    { title: 'Support', links: [ {label:'Contact', href:'/contact'}, {label:'Help Center', href:'/help'}, {label:'Community', href:'/community'} ] },
  ],
  contact = { email: null, phone: null, supportUrl: null },
  social = [],
  legalLinks = [ {label:'Privacy Policy', href:'/privacy'}, {label:'Terms of Service', href:'/terms'}, {label:'Cookie Policy', href:'/cookies'} ],
  buildInfo = null,
  localeOptions = null,
  newsletterAction = null,
  isAuthenticated = false,
}){
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null);
  const liveRef = useRef(null);

  function onNewsletterSubmit(e){
    e?.preventDefault();
    if(!newsletterAction){
      setNewsletterStatus('subscribe-link');
      liveRef.current?.focus();
      return;
    }
    // allow newsletterAction to be a URL or a callback
    if(typeof newsletterAction === 'string'){
      // naive POST, progressive enhancement recommended server-side
      fetch(newsletterAction, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: newsletterEmail }) })
        .then(r=>{ if(r.ok) setNewsletterStatus('subscribed'); else setNewsletterStatus('error'); liveRef.current?.focus(); })
        .catch(()=>{ setNewsletterStatus('error'); liveRef.current?.focus(); });
    } else if(typeof newsletterAction === 'function'){
      Promise.resolve(newsletterAction(newsletterEmail)).then(()=>{ setNewsletterStatus('subscribed'); liveRef.current?.focus(); }).catch(()=>{ setNewsletterStatus('error'); liveRef.current?.focus(); });
    }
  }

  function backToTop(){
    const main = document.getElementById('content') || document.querySelector('main') || document.body;
    main.scrollIntoView({ behavior: 'smooth' });
    // move focus to content start
    const first = main.querySelector('a,button,input,select,textarea,h1,h2,h3,p');
    first?.focus();
  }

  return (
    <footer role="contentinfo" className="site-footer" style={{padding:20,background:'#f8f9fa'}}>
      <div className="footer-top" style={{display:'flex',gap:24,flexWrap:'wrap',justifyContent:'space-between'}}>
        {/* Left / Brand area */}
        <div className="footer-brand" style={{minWidth:200}}>
          <Link href="/" aria-label={`${siteMeta.name} home`}>
            {siteMeta.logoUrl ? <img src={siteMeta.logoUrl} alt={`${siteMeta.name} logo`} style={{height:32}}/> : <strong>{siteMeta.name}</strong>}
          </Link>
          <div className="tagline" style={{fontSize:12,color:'#444'}}>{siteMeta.tagline}</div>
        </div>

        {/* Center / Primary links */}
        <div className="footer-links" style={{display:'flex',gap:24,flex:1,flexWrap:'wrap'}}>
          {navGroups.map(group=> (
            <div key={group.title} className="footer-group" style={{minWidth:120}}>
              <h4 style={{fontSize:13,margin:'0 0 8px 0'}}>{group.title}</h4>
              <ul style={{listStyle:'none',padding:0,margin:0}}>
                {group.links.map(link=> (
                  <li key={link.href+link.label} style={{marginBottom:6}}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Right / Utilities & meta */}
        <div className="footer-utils" style={{minWidth:200}}>
          <div className="contact">
            <div style={{fontSize:13,fontWeight:600}}>Contact</div>
            {contact.supportUrl ? <a href={contact.supportUrl}>Contact support</a> : contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : <div>Support: —</div>}
            {contact.phone ? <div><a href={`tel:${contact.phone}`}>{contact.phone}</a></div> : null}
          </div>

          {social?.length > 0 && (
            <div className="social" style={{marginTop:8}}>
              {social.map(s=> (
                <a key={s.provider} href={s.href} aria-label={s.provider} style={{marginRight:8}} target="_blank" rel="noopener noreferrer">{s.provider}</a>
              ))}
            </div>
          )}

          <div className="newsletter" style={{marginTop:12}}>
            {!isAuthenticated ? (
              newsletterAction ? (
                <form onSubmit={onNewsletterSubmit}>
                  <label htmlFor="footer-newsletter" className="visually-hidden">Email for newsletter</label>
                  <input id="footer-newsletter" type="email" placeholder="Email" value={newsletterEmail} onChange={e=>setNewsletterEmail(e.target.value)} />
                  <button type="submit">Subscribe</button>
                </form>
              ) : (
                <a href="/subscribe">Subscribe to our newsletter</a>
              )
            ) : (
              <div>
                <Link href="/account">Manage subscription</Link>
                <div><Link href="/settings">Account settings</Link></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legal strip */}
      <div className="footer-bottom" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:20,borderTop:'1px solid #e6e6e6',paddingTop:12}}>
        <div className="legal">
          <div>© {new Date().getFullYear()} {siteMeta.name}</div>
          <div style={{display:'flex',gap:8}}>
            {legalLinks.map(l=> (
              <span key={l.href}><Link href={l.href}>{l.label}</Link></span>
            ))}
          </div>
        </div>

        <div className="meta" style={{fontSize:12,color:'#666'}}>
          {buildInfo ? (
            <div>
              <span>{buildInfo.version ? `v${buildInfo.version}` : null}</span>
              {buildInfo.commit ? <span style={{marginLeft:8}}>commit {buildInfo.commit.slice(0,7)}</span> : null}
              {buildInfo.environment ? <span style={{marginLeft:8}}>env: {buildInfo.environment}</span> : null}
            </div>
          ) : null}

          <div style={{marginTop:6}}>
            <button onClick={backToTop} aria-label="Back to top">Back to top</button>
          </div>
        </div>
      </div>

      {/* Live region for status messages */}
      <div tabIndex={-1} ref={liveRef} aria-live="polite" style={{position:'absolute',left:-9999,top:'auto',width:1,height:1,overflow:'hidden'}}>
        {newsletterStatus === 'subscribed' ? 'Subscribed to newsletter' : newsletterStatus === 'error' ? 'Failed to subscribe' : newsletterStatus === 'subscribe-link' ? 'Open subscribe page' : ''}
      </div>
    </footer>
  );
}
