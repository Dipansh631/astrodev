import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

export function SpaceModel(props) {
    const group = useRef()
    // Load the new model
    const { scene } = useGLTF('/assets/space_model.glb')

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        // Add a gentle floating/rotation animation
        group.current.rotation.y = t * 0.1
        group.current.position.y = Math.sin(t / 2) * 0.1
    })

    return (
        <group ref={group} {...props} dispose={null}>
            <primitive object={scene} />
        </group>
    )
}

useGLTF.preload('/assets/space_model.glb')
