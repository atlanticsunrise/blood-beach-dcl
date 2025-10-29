import { Color4, Vector3 } from '@dcl/sdk/math'
import { engine, GltfNodeModifiers, GltfContainer, Transform } from '@dcl/sdk/ecs'
import { setupBloodBeachEnvironment } from './environment'
import { setupGhostHaunting } from './ghosts'
import { setupZombieAnimation } from './zombie-animation'
import { setupVegetationBreeze } from './vegetation-breeze'

export function main() {
  // Set up the Blood Beach Halloween red environment
  const environmentHandles = setupBloodBeachEnvironment({
    level: 'heavy',
    enableFog: false,  // Disable fog planes to remove square panels
    enableSkyDome: true,
    enableSkybox: true,
    enableShadows: false
  })
  
  // Make existing ghosts drift slowly in haunting loops
  setupGhostHaunting({})
  
  // Animate zombie hands to sink into sand and rise back up
  setupZombieAnimation({
    sinkDepth: 0.6,         // Sink 0.6 meters into sand
    sandLevel: 0.0,         // Sand surface at Y=0
    randomPhase: true,      // Randomize start times
    maxVariation: 3.0       // Up to 3 seconds variation
  })

  // Gentle breeze on grasses, weeds, and ferns
  setupVegetationBreeze({
    maxEntities: 120,
    minRotDeg: 1.5,
    maxRotDeg: 4.0,
    minPosAmp: 0.01,
    maxPosAmp: 0.04,
    minSpeed: 0.3,
    maxSpeed: 0.7
  })

  // Create the blood red moon for the night scene
  const bloodMoon = engine.addEntity()
  
  // Position the moon high in the night sky
  Transform.create(bloodMoon, {
    position: Vector3.create(72.5, 20, 7.75),
    scale: Vector3.create(1.5, 1.5, 1.5)
  })
  
  // Add the moon GLB model
  GltfContainer.create(bloodMoon, {
    src: 'assets/asset-packs/moon/Planet_05/Planet_05.glb'
  })
  
  // Apply deep crimson material using GltfNodeModifiers
  GltfNodeModifiers.create(bloodMoon, {
    modifiers: [
      {
        path: '', // empty string = whole model
        material: {
          material: {
            $case: 'pbr',
            pbr: {
              albedoColor: Color4.create(0.6, 0.05, 0.05, 1), // Deep crimson
              metallic: 0.05,
              roughness: 0.9,
              emissiveColor: Color4.create(0.4, 0.02, 0.02, 1), // Crimson glow
              emissiveIntensity: 0.4
            }
          }
        }
      }
    ]
  })
}
