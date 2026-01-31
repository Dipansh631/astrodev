import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A single Spiral Galaxy component
function SpiralGalaxy({ position, rotation, scale, color }) {
    const count = 500 // Points per galaxy

    const [positions, colors] = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const colors = new Float32Array(count * 3)

        // Galaxy parameters
        const arms = 2
        const armWidth = 0.5

        const baseColor = new THREE.Color(color)
        const centerColor = new THREE.Color('#fff4e6') // Bright center

        for (let i = 0; i < count; i++) {
            // Radius (distance from center)
            // Distribution causing more stars near center
            const r = Math.pow(Math.random(), 3) * 5

            // Spiral angle formula
            const spinAngle = r * 5

            // Arm offset
            const branchAngle = (Math.floor(Math.random() * arms) * 2 * Math.PI) / arms

            const randomX = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1) * armWidth * (3 - r / 2)
            const randomY = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1) * armWidth * (3 - r / 2)
            const randomZ = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1) * armWidth * (3 - r / 2)

            positions[i * 3] = Math.cos(spinAngle + branchAngle) * r + randomX
            positions[i * 3 + 1] = (Math.random() - 0.5) * (r / 5) // Flattened
            positions[i * 3 + 2] = Math.sin(spinAngle + branchAngle) * r + randomZ

            // Color mix
            const mixedColor = baseColor.clone().lerp(centerColor, 1 / (r + 0.1))

            colors[i * 3] = mixedColor.r
            colors[i * 3 + 1] = mixedColor.g
            colors[i * 3 + 2] = mixedColor.b
        }
        return [positions, colors]
    }, [color])

    const mesh = useRef()

    useFrame((state, delta) => {
        // Rotate the galaxy locally
        mesh.current.rotation.y += delta * 0.1
    })

    return (
        <points ref={mesh} position={position} rotation={rotation} scale={scale}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                size={0.1}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}

export function DistantGalaxies() {
    // Generate a few random galaxies in the background
    const galaxies = useMemo(() => {
        const items = []
        const count = 8
        const colors = ['#ff88cc', '#88ccff', '#ccff88', '#ffcc88']

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 60
            const y = (Math.random() - 0.5) * 40
            const z = -20 - Math.random() * 30 // Push them back

            const scale = 0.5 + Math.random() * 0.5
            const color = colors[Math.floor(Math.random() * colors.length)]

            // Random rotation tilt
            const rotX = Math.random() * Math.PI
            const rotZ = Math.random() * Math.PI

            items.push({ position: [x, y, z], rotation: [rotX, 0, rotZ], scale, color })
        }
        return items
    }, [])

    return (
        <group>
            {galaxies.map((props, i) => (
                <SpiralGalaxy key={i} {...props} />
            ))}
        </group>
    )
}
