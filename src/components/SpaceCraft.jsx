import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export function SpaceCraft({ onComplete }) {
    const group = useRef()
    const { scene } = useGLTF('/assets/spacecraft.glb')
    const { camera } = useThree()

    // Animation logic
    useFrame((state, delta) => {
        if (group.current) {
            // "Fall" or fly forward rapidly
            // We move it along negative Z (further into space)
            group.current.position.z -= delta * 25 // Increased speed for thrill

            // Add dynamic rotation (tumble)
            group.current.rotation.z += delta * 0.5
            group.current.rotation.x += delta * 0.2

            // CAMERA FOLLOW LOGIC
            // We maintain a fixed distance behind and slightly above the ship
            const targetCameraZ = group.current.position.z + 8 // 8 units behind
            const targetCameraY = group.current.position.y + 2 // 2 units above

            // Smoothly interpolate camera position for a "chase cam" feel
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCameraZ, 0.1)
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCameraY, 0.1)
            // Keep X aligned
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, group.current.position.x, 0.1)

            // Ensure camera looks slightly ahead of the ship
            camera.lookAt(
                group.current.position.x,
                group.current.position.y,
                group.current.position.z - 10 // Look ahead
            )
        }
    })

    return (
        <group ref={group} position={[0, 0, 10]} dispose={null}>
            {/* Starting closer to camera */}
            <primitive object={scene} scale={0.5} />
        </group>
    )
}

useGLTF.preload('/assets/spacecraft.glb')
