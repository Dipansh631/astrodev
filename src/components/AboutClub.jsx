import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import BlackholeAnimation from './BlackholeAnimation';

/* ─────────────────────────────────────────
   SHOOTING STARS CANVAS
───────────────────────────────────────── */
function ShootingStarsCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let animFrameId;
        let stars = [];
        let shooters = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Background static stars
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.2 + 0.2,
                alpha: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleDir: Math.random() > 0.5 ? 1 : -1,
            });
        }

        const spawnShooter = () => {
            const angle = Math.PI / 5; // ~36 degrees
            const speed = Math.random() * 6 + 5;
            shooters.push({
                x: Math.random() * canvas.width * 0.8,
                y: Math.random() * canvas.height * 0.3,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                len: Math.random() * 120 + 80,
                alpha: 1,
                tail: [],
            });
        };

        // Spawn shooters periodically
        const spawnInterval = setInterval(() => {
            if (shooters.length < 4) spawnShooter();
        }, 1200);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw static stars
            stars.forEach(s => {
                s.alpha += s.twinkleSpeed * s.twinkleDir;
                if (s.alpha >= 1) { s.twinkleDir = -1; s.alpha = 1; }
                if (s.alpha <= 0.1) { s.twinkleDir = 1; s.alpha = 0.1; }
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
                ctx.fill();
            });

            // Draw shooting stars
            shooters.forEach((sh) => {
                sh.tail.push({ x: sh.x, y: sh.y });
                if (sh.tail.length > 18) sh.tail.shift();

                // Draw tail gradient
                for (let i = 0; i < sh.tail.length - 1; i++) {
                    const t = i / sh.tail.length;
                    ctx.beginPath();
                    ctx.moveTo(sh.tail[i].x, sh.tail[i].y);
                    ctx.lineTo(sh.tail[i + 1].x, sh.tail[i + 1].y);
                    ctx.strokeStyle = `rgba(180,210,255,${t * sh.alpha * 0.9})`;
                    ctx.lineWidth = t * 2.5;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }

                // Draw head glow
                const grd = ctx.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, 6);
                grd.addColorStop(0, `rgba(220,240,255,${sh.alpha})`);
                grd.addColorStop(1, 'rgba(100,160,255,0)');
                ctx.beginPath();
                ctx.arc(sh.x, sh.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();

                sh.x += sh.vx;
                sh.y += sh.vy;
                sh.alpha -= 0.012;
            });

            // Remove dead shooters
            shooters = shooters.filter(s => s.alpha > 0 && s.x < canvas.width + 100 && s.y < canvas.height + 100);

            animFrameId = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(animFrameId);
            clearInterval(spawnInterval);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: -1 }}
        />
    );
}

/* ─────────────────────────────────────────
   SCROLL REVEAL HOOK
───────────────────────────────────────── */
function useReveal(threshold = 0.12) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
        }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, visible];
}

function RevealSection({ children, className = '', delay = 0 }) {
    const [ref, visible] = useReveal();
    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

/* ─────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────── */
function AnimatedNumber({ target, suffix = '' }) {
    const [count, setCount] = useState(0);
    const [ref, visible] = useReveal(0.5);
    useEffect(() => {
        if (!visible || target === '∞' || typeof target !== 'number') return;
        let start = 0;
        const duration = 1200;
        const steps = 50;
        const increment = target / steps;
        const interval = duration / steps;
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, interval);
        return () => clearInterval(timer);
    }, [visible, target]);

    return (
        <span ref={ref}>
            {target === '∞' ? '∞' : typeof target === 'number' ? count + suffix : target + suffix}
        </span>
    );
}

/* ─────────────────────────────────────────
   STATIC CLUB DATA
───────────────────────────────────────── */
const MISSION = "To ignite humanity's curiosity about the cosmos — building a community of stargazers, astrophotographers, researchers, and space explorers who share knowledge, collaborate on missions, and push the boundaries of what we understand about our universe.";

const PILLARS = [
    { icon: '🔭', title: 'Observation', desc: 'Regular stargazing sessions, telescope workshops, and celestial event tracking.' },
    { icon: '📸', title: 'Astrophotography', desc: 'Capturing the universe through lenses — from the Moon to distant nebulae.' },
    { icon: '🧪', title: 'Research', desc: 'Collaborative research papers, data analysis, and citizen science contributions.' },
    { icon: '🚀', title: 'Events', desc: 'Competitions, launches, meteor shower watch parties, and inter-college fests.' },
    { icon: '📡', title: 'Outreach', desc: 'Inspiring school students and the public with astronomy camps and seminars.' },
    { icon: '🌐', title: 'Community', desc: 'A ranked order of members — from Common Travelers to the legendary Gods.' },
];

const TIMELINE = [
    { year: '2022', title: 'Big Bang', desc: 'The Astro Club was founded with a handful of enthusiasts, a single telescope, and an infinite curiosity.' },
    { year: '2023', title: 'First Light', desc: 'Hosted our first inter-college astronomy quiz, astrophotography contest, and launched the Rank System.' },
    { year: '2024', title: 'Expansion', desc: 'Grew to 50+ members, established dedicated departments — Photography, Research, Outreach, and Events.' },
    { year: '2025', title: 'Digital Frontier', desc: 'Launched this mission platform with real-time events, member profiles, and the Command Center.' },
    { year: '2026', title: 'Beyond', desc: 'New missions incoming — satellite tracking, deep sky imaging, and potential observatory partnerships.' },
];

const DEPARTMENTS = [
    { name: 'Astrophotography', icon: '📸', color: 'from-pink-500/20 to-purple-500/20', border: 'border-pink-500/30', desc: 'Capturing the cosmos, one exposure at a time.' },
    { name: 'Research', icon: '🧪', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', desc: 'Pushing the frontier of academic astronomy.' },
    { name: 'Outreach', icon: '📡', color: 'from-green-500/20 to-teal-500/20', border: 'border-green-500/30', desc: 'Spreading the wonder of space to everyone.' },
    { name: 'Events', icon: '🎯', color: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30', desc: 'Engineering experiences that launch imaginations.' },
    { name: 'Technology', icon: '💻', color: 'from-violet-500/20 to-indigo-500/20', border: 'border-violet-500/30', desc: 'Building the digital infrastructure of the club.' },
];

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const AboutClub = ({ onNavigate }) => {
    const [showAnimation, setShowAnimation] = useState(true);
    const [activePillar, setActivePillar] = useState(null);
    const [liveStats, setLiveStats] = useState({
        members: null,
        events: null,
        activeEvents: null,
        departments: null,
    });
    const [statsLoading, setStatsLoading] = useState(true);

    // Fetch real stats from Supabase
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [profilesRes, eventsRes] = await Promise.all([
                    supabase.from('profiles').select('id, department', { count: 'exact' }),
                    supabase.from('events').select('id, status', { count: 'exact' }),
                ]);

                const members = profilesRes.count ?? 0;
                const totalEvents = eventsRes.count ?? 0;
                const activeEvents = (eventsRes.data ?? []).filter(e => e.status === 'active').length;

                // Count unique non-null departments
                const depts = new Set(
                    (profilesRes.data ?? []).map(p => p.department).filter(Boolean)
                );
                const departments = depts.size || 5;

                setLiveStats({ members, events: totalEvents, activeEvents, departments });
            } catch (err) {
                console.error('AboutClub stats fetch error:', err);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { value: liveStats.members, suffix: '+', label: 'Active Members', icon: '🧑‍🚀' },
        { value: liveStats.events, suffix: '', label: 'Events Hosted', icon: '🎯' },
        { value: liveStats.departments, suffix: '', label: 'Departments', icon: '🏛️' },
        { value: '∞', suffix: '', label: 'Stars Observed', icon: '✨' },
    ];

    if (showAnimation) {
        return <BlackholeAnimation onComplete={() => setShowAnimation(false)} />;
    }

    return (
        <div className="text-white space-y-28 pb-20 relative">
            <ShootingStarsCanvas />

            {/* ── HERO with shooting stars ── */}
            <div className="relative min-h-[50vh] flex flex-col items-center justify-center text-center overflow-hidden rounded-3xl border border-white/5 bg-black/30 p-12">
                {/* Pulsing nebula orb */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-br from-blue-700/15 via-purple-700/15 to-transparent blur-3xl animate-pulse" />
                    <div className="absolute top-1/4 left-1/4 w-[200px] h-[200px] rounded-full bg-indigo-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
                <div className="relative z-10">
                    <RevealSection delay={0}>
                        <p className="text-xs uppercase tracking-[0.5em] text-blue-400 mb-4 font-bold">🌌 Astro Club</p>
                        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-purple-400 leading-tight mb-6">
                            We Are<br />Starborn.
                        </h1>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                            {MISSION}
                        </p>
                    </RevealSection>
                </div>
            </div>

            {/* ── LIVE STATS ── */}
            <RevealSection>
                <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/3 backdrop-blur-sm p-10">
                    <div className="relative z-10">
                        {statsLoading ? (
                            <div className="text-center text-gray-500 animate-pulse py-4">Loading orbital data...</div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {stats.map((s, i) => (
                                    <RevealSection key={s.label} delay={i * 120}>
                                        <div className="text-center group">
                                            <div className="text-3xl mb-2">{s.icon}</div>
                                            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-2">
                                                {s.value === '∞' || s.value === null ? (
                                                    s.value ?? '—'
                                                ) : (
                                                    <AnimatedNumber target={s.value} suffix={s.suffix} />
                                                )}
                                            </div>
                                            <div className="text-xs uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">{s.label}</div>
                                        </div>
                                    </RevealSection>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </RevealSection>

            {/* ── ACTIVE EVENT HIGHLIGHT ── */}
            {liveStats.activeEvents > 0 && (
                <RevealSection>
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-500/30 flex items-center gap-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shrink-0" />
                        <p className="text-green-300 font-semibold">
                            🚀 <span className="font-bold">{liveStats.activeEvents}</span> mission currently active — head to <span className="text-white underline underline-offset-2">Events & Activities</span> to register!
                        </p>
                    </div>
                </RevealSection>
            )}

            {/* ── SIX PILLARS ── */}
            <div>
                <RevealSection>
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-[0.5em] text-purple-400 mb-2">What We Do</p>
                        <h2 className="text-4xl font-bold text-white">Six Pillars of the Club</h2>
                    </div>
                </RevealSection>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {PILLARS.map((p, i) => (
                        <RevealSection key={p.title} delay={i * 80}>
                            <button
                                onClick={() => setActivePillar(activePillar === i ? null : i)}
                                className={`w-full text-left p-7 rounded-3xl border transition-all duration-300 group ${activePillar === i ? 'bg-white/10 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.05)]' : 'bg-white/3 border-white/5 hover:bg-white/7 hover:border-white/20'}`}
                            >
                                <div className="text-4xl mb-4">{p.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
                                <div className={`overflow-hidden transition-all duration-500 ${activePillar === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-gray-400 text-sm leading-relaxed pt-2">{p.desc}</p>
                                </div>
                                <div className={`mt-3 text-xs uppercase tracking-widest transition-colors ${activePillar === i ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                    {activePillar === i ? 'Collapse ↑' : 'Learn more →'}
                                </div>
                            </button>
                        </RevealSection>
                    ))}
                </div>
            </div>

            {/* ── DEPARTMENTS ── */}
            <div>
                <RevealSection>
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-[0.5em] text-cyan-400 mb-2">Structure</p>
                        <h2 className="text-4xl font-bold text-white">Our Departments</h2>
                    </div>
                </RevealSection>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {DEPARTMENTS.map((d, i) => (
                        <RevealSection key={d.name} delay={i * 80}>
                            <div className={`p-7 rounded-3xl border bg-gradient-to-br ${d.color} ${d.border} hover:scale-[1.02] transition-all duration-300`}>
                                <div className="text-4xl mb-4">{d.icon}</div>
                                <h3 className="text-lg font-bold text-white mb-2">{d.name}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{d.desc}</p>
                            </div>
                        </RevealSection>
                    ))}
                </div>
            </div>

            {/* ── TIMELINE ── */}
            <div>
                <RevealSection>
                    <div className="text-center mb-16">
                        <p className="text-xs uppercase tracking-[0.5em] text-yellow-400 mb-2">Our Story</p>
                        <h2 className="text-4xl font-bold text-white">Mission Timeline</h2>
                    </div>
                </RevealSection>
                <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/60 via-purple-500/40 to-transparent hidden md:block" />
                    <div className="space-y-12">
                        {TIMELINE.map((item, i) => (
                            <RevealSection key={item.year} delay={i * 120}>
                                <div className="flex items-start gap-8">
                                    <div className="shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-black text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] relative z-10 border-4 border-black">
                                        '{item.year.slice(2)}
                                    </div>
                                    <div className="flex-1 pt-3">
                                        <div className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1">{item.year}</div>
                                        <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                                        <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </RevealSection>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── MANIFESTO ── */}
            <RevealSection>
                <div className="relative p-12 rounded-3xl overflow-hidden border border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/10 pointer-events-none rounded-3xl" />
                    <div className="relative z-10 text-center max-w-3xl mx-auto">
                        <div className="text-5xl mb-6">🌠</div>
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6">Our Manifesto</h2>
                        <p className="text-gray-300 text-lg leading-relaxed italic">
                            "We look up not because it's easy, but because every star is a reminder that we are
                            made of the same stuff as the cosmos. The Astro Club exists so that no one has to
                            gaze at the universe alone."
                        </p>
                        <div className="mt-8 text-xs uppercase tracking-[0.5em] text-gray-500">— Astro Club Founding Charter</div>
                    </div>
                </div>
            </RevealSection>

            {/* ── JOIN CTA ── */}
            <RevealSection>
                <div className="text-center">
                    <h2 className="text-4xl font-black text-white mb-4">Ready for Liftoff?</h2>
                    <p className="text-gray-400 mb-8">Join the club, pick your rank, and become part of the mission.</p>
                    <button
                        onClick={() => onNavigate && onNavigate('register')}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-bold uppercase tracking-wider text-sm shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] hover:scale-105 transition-all duration-300 cursor-pointer"
                    >
                        🚀 Go to Registration
                    </button>
                    <p className="text-gray-600 text-xs mt-4">Or navigate to <span className="text-white">Registration</span> in the sidebar.</p>
                </div>
            </RevealSection>
        </div>
    );
};

export default AboutClub;
