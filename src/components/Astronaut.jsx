import React, { useRef, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Astronaut(props) {
    const group = useRef()
    const { scene, animations } = useGLTF('/assets/astronaut.glb')
    const { actions } = useAnimations(animations, group)

    // Floating animation
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        group.current.position.y = Math.sin(t / 1.5) * 0.1 // Gentle float up and down
        group.current.rotation.y = Math.sin(t / 4) * 0.2 // Gentle rotation
    })

    // Try to play animation if it exists, but maybe blended? 
    // For now let's stick to the static pose + floating user requested.
    // If the user wanted the walking animation, we could uncomment:
    // useEffect(() => {
    //   if (actions && actions[Object.keys(actions)[0]]) {
    //      actions[Object.keys(actions)[0]].play()
    //   }
    // }, [actions])

    return (
        <group ref={group} {...props} dispose={null}>
            <primitive object={scene} />
        </group>
    )
}

useGLTF.preload('/assets/astronaut.glb')
