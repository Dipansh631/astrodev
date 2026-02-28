import React, { useState, Suspense, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Center } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Glitch, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

function BlackholeScene({ phase }) {
    const { scene } = useGLTF('/assets/blackhole.glb');
    const groupRef = useRef();
    const initialTime = useRef(null);

    useFrame((state, delta) => {
        if (!initialTime.current) initialTime.current = state.clock.elapsedTime;
        const t = state.clock.elapsedTime - initialTime.current;

        if (!groupRef.current) return;

        // Find the main container holding all the blackhole parts
        const rootNode = groupRef.current.getObjectByName('RootNode');
        if (rootNode) {
            rootNode.children.forEach(child => {
                const name = child.name.toLowerCase();
                // If it's the ring or the surrounding skins, spin it on its local Z axis.
                if (!name.includes('core')) {
                    child.rotation.z += delta * 0.4;
                }
            });
        }

        if (phase === 'diving') {
            // Dive from Z=3 into Z=-0.5 smoothly over 5 seconds
            const progress = Math.min(t / 5, 1);
            // Accelerating fall effect (easeInQuint-like)
            const ease = progress * progress * progress * progress;
            state.camera.position.z = THREE.MathUtils.lerp(3, -0.5, ease);
            state.camera.lookAt(0, 0, -2);

            groupRef.current.position.set(0, 0, 0);
        } else if (phase === 'glitch') {
            // Violent offset shaking inside the blackhole
            groupRef.current.position.x = (Math.random() - 0.5) * 0.8;
            groupRef.current.position.y = (Math.random() - 0.5) * 0.8;
            groupRef.current.position.z = (Math.random() - 0.5) * 0.8;
            state.camera.position.z = Math.random() * 2;
        }
    });

    return (
        // Tilt the model on the X axis by about 75 degrees (1.3 radians) to match the angled disk view in the screenshot
        <group ref={groupRef} scale={1} rotation={[1.3, 0, 0]}>
            {/* Deep space ambient light */}
            <ambientLight intensity={0.1} color="#ffffff" />

            {/* Primary sun-like directional light hitting the disk strongly */}
            <directionalLight position={[10, 20, 10]} intensity={4} color="#ffeedd" />

            {/* Opposite directional light for rim lighting */}
            <directionalLight position={[-10, -10, -10]} intensity={1} color="#ffaa55" />

            {/* Point light in the center to illuminate the inner rim of the accretion disk */}
            <pointLight position={[0, 0, 0]} intensity={2} color="#ffb066" distance={15} />

            {/* The <Center> tag automatically calculates the model's bounding box and sets its pivot to the exact center */}
            <Center>
                <primitive object={scene} />
            </Center>
        </group>
    );
}

useGLTF.preload('/assets/blackhole.glb');

/* ──────────────────────────────────────────────────────
   Post-reveal glitch overlay — transparent CSS layers
   composited on top of real page with mix-blend-mode
────────────────────────────────────────────────────── */
function ContentGlitchOverlay({ onDone }) {
    useEffect(() => {
        const t = setTimeout(() => { if (onDone) onDone(); }, 2000);
        return () => clearTimeout(t);
    }, [onDone]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            pointerEvents: 'none', overflow: 'hidden',
        }}>
            {/* Red channel — shifts right */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,0,60,0.18)',
                mixBlendMode: 'screen',
                animation: 'glitchR 0.12s steps(1) infinite',
            }} />
            {/* Cyan channel — shifts left */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,255,220,0.18)',
                mixBlendMode: 'screen',
                animation: 'glitchC 0.09s steps(1) infinite',
            }} />
            {/* Scanlines */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.55) 3px, rgba(0,0,0,0.55) 4px)',
                animation: 'scanFade 2s ease-out forwards',
            }} />
            {/* Horizontal glitch bars */}
            <div style={{
                position: 'absolute', inset: 0,
                animation: 'barsFade 2s ease-out forwards',
                backgroundImage: [
                    'linear-gradient(rgba(0,255,255,0.55) 0px, rgba(0,255,255,0.55) 2px, transparent 2px)',
                    'linear-gradient(rgba(255,0,80,0.55) 0px, rgba(255,0,80,0.55) 2px, transparent 2px)',
                    'linear-gradient(rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1px, transparent 1px)',
                ].join(', '),
                backgroundSize: '100% 80px, 100% 140px, 100% 50px',
                backgroundRepeat: 'repeat-y',
                mixBlendMode: 'screen',
            }} />
            {/* Overall opacity fade-out wrapper */}
            <div style={{
                position: 'absolute', inset: 0,
                animation: 'overlayFadeOut 2s ease-in-out forwards',
                background: 'transparent',
            }} />

            <style>{`
                @keyframes glitchR {
                    0%   { transform: translate(6px,  -2px); opacity: 0.8; }
                    25%  { transform: translate(-4px, 3px);  opacity: 0.6; }
                    50%  { transform: translate(8px,  1px);  opacity: 0.9; }
                    75%  { transform: translate(-2px, -4px); opacity: 0.5; }
                    100% { transform: translate(4px,  2px);  opacity: 0.7; }
                }
                @keyframes glitchC {
                    0%   { transform: translate(-6px, 2px);  opacity: 0.8; }
                    33%  { transform: translate(4px, -3px);  opacity: 0.6; }
                    66%  { transform: translate(-8px, 1px);  opacity: 0.9; }
                    100% { transform: translate(3px,  3px);  opacity: 0.5; }
                }
                @keyframes scanFade {
                    0%   { opacity: 0.9; }
                    60%  { opacity: 0.6; }
                    100% { opacity: 0;   }
                }
                @keyframes barsFade {
                    0%   { opacity: 1;   background-position: 0 0px,    0 20px,  0 65px;  }
                    20%  { opacity: 0.9; background-position: 0 30px,   0 80px,  0 10px;  }
                    40%  { opacity: 0.8; background-position: 0 -10px,  0 50px,  0 90px;  }
                    60%  { opacity: 0.6; background-position: 0 60px,   0 -20px, 0 40px;  }
                    80%  { opacity: 0.4; background-position: 0 -30px,  0 70px,  0 -50px; }
                    100% { opacity: 0;   background-position: 0 0px,    0 0px,   0 0px;   }
                }
                @keyframes overlayFadeOut {
                    0%   { box-shadow: inset 0 0 80px rgba(0,200,255,0.3); }
                    50%  { box-shadow: inset 0 0 40px rgba(255,0,80,0.2); }
                    100% { box-shadow: none; }
                }
            `}</style>
        </div>
    );
}

export default function BlackholeAnimation({ onComplete }) {
    const [phase, setPhase] = useState('diving');
    // contentGlitch shows a glitch overlay ON TOP of the real content after reveal
    const [contentGlitch, setContentGlitch] = useState(false);

    // Full sequence:
    // 0-5s:   diving into blackhole
    // 5-10s:  glitch chaos
    // 10-13s: blinding white flash
    // 13-15s: pure black (before reveal)
    // 15s:    REVEAL real content
    // 17s:    start 2s post-reveal content glitch
    // 19s:    all done, glitch fades fully
    useEffect(() => {
        const t1 = setTimeout(() => setPhase('glitch'), 5000);
        const t2 = setTimeout(() => setPhase('blackout'), 10000); // black BEFORE flash
        const t3 = setTimeout(() => setPhase('flash'), 13000); // flash AFTER black
        const t4 = setTimeout(() => { if (onComplete) onComplete(); }, 15000); // REVEAL
        const t5 = setTimeout(() => setContentGlitch(true), 17000); // 2s after reveal
        const t6 = setTimeout(() => setContentGlitch(false), 19000); // ends at 19s
        return () => {
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
            clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
        };
    }, [onComplete]);

    // The canvas and its effects only render during active phases
    const showCanvas = phase === 'diving' || phase === 'glitch';

    // createPortal forces this to render directly in document.body, escaping any parent CSS transforms
    return createPortal(
        <>
            {/* === 3D Canvas Phase (Diving + Glitch) === */}
            {showCanvas && (
                <div className="fixed inset-0 z-[9999] bg-black w-full h-[100dvh] overflow-hidden flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-full h-full absolute inset-0">
                        <Canvas
                            camera={{ position: [0, 0, 3], fov: 60 }}
                            onCreated={({ gl }) => {
                                // Suppress harmless ANGLE/GLSL precision warnings on Windows
                                gl.debug = { checkShaderErrors: false };
                            }}
                        >
                            <Suspense fallback={null}>
                                <BlackholeScene phase={phase} />
                                <EffectComposer disableNormalPass>
                                    <Bloom luminanceThreshold={0.1} mipmapBlur luminanceSmoothing={0.5} intensity={1.5} />
                                    {phase === 'glitch' && (
                                        <Glitch delay={[0, 0]} duration={[0.1, 0.4]} strength={[0.5, 1.0]} active={true} />
                                    )}
                                    {phase === 'glitch' && <Noise opacity={0.6} />}
                                    <Vignette eskil={false} offset={0.1} darkness={phase === 'glitch' ? 1.6 : 1.3} />
                                </EffectComposer>
                            </Suspense>
                        </Canvas>

                        {/* CONNECTION LOST text during glitch */}
                        {phase === 'glitch' && (
                            <div className="absolute z-30 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full px-4 mix-blend-screen">
                                <h1 className="text-5xl md:text-7xl font-black text-red-500 animate-[shake_0.5s_infinite] tracking-widest uppercase drop-shadow-[4px_4px_0_rgba(0,255,255,1)]">
                                    CONNECTION LOST
                                </h1>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === Blinding White Flash (3 seconds) === */}
            {phase === 'flash' && (
                <div
                    className="fixed inset-0 z-[9999] pointer-events-none"
                    style={{
                        background: 'white',
                        animation: 'flashFade 3s ease-out forwards',
                    }}
                />
            )}

            {/* === Pure Black Transition (2 seconds) === */}
            {phase === 'blackout' && (
                <div className="fixed inset-0 z-[9999] bg-black pointer-events-none" />
            )}

            {/* === Canvas-based glitch reveal on top of real content === */}
            {contentGlitch && (
                <ContentGlitchOverlay onDone={() => setContentGlitch(false)} />
            )}

            <style>{`
                @keyframes shake {
                    0%   { transform: translate(1px, 1px) rotate(0deg); }
                    10%  { transform: translate(-1px, -2px) rotate(-1deg); }
                    20%  { transform: translate(-3px, 0px) rotate(1deg); }
                    30%  { transform: translate(3px, 2px) rotate(0deg); }
                    40%  { transform: translate(1px, -1px) rotate(1deg); }
                    50%  { transform: translate(-1px, 2px) rotate(-1deg); }
                    60%  { transform: translate(-3px, 1px) rotate(0deg); }
                    70%  { transform: translate(3px, 1px) rotate(-1deg); }
                    80%  { transform: translate(-1px, -1px) rotate(1deg); }
                    90%  { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                @keyframes flashFade {
                    0%   { opacity: 1; }
                    100% { opacity: 0; }
                }
                @keyframes contentGlitchFade {
                    0%   { opacity: 1; }
                    70%  { opacity: 0.8; }
                    100% { opacity: 0; }
                }
            `}</style>
        </>,
        document.body
    );
}
