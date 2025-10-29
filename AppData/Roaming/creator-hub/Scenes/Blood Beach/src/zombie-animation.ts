// zombie-animation.ts
// Zombie Hand 3 animation system - sink into sand and rise back up
// Creates "rising from the dead" effect

import {
  engine,
  Transform,
  GltfContainer,
  Schemas,
  Entity
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

export type ZombieAnimationOptions = {
  // Animation timing
  sinkDuration?: number    // Time to sink into sand
  pauseDuration?: number   // Time to pause beneath sand
  riseDuration?: number    // Time to rise back up
  cycleDelay?: number      // Delay between cycles
  // Animation parameters
  sinkDepth?: number       // How deep to sink (in meters)
  sandLevel?: number       // Y level of sand surface
  // Variation
  randomPhase?: boolean    // Randomize start phases
  maxVariation?: number    // Maximum phase variation in seconds
}

// Component to track zombie animation
const ZombieAnimation = engine.defineComponent('zombie-animation', {
  originalY: Schemas.Float,
  sinkDepth: Schemas.Float,
  sandLevel: Schemas.Float,
  animationSpeed: Schemas.Float,
  phaseStartTime: Schemas.Float,
  isAnimating: Schemas.Boolean
})

let initialized = false
let globalTime = 0

export function setupZombieAnimation(opts: ZombieAnimationOptions = {}) {
  const sinkDuration = opts.sinkDuration ?? 3.0
  const pauseDuration = opts.pauseDuration ?? 2.0
  const riseDuration = opts.riseDuration ?? 3.0
  const cycleDelay = opts.cycleDelay ?? 1.0
  const sinkDepth = opts.sinkDepth ?? 0.8
  const sandLevel = opts.sandLevel ?? 0.0
  const randomPhase = opts.randomPhase ?? true
  const maxVariation = opts.maxVariation ?? 2.0

  if (!initialized) {
    // Find all Zombie Hand 3 entities
    setupZombieEntities(sinkDepth, sandLevel, sinkDuration, pauseDuration, riseDuration, cycleDelay, randomPhase, maxVariation)
    
    // Add animation system
    engine.addSystem(zombieAnimationSystem)
    
    initialized = true
  }
}

function setupZombieEntities(
  sinkDepth: number, 
  sandLevel: number, 
  sinkDuration: number, 
  pauseDuration: number, 
  riseDuration: number, 
  cycleDelay: number,
  randomPhase: boolean,
  maxVariation: number
) {
  // Find entities with zombie_hand_3 GLB model
  for (const [entity] of engine.getEntitiesWith(GltfContainer, Transform)) {
    const src = GltfContainer.get(entity).src
    if (!src) continue
    if (!src.includes('zombie_hand_3/')) continue

    const transform = Transform.get(entity)
    const originalPos = Vector3.create(transform.position.x, transform.position.y, transform.position.z)
    
    // Calculate random phase offset if enabled
    let phaseStartTime = 0
    if (randomPhase) {
      phaseStartTime = Math.random() * maxVariation
    }
    
    // Create zombie animation component
    ZombieAnimation.create(entity, {
      originalY: originalPos.y,
      sinkDepth,
      sandLevel,
      animationSpeed: 0.5, // Speed of animation
      phaseStartTime,
      isAnimating: true
    })
  }
}

function zombieAnimationSystem(dt: number) {
  globalTime += dt

  for (const [entity] of engine.getEntitiesWith(ZombieAnimation, Transform)) {
    const zombieData = ZombieAnimation.getMutable(entity)
    const transform = Transform.getMutable(entity)
    
    if (!zombieData.isAnimating) continue

    // Simple sine wave animation for sink and rise
    const time = globalTime - zombieData.phaseStartTime
    const wave = Math.sin(time * zombieData.animationSpeed) * 0.5 + 0.5 // 0 to 1
    
    // Calculate Y position: sink down and rise back up
    const sinkAmount = wave * zombieData.sinkDepth
    const targetY = zombieData.originalY - sinkAmount
    
    // Apply position (keep original X and Z)
    transform.position = Vector3.create(
      transform.position.x,
      targetY,
      transform.position.z
    )
  }
}

function easeInOut(t: number, power: number): number {
  if (t < 0.5) {
    return Math.pow(t * 2, power) * 0.5
  } else {
    return 1 - Math.pow((1 - t) * 2, power) * 0.5
  }
}
