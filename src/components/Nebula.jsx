import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Cloud } from '@react-three/drei'
import * as THREE from 'three'

export function Nebula() {
    const group = useRef()

    useFrame((state, delta) => {
        // Slowly rotate the entire nebula system
        group.current.rotation.y -= delta * 0.02
        group.current.rotation.z += delta * 0.005
    })

    return (
        <group ref={group} rotation={[0, 0, Math.PI / 4]}>
            {/* Pink/Purple Nebula Cloud */}
            <Cloud
                opacity={0.3}
                speed={0.2} // Animation speed
                width={20} // Width of the cloud area
                depth={5} // Z-depth
                segments={20} // Number of particles
                color="#ff1493" // Deep Pink
                position={[-10, 2, -15]}
                bounds={[10, 4, 10]}
            />

            {/* Blue/Cyan Nebula Cloud */}
            <Cloud
                opacity={0.3}
                speed={0.2}
                width={25}
                depth={3}
                segments={20}
                color="#00ced1" // Dark Turquoise
                position={[12, -4, -18]}
                bounds={[10, 4, 10]}
            />

            {/* Deep Violet Nebula Cloud */}
            <Cloud
                opacity={0.4}
                speed={0.15}
                width={30}
                depth={5}
                segments={30}
                color="#4b0082" // Indigo
                position={[0, 10, -25]}
                bounds={[14, 6, 14]}
            />
        </group>
    )
}
