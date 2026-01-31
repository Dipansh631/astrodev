import React, { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { TwinklingStars } from './components/TwinklingStars'
import { SpaceCraft } from './components/SpaceCraft'

import LoginCard from './components/LoginCard'
import SelectionMenu from './components/SelectionMenu'
import FallingTexts from './components/FallingTexts'

function App() {
    // idle, falling, blackout, welcome
    const [phase, setPhase] = useState('idle')

    const handleLogin = () => {
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
                    Welcome to the Universe
                </h1>

                <button
                    onClick={() => setPhase('selection')}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-semibold tracking-widest uppercase transition-all transform hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse"
                >
                    Continue
                </button>
            </div>

            {/* SELECTION MENU OVERLAY */}
            <div
                className={`absolute inset-0 z-40 flex items-center justify-center transition-opacity duration-1000 ${phase === 'selection' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <SelectionMenu />
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
            <div className={`absolute inset-0 z-10 flex items-center justify-start pl-20 transition-opacity duration-500 ${phase === 'idle' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div>
                    <LoginCard onLogin={handleLogin} />
                </div>
            </div>

            {/* Responsive adjustment */}
            <style>{`
        @media (max-width: 768px) {
           .flex { justify-content: center; padding-left: 0; }
        }
      `}</style>
        </div>
    )
}

export default App
