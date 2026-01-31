import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Custom shader for infinite recycling stars
const StarShaderMaterial = {
    uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0 }, // User controlled speed (zoom)
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 300.0 }, // Increased size
    },
    vertexShader: `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uSize;
    uniform float uPixelRatio;
    uniform float uDensity; // 0.0 to 1.0
    
    attribute float aScale;
    attribute vec3 aColor;
    attribute float aOffset;
    attribute float aRandomId; // For stable random hiding
    
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
      // Density check - if this star's random ID is greater than density, hide it (move outside clip space)
      if (aRandomId > uDensity) {
          gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // Outside clip space
          return;
      }

      vec3 pos = position;
      
      // INFINITE Z-SCROLLING LOGIC
      // The box is 1000 units deep. 
      // We move pos.z based on speed.
      // Modulo keeps it inside the box [-500, 500]
      
      float depth = 1000.0;
      float zOffset = uSpeed; // Accumulated distance
      
      // Move z towards camera (positive z)
      pos.z = mod(position.z + zOffset, depth) - (depth / 2.0);
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = uSize * aScale * uPixelRatio / (-mvPosition.z);
      
      // Fade out particles that are too close or too far to prevent popping
      float distanceToCamera = -mvPosition.z;
      float alpha = smoothstep(0.0, 50.0, distanceToCamera) * (1.0 - smoothstep(400.0, 500.0, distanceToCamera));

      vColor = aColor;
      vAlpha = alpha * (0.6 + 0.4 * sin(uTime * 3.0 + aOffset)); // Twinkle
    }
  `,
    fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
      // Circular particle
      vec2 coord = gl_PointCoord - vec2(0.5);
      if (length(coord) > 0.5) discard;
      
      // Soft edge glow
      float strength = 1.0 - (length(coord) * 2.0);
      strength = pow(strength, 2.0);
      
      gl_FragColor = vec4(vColor, vAlpha * strength);
    }
  `
}

export function TwinklingStars({ count = 100000, phase = 'idle' }) {
    const mesh = useRef()
    const shaderRef = useRef()
    // Travel distance accumulator
    const travelDist = useRef(0)
    // Target speed mapping
    const targetSpeed = useRef(10)
    const currentSpeed = useRef(10)

    const { camera } = useThree()

    // Manage density animation
    // density 1.0 = all stars visible
    // density 0.0 = no stars visible
    const density = useRef(1.0)

    useEffect(() => {
        const handleWheel = (e) => {
            if (phase !== 'welcome') return // Only zoom in welcome
            const sensitivity = 5.0
            targetSpeed.current -= e.deltaY * sensitivity
        }
        window.addEventListener('wheel', handleWheel)
        return () => window.removeEventListener('wheel', handleWheel)
    }, [phase])

    const [positions, scales, colors, offsets, randomIds] = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const scales = new Float32Array(count)
        const colors = new Float32Array(count * 3)
        const offsets = new Float32Array(count)
        const randomIds = new Float32Array(count) // For stable filtering

        const colorPalette = [
            new THREE.Color('#ffffff'),
            new THREE.Color('#a0c4ff'),
            new THREE.Color('#ffc6c6'),
            new THREE.Color('#fffdc4'),
            new THREE.Color('#b5e5cf'),
        ]

        // Pre-calculate colors to avoid object creation in loop
        const paletteColors = colorPalette.map(c => [c.r, c.g, c.b]);

        for (let i = 0; i < count; i++) {
            // Box distribution for infinite tiling field
            // x, y spread wide, z spread deep
            positions[i * 3] = (Math.random() - 0.5) * 800
            positions[i * 3 + 1] = (Math.random() - 0.5) * 600
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1000

            // Natural size distribution
            const rVal = Math.random()

            let colorIndex = 0;
            if (rVal > 0.99) { // 1% Super Bright Giants
                scales[i] = 5.0 + Math.random() * 3.0
                colorIndex = Math.floor(Math.random() * 2)
            } else if (rVal > 0.95) { // 4% Bright Stars
                scales[i] = 3.0 + Math.random() * 2.0
                colorIndex = Math.random() > 0.3 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 5)
            } else if (rVal > 0.80) { // 15% Medium Stars
                scales[i] = 1.5 + Math.random() * 1.5
                colorIndex = Math.floor(Math.random() * 5)
            } else { // 80% Small/Distant background stars
                scales[i] = 0.3 + Math.random() * 0.8
                colorIndex = Math.floor(Math.random() * 5)
            }

            const multiplier = rVal > 0.8 ? 1.0 : (rVal > 0.95 ? 1.0 : 0.7);
            const [r, g, b] = paletteColors[colorIndex];

            colors[i * 3] = r * multiplier
            colors[i * 3 + 1] = g * multiplier
            colors[i * 3 + 2] = b * multiplier

            offsets[i] = Math.random() * 100
            randomIds[i] = Math.random() // Unique ID 0-1 for density filtering
        }

        return [positions, scales, colors, offsets, randomIds]
    }, [count])

    useFrame((state, delta) => {
        // --- SPEED LOGIC ---
        // Smooth speed damping (inertia effect)
        // Always return slowly to a base cruising speed of 20
        targetSpeed.current = THREE.MathUtils.lerp(targetSpeed.current, 20, delta * 2)
        currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, targetSpeed.current, delta * 5)

        // Accumulate distance
        travelDist.current += currentSpeed.current * delta

        // --- DENSITY LOGIC ---
        // If falling, reduce density over 30 seconds
        if (phase === 'falling') {
            // We want density to go from 1.0 -> 0.0 over 30 seconds
            // rate per second = 1/30
            density.current = Math.max(0, density.current - (delta / 30.0))
        } else if (phase === 'welcome') {
            // Reset instantly
            density.current = 1.0
        } else if (phase === 'idle') {
            density.current = 1.0
        }

        if (shaderRef.current) {
            shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime
            shaderRef.current.uniforms.uSpeed.value = travelDist.current
            shaderRef.current.uniforms.uDensity.value = density.current
        }
    })

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                ...THREE.UniformsUtils.clone(StarShaderMaterial.uniforms),
                uDensity: { value: 1.0 }
            },
            vertexShader: StarShaderMaterial.vertexShader,
            fragmentShader: StarShaderMaterial.fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    }, [])

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-aScale" count={count} array={scales} itemSize={1} />
                <bufferAttribute attach="attributes-aColor" count={count} array={colors} itemSize={3} />
                <bufferAttribute attach="attributes-aOffset" count={count} array={offsets} itemSize={1} />
                <bufferAttribute attach="attributes-aRandomId" count={count} array={randomIds} itemSize={1} />
            </bufferGeometry>
            <primitive object={material} ref={shaderRef} attach="material" />
        </points>
    )
}
