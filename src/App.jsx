import React, { Suspense, useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { TwinklingStars } from './components/TwinklingStars'
import { SpaceCraft } from './components/SpaceCraft'

import LoginCard from './components/LoginCard'
import Dashboard from './components/Dashboard'
import FallingTexts from './components/FallingTexts'

import { supabase } from './lib/supabaseClient'

function App() {
    // idle, falling, blackout, welcome, dashboard
    const [phase, setPhase] = useState(() => {
        // Initialize phase from session storage if available, else 'idle'
        return sessionStorage.getItem('appPhase') === 'dashboard' ? 'dashboard' : 'idle'
    })
    const [user, setUser] = useState(null)
    const [isReturningUser, setIsReturningUser] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const sequenceStarted = useRef(false)
    const fallingTimeout = useRef(null)
    const blackoutTimeout = useRef(null)
    const [activeEvent, setActiveEvent] = useState(null)
    const [showEventPopup, setShowEventPopup] = useState(false)

    useEffect(() => {
        const fetchActiveEvent = async () => {
            const { data } = await supabase.from('events').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle()
            if (data) {
                setActiveEvent(data)
                setShowEventPopup(true)
            }
        }
        fetchActiveEvent()
    }, [])

    useEffect(() => {
        const startSequence = async (userData) => {
            if (sequenceStarted.current) return
            sequenceStarted.current = true

            console.log("Starting sequence for user:", userData?.email)
            setUser(userData)

            // Check if user is returning (has a profile)
            try {
                const { data } = await supabase.from('profiles').select('id').eq('id', userData.id).maybeSingle()
                if (data) {
                    console.log("Returning user detected.")
                    setIsReturningUser(true)
                }
            } catch (err) {
                console.error("Error checking user status:", err)
            }

            // Check if we should skip animation (e.g. on refresh)
            const savedPhase = sessionStorage.getItem('appPhase')
            if (savedPhase === 'dashboard') {
                setPhase('dashboard')
            } else {
                handleLogin(userData)
            }
        }

        // Check active session and listen for auth changes
        const checkSession = async () => {
            try {
                // If there is a hash in the URL, we wait for onAuthStateChange to handle the token parsing
                const hasAuthHash = window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token'));

                if (hasAuthHash) {
                    console.log("Auth hash detected, waiting for Supabase to parse...");
                    // Set a cleanup timeout just in case it hangs
                    setTimeout(() => setIsLoading(false), 5000);
                    return;
                }

                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    startSequence(session.user)
                }
            } catch (error) {
                console.error("Error checking session:", error)
            } finally {
                // Only turn off loading if we aren't waiting for a hash parse
                if (!window.location.hash || (!window.location.hash.includes('access_token') && !window.location.hash.includes('refresh_token'))) {
                    setIsLoading(false)
                }
            }
        }

        checkSession()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth Event:", event)
            // Trigger sequence for any valid session event if we haven't started yet
            if (session) {
                startSequence(session.user)
                setIsLoading(false)
            } else if (event === 'SIGNED_OUT') {
                setIsLoading(false)
                setUser(null)
                // Reset phase to idle to show login screen again
                setPhase('idle')
                sessionStorage.removeItem('appPhase') // Clear session on sign out
                sequenceStarted.current = false
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogin = (userData) => {
        if (userData) setUser(userData)
        setPhase('falling')

        // Clear existing timeouts
        if (fallingTimeout.current) clearTimeout(fallingTimeout.current)
        if (blackoutTimeout.current) clearTimeout(blackoutTimeout.current)

        // Schedule blackout after 30 seconds
        fallingTimeout.current = setTimeout(() => {
            setPhase('blackout')

            // Schedule welcome screen after 2 seconds of black
            blackoutTimeout.current = setTimeout(() => {
                setPhase('welcome')
            }, 2000)
        }, 30000)
    }

    // Update session storage when entering dashboard
    const enterDashboard = () => {
        setPhase('dashboard')
        sessionStorage.setItem('appPhase', 'dashboard')
    }

    return (
        <div className="relative w-full h-screen bg-[#050505] overflow-hidden">

            {/* BLACKOUT SCREEN */}
            <div
                className={`absolute inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-[2000ms] ${phase === 'blackout' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
            </div>

            {/* WELCOME SCREEN OVERLAY */}
            <div
                className={`absolute inset-0 z-40 flex flex-col items-center justify-center transition-opacity duration-1000 ${phase === 'welcome' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] text-center mb-12">
                    {user?.email === 'dipanshumaheshwari73698@gmail.com' ? (
                        <>
                            Welcome Dipanshu The Creator <span className="text-yellow-400 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">👑</span>
                        </>
                    ) : (
                        `Welcome${user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ' into the Universe'}`
                    )}
                </h1>

                <button
                    onClick={enterDashboard}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-semibold tracking-widest uppercase transition-all transform hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse"
                >
                    Continue
                </button>
            </div>

            {/* ACTIVE EVENT POPUP */}
            {phase === 'welcome' && showEventPopup && activeEvent && (
                <div className="absolute inset-0 z-[45] flex items-end justify-center pb-20 pointer-events-none">
                    <div className="bg-black/90 border border-purple-500/50 p-6 rounded-2xl max-w-sm w-full mx-4 shadow-[0_0_30px_rgba(168,85,247,0.4)] pointer-events-auto animate-fade-in-up relative mb-20">
                        <button
                            onClick={() => setShowEventPopup(false)}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-white text-black rounded-full font-bold flex items-center justify-center hover:bg-gray-200"
                        >
                            ✕
                        </button>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-green-400 uppercase tracking-widest font-bold">Live Transmission</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{activeEvent.title}</h3>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">{activeEvent.description}</p>
                        <div className="flex gap-3">
                            {activeEvent.registration_link && activeEvent.is_registration_open ? (
                                <a
                                    href={activeEvent.registration_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-center rounded text-sm font-bold uppercase tracking-wider"
                                >
                                    Register Now
                                </a>
                            ) : (
                                <button disabled className="flex-1 py-2 bg-gray-700 text-gray-400 text-center rounded text-sm font-bold uppercase tracking-wider cursor-not-allowed">
                                    Registration Closed
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SKIP BUTTON */}
            {phase === 'falling' && isReturningUser && (
                <button
                    onClick={() => {
                        if (fallingTimeout.current) clearTimeout(fallingTimeout.current)
                        if (blackoutTimeout.current) clearTimeout(blackoutTimeout.current)
                        setPhase('welcome')
                    }}
                    className="absolute bottom-10 right-10 z-[60] px-6 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/70 hover:text-white font-light tracking-widest uppercase text-sm transition-all hover:border-white/40"
                >
                    Skip Animation »
                </button>
            )}

            {/* DASHBOARD OVERLAY */}
            <div
                className={`absolute inset-0 z-40 flex items-center justify-center transition-opacity duration-1000 ${phase === 'dashboard' ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'}`}
            >
                {/* We only render Dashboard content if active properly, or keep it in DOM but hidden */}
                <Dashboard user={user} />
            </div>

            {/* 3D Scene Background */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${phase === 'blackout' ? 'opacity-0' : 'opacity-100'}`}>
                <Canvas camera={{ position: [0, 0, 10], fov: 40 }}>
                    <ambientLight intensity={0.1} />
                    <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
                    <spotLight position={[-10, 5, -10]} intensity={1} color="#4f90ff" />


                    {/* Show stars in idle, falling AND welcome phase */}
                    <TwinklingStars count={100000} phase={phase} />

                    <Suspense fallback={null}>
                        {/* Only show spacecraft during 'falling' phase */}
                        {phase === 'falling' && (
                            <>
                                <SpaceCraft />
                            </>
                        )}
                        <Environment preset="night" />
                    </Suspense>

                    {phase !== 'falling' && (
                        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.2} />
                    )}
                </Canvas>
            </div>

            {/* Falling Phase Texts */}
            {phase === 'falling' && <FallingTexts />}

            {/* Login Interface - Only visible in idle */}
            <div className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-500 ${!isLoading && phase === 'idle' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div>
                    <LoginCard />
                </div>
            </div>


        </div>
    )
}

export default App
