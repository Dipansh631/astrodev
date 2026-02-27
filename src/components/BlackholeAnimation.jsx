import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { EffectComposer, Glitch, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

function BlackholeScene({ onComplete }) {
    const { scene } = useGLTF('/assets/blackhole.glb');
    const groupRef = useRef();
    const [glitching, setGlitching] = useState(false);
    const completedRef = useRef(false);

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;

        // 5 seconds total animation
        if (t >= 5 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
            return;
        }

        if (groupRef.current) {
            // General rotation
            groupRef.current.rotation.y += delta * 1.5;
            groupRef.current.rotation.z += delta * 0.5;

            if (t > 2) {
                // 3 seconds of glitch like shrinking etc (from 2s to 5s)
                if (!glitching) setGlitching(true);

                const progress = (t - 2) / 3; // goes from 0 to 1

                // Shrinking effect
                const shrinkScale = Math.max(0.01, 1 - progress);
                groupRef.current.scale.set(shrinkScale, shrinkScale, shrinkScale);

                // Jerky rotation
                groupRef.current.rotation.x += (Math.random() - 0.5) * 0.5;
                groupRef.current.rotation.y += (Math.random() - 0.5) * 0.5;

                // Violent shaking
                groupRef.current.position.x = (Math.random() - 0.5) * progress * 2;
                groupRef.current.position.y = (Math.random() - 0.5) * progress * 2;

                // Move camera closer very fast
                state.camera.position.z = THREE.MathUtils.lerp(6, 1, progress);
            } else {
                // First 2 seconds: diving in
                // Move from z=15 (far) to z=6 (close)
                state.camera.position.z = THREE.MathUtils.lerp(15, 6, t / 2);
                state.camera.lookAt(0, 0, 0);

                // Base scale
                groupRef.current.scale.set(1, 1, 1);
                groupRef.current.position.set(0, 0, 0);
            }
        }
    });

    return (
        <>
            <ambientLight intensity={2} />
            <directionalLight position={[10, 10, 10]} intensity={3} />
            <group ref={groupRef}>
                <primitive object={scene} />
            </group>

            <EffectComposer>
                {glitching && (
                    <Glitch
                        delay={[0, 0]}
                        duration={[0.1, 0.3]}
                        strength={[0.2, 0.4]}
                        active={true}
                    />
                )}
                {glitching && <Noise opacity={0.5} />}
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
        </>
    );
}

// Preload the glb to avoid stuttering when it shows up
useGLTF.preload('/assets/blackhole.glb');

export default function BlackholeAnimation({ onComplete }) {
    // We add a timer fallback just in case the model fails to load or render
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 5500); // 5.5s fallback
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
            {/* Overlay Text */}
            <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full px-4">
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-500 to-indigo-600 animate-pulse tracking-widest uppercase mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
                    Diving to the Blackhole
                </h1>
                <p className="text-blue-300 text-sm tracking-[0.3em] uppercase opacity-70">
                    Entering event horizon...
                </p>
            </div>

            <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
                <Suspense fallback={null}>
                    <BlackholeScene onComplete={onComplete} />
                </Suspense>
            </Canvas>
        </div>
    );
}
