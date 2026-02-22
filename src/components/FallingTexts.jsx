import React, { useState, useEffect, useRef } from 'react';
import './FallingTexts.css';
import { EXPECTED_LINE1, EXPECTED_LINE2 } from '../lib/guardian';


/* ─── Sequence ──────────────────────────────────────────────────── */
const textSequence = [
    { id: 'dive', duration: 3000, align: 'center' },
    { id: 'intro', duration: 3500, align: 'center' },
    { id: 'creator', duration: 5500, align: 'center' },
    { id: 'alumni', duration: 4000, align: 'center' },
    { id: 'pres', duration: 4500, align: 'center' },
    { id: 'vp', duration: 4500, align: 'center' },
    { id: 'design', duration: 4500, align: 'center' },
];

/* ─── The protected credit strings (sourced from guardian) ──────── */
// These are NOT hardcoded here — they come from the guardian module.
// Changing them here breaks the hash check and triggers the lock screen.
const CREDIT_LINE1 = EXPECTED_LINE1;   // "Website Created by"
const CREDIT_LINE2 = EXPECTED_LINE2;   // "Dipanshu Maheshwari"
const FULL_CREDIT = `${CREDIT_LINE1} ${CREDIT_LINE2}`;

/* ─── Components ─────────────────────────────────────────────────── */
const Underline = ({ colorClass, triggerKey }) => {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.classList.remove('ft-ul-run');
        void el.offsetWidth;
        el.classList.add('ft-ul-run');
    }, [triggerKey]);
    return <span ref={ref} className={`ft-underline ${colorClass}`} />;
};

const Letters = ({ text, show, delay = 0 }) => (
    <>
        {text.split('').map((ch, i) => (
            <span
                key={i}
                className={`ft-letter ${show ? 'ft-letter-show' : 'ft-letter-hide'}`}
                style={{ transitionDelay: show ? `${delay + i * 32}ms` : '0ms' }}
            >
                {ch === ' ' ? '\u00A0' : ch}
            </span>
        ))}
    </>
);

/* ─── Lock Screen (shown when guardian detects tampering) ───────── */
const LockScreen = () => {
    const [pwd, setPwd] = useState('');
    const [error, setError] = useState('');
    const [unlocked, setUnlocked] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (verifyPassword(pwd)) {
            setUnlocked(true);
            setError('');
        } else {
            setError('Access Denied. Incorrect authorization code.');
            setPwd('');
        }
    };

    if (unlocked) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.97)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Orbitron', sans-serif",
        }}>
            {/* Icon */}
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>

            {/* Title */}
            <h1 style={{
                color: '#ff4444', fontSize: 'clamp(1rem, 3vw, 1.6rem)',
                letterSpacing: '0.1em', textAlign: 'center', margin: '0 0 8px',
                textShadow: '0 0 20px rgba(255,60,60,0.7)',
            }}>
                Integrity Violation Detected
            </h1>

            <p style={{
                color: 'rgba(200,200,200,0.7)', fontSize: 'clamp(0.6rem, 1.5vw, 0.82rem)',
                letterSpacing: '0.12em', textAlign: 'center',
                maxWidth: 380, margin: '0 0 32px', lineHeight: 1.6,
            }}>
                The creator attribution has been modified.<br />
                Enter the authorization code to proceed.
            </p>

            {/* Password form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <input
                    type="password"
                    value={pwd}
                    onChange={(e) => { setPwd(e.target.value); setError(''); }}
                    placeholder="Authorization code"
                    autoFocus
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${error ? 'rgba(255,80,80,0.6)' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: 8, padding: '10px 20px',
                        color: '#fff', fontSize: '0.9rem',
                        outline: 'none', letterSpacing: '0.2em',
                        width: 260, textAlign: 'center',
                        transition: 'border-color 0.3s',
                    }}
                />
                <button
                    type="submit"
                    style={{
                        background: 'rgba(255,60,60,0.15)',
                        border: '1px solid rgba(255,80,80,0.4)',
                        borderRadius: 8, padding: '9px 32px',
                        color: '#ff8888', fontSize: '0.75rem',
                        letterSpacing: '0.25em', cursor: 'pointer',
                        fontFamily: "'Orbitron', sans-serif",
                        transition: 'all 0.3s',
                    }}
                >
                    UNLOCK
                </button>
                {error && (
                    <p style={{
                        color: '#ff6666', fontSize: '0.72rem',
                        letterSpacing: '0.1em', margin: 0, textAlign: 'center',
                    }}>
                        {error}
                    </p>
                )}
            </form>

            {/* Watermark */}
            <p style={{
                position: 'absolute', bottom: 20,
                color: 'rgba(255,255,255,0.15)', fontSize: '0.6rem',
                letterSpacing: '0.3em', textTransform: 'uppercase',
            }}>
                Protected by Guardian · Dipanshu Maheshwari
            </p>
        </div>
    );
};

/* ─── Card renderers ─────────────────────────────────────────────── */
const cards = {
    dive: ({ show, ulKey }) => (
        <>
            <h2 className="ft-plain-heading">
                <Letters text="Dive into the space" show={show} delay={40} />
            </h2>
            <Underline colorClass="ft-underline-white" triggerKey={ulKey} />
        </>
    ),

    intro: ({ show, ulKey }) => (
        <>
            <h2 className="ft-plain-heading">
                <Letters text="Introducing Astro Club" show={show} delay={40} />
            </h2>
            <Underline colorClass="ft-underline-white" triggerKey={ulKey} />
        </>
    ),

    // ★ Protected — text sourced from guardian module ★
    creator: ({ show, ulKey }) => (
        <>
            <h2 className="ft-plain-heading">
                <Letters text={CREDIT_LINE1} show={show} delay={40} />
            </h2>
            <h2 className="ft-plain-heading ft-gold" style={{ fontSize: 'clamp(0.85rem, 4vw, 1.55rem)', marginTop: '4px' }}>
                <Letters text={CREDIT_LINE2} show={show} delay={40 + 18 * 32} />
            </h2>
            <Underline colorClass="ft-underline-gold" triggerKey={ulKey} />
        </>
    ),

    alumni: ({ show, ulKey }) => (
        <>
            <span className="ft-plain-sub" style={{ opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 120ms' }}>
                ◈&nbsp;&nbsp;Alumni&nbsp;&nbsp;◈
            </span>
            <h2 className="ft-plain-heading">
                <Letters text="Sameeraj" show={show} delay={130} />
            </h2>
            <Underline colorClass="ft-underline-white" triggerKey={ulKey} />
        </>
    ),

    pres: ({ show, ulKey }) => (
        <>
            <span className="ft-plain-sub" style={{ opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 120ms' }}>
                ◈&nbsp;&nbsp;Current President&nbsp;&nbsp;◈
            </span>
            <h2 className="ft-plain-heading">
                <Letters text="Aditi" show={show} delay={130} />
            </h2>
            <Underline colorClass="ft-underline-white" triggerKey={ulKey} />
        </>
    ),

    vp: ({ show, ulKey }) => (
        <>
            <span className="ft-plain-sub" style={{ opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 120ms' }}>
                ◈&nbsp;&nbsp;Vice President&nbsp;&nbsp;◈
            </span>
            <h2 className="ft-plain-heading">
                <Letters text="Dhruv" show={show} delay={130} />
            </h2>
            <Underline colorClass="ft-underline-white" triggerKey={ulKey} />
        </>
    ),

    design: ({ show, ulKey }) => (
        <>
            <span className="ft-plain-sub" style={{ opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 120ms' }}>
                ◈&nbsp;&nbsp;Design&nbsp;&nbsp;◈
            </span>
            <h2 className="ft-plain-heading">
                <Letters text="Yashashvi Gupta" show={show} delay={130} />
            </h2>
            <Underline colorClass="ft-underline-white" triggerKey={ulKey} />
        </>
    ),
};

/* ─── Main component ─────────────────────────────────────────────── */
const FallingTexts = () => {
    const [currentIdx, setCurrentIdx] = useState(-1);
    const [show, setShow] = useState(false);
    const [ulKey, setUlKey] = useState(0);

    useEffect(() => {
        const timeouts = [];
        let t = 0;

        textSequence.forEach((item, i) => {
            timeouts.push(
                setTimeout(() => {
                    setCurrentIdx(i);
                    setShow(true);
                    setUlKey((k) => k + 1);
                }, t)
            );
            t += item.duration;
            timeouts.push(setTimeout(() => setShow(false), t - 550));
        });

        return () => timeouts.forEach(clearTimeout);
    }, []);

    if (currentIdx < 0) return null;

    const { align, id } = textSequence[currentIdx];
    const CardContent = cards[id];

    return (
        <div className={`ft-wrapper ft-align-${align}`}>
            <div className={`ft-content ft-align-${align} ${show ? 'ft-show' : 'ft-hide'}`}>
                <CardContent show={show} ulKey={ulKey} />
            </div>
        </div>
    );
};

export default FallingTexts;
