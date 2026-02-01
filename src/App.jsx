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
    const [phase, setPhase] = useState('idle')
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const sequenceStarted = useRef(false)

    useEffect(() => {
        const startSequence = (userData) => {
            if (sequenceStarted.current) return
            sequenceStarted.current = true

            console.log("Starting sequence for user:", userData?.email)
            setUser(userData)
            handleLogin(userData)
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
                sequenceStarted.current = false
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogin = (userData) => {
        if (userData) setUser(userData)
        setPhase('falling')

        // Schedule blackout after 30 seconds
        setTimeout(() => {
            setPhase('blackout')

            // Schedule welcome screen after 2 seconds of black
            setTimeout(() => {
                setPhase('welcome')
            }, 2000)
        }, 30000)
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
                    onClick={() => setPhase('dashboard')}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-semibold tracking-widest uppercase transition-all transform hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse"
                >
                    Continue
                </button>
            </div>

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
                    <LoginCard onLogin={() => handleLogin()} />
                </div>
            </div>


        </div>
    )
}

export default App
