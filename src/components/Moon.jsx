import React, { useRef } from 'react'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Moon(props) {
    const mesh = useRef()

    // switched to reliable KJPG textures because TIF is not supported in browsers
    const [moonTexture, moonDisplacement] = useTexture([
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg'
    ])

    useFrame((state, delta) => {
        // Slow rotation
        mesh.current.rotation.y += delta * 0.05
    })

    return (
        <mesh ref={mesh} {...props}>
            {/* Size maintained at 10% (0.2 radius) as requested */}
            <sphereGeometry args={[0.2, 64, 64]} />
            <meshStandardMaterial
                map={moonTexture}
                displacementMap={moonDisplacement}
                displacementScale={0.01} // Reduced displacement for smaller scale
                color="#ffffff"
                emissive="#eeeeee"
                emissiveIntensity={0.2}
                roughness={0.8}
            />
        </mesh>
    )
}
