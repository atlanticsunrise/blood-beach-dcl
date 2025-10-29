// environment.ts
// Blood Beach ambient "Halloween red" environment for Decentraland SDK7
// - Ambient + directional red tint
// - Optional emissive red sky dome
// - Optional translucent "blood fog" planes
//
// Usage (in index.ts):
//   import { setupBloodBeachEnvironment } from './environment'
//   setupBloodBeachEnvironment({ level: 'heavy', enableFog: true, enableSkyDome: true, enableShadows: false })

import {
  engine,
  Transform,
  LightSource,
  MeshRenderer,
  Material,
  Entity,
  MaterialTransparencyMode
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'

export type BloodEnvLevel = 'subtle' | 'heavy'

export type BloodEnvOptions = {
  level?: BloodEnvLevel
  enableFog?: boolean
  enableSkyDome?: boolean
  enableSkybox?: boolean
  enableShadows?: boolean
}

type BloodEnvHandles = {
  ambient?: Entity
  sun?: Entity
  skybox?: Entity
  sky?: Entity
  fogPlanes?: Entity[]
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Converts 0–1 RGB to Color4 with alpha */
function rgba(r: number, g: number, b: number, a = 1) {
  return Color4.create(clamp01(r), clamp01(g), clamp01(b), clamp01(a))
}

function makeAmbient(level: BloodEnvLevel) {
  const ambient = engine.addEntity()
  const t = level === 'heavy' ? 1 : 0 // 0=subtle, 1=heavy

  // Ambient red wash (rusty → crimson) - using point light for ambient effect
  const r = lerp(0.28, 0.55, t)
  const g = lerp(0.10, 0.18, t)
  const b = lerp(0.10, 0.18, t)
  const intensity = lerp(0.7, 1.1, t)

  // Position high above scene for ambient lighting effect
  Transform.create(ambient, {
    position: Vector3.create(8, 20, 8)
  })

  LightSource.create(ambient, {
    type: LightSource.Type.Point({}),
    color: { r, g, b },
    intensity: intensity * 100, // Convert to candela
    range: 50 // Large range for ambient effect
  })
  return ambient
}

function makeSun(level: BloodEnvLevel, enableShadows = false) {
  const sun = engine.addEntity()
  const t = level === 'heavy' ? 1 : 0

  // Position high and angled for directional lighting effect
  Transform.create(sun, {
    position: Vector3.create(8, 15, 8),
    rotation: Quaternion.fromEulerDegrees(25, -40, 0)
  })

  const r = lerp(0.55, 0.70, t)
  const g = lerp(0.18, 0.22, t)
  const b = lerp(0.18, 0.22, t)
  const intensity = lerp(0.9, 1.3, t)

  LightSource.create(sun, {
    type: LightSource.Type.Spot({
      innerAngle: 60,
      outerAngle: 90
    }),
    color: { r, g, b },
    intensity: intensity * 200, // Convert to candela
    range: 30,
    shadow: enableShadows
  })

  return sun
}

function makeSkybox(level: BloodEnvLevel) {
  // Create a massive crimson red sky sphere for uniform background
  const skybox = engine.addEntity()
  const t = level === 'heavy' ? 1 : 0

  // Create an enormous sphere to cover the entire scene
  MeshRenderer.setSphere(skybox)
  Transform.create(skybox, {
    position: Vector3.create(8, 40, 8),
    scale: Vector3.create(500, 500, 500) // Much larger for complete coverage
  })

  // Deep crimson red sky material for uniform background
  const skyColor = rgba(lerp(0.25, 0.35, t), lerp(0.02, 0.05, t), lerp(0.02, 0.05, t), 0.9)
  const emissive = rgba(lerp(0.4, 0.5, t), lerp(0.05, 0.08, t), lerp(0.05, 0.08, t), 1)

  Material.setPbrMaterial(skybox, {
    albedoColor: skyColor,
    emissiveColor: emissive,
    emissiveIntensity: 0.6, // Increased for more uniform coverage
    metallic: 0,
    roughness: 1,
    transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND
  })

  return skybox
}

function makeSkyDome(level: BloodEnvLevel) {
  const sky = engine.addEntity()
  MeshRenderer.setSphere(sky)

  // Massive inward-facing dome for uniform crimson background
  const scale = 400 // Increased size for better coverage
  Transform.create(sky, {
    position: Vector3.create(8, 40, 8),
    scale: Vector3.create(-scale, scale, scale)
  })

  const t = level === 'heavy' ? 1 : 0
  // Enhanced crimson red for uniform background
  const albedo = rgba(lerp(0.2, 0.3, t), lerp(0.02, 0.04, t), lerp(0.02, 0.04, t), 0.95)
  const emissive = rgba(lerp(0.5, 0.6, t), lerp(0.05, 0.07, t), lerp(0.05, 0.07, t), 1)
  const emissiveIntensity = lerp(0.6, 0.8, t) // Increased for more uniform coverage

  Material.setPbrMaterial(sky, {
    albedoColor: albedo,
    emissiveColor: emissive,
    emissiveIntensity,
    metallic: 0,
    roughness: 1,
    transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND
  })

  return sky
}

function makeFogPlane(x: number, z: number, width = 64, height = 16, alpha = 0.12) {
  const fog = engine.addEntity()
  MeshRenderer.setBox(fog)
  Transform.create(fog, {
    position: Vector3.create(x, height / 2, z),
    scale: Vector3.create(width, height, 0.1)
  })

  Material.setPbrMaterial(fog, {
    albedoColor: rgba(0.60, 0.05, 0.05, alpha),
    metallic: 0,
    roughness: 1
  })

  return fog
}

function makeFogStack(level: BloodEnvLevel) {
  // Three layered curtains for parallax and depth
  const t = level === 'heavy' ? 1 : 0
  const alphaA = lerp(0.10, 0.16, t)
  const alphaB = lerp(0.08, 0.14, t)
  const alphaC = lerp(0.06, 0.12, t)

  const planes: Entity[] = []
  planes.push(makeFogPlane(8, 2, 64, 14, alphaA))
  planes.push(makeFogPlane(8, 10, 64, 16, alphaB))
  planes.push(makeFogPlane(8, 18, 64, 18, alphaC))

  // Slight yaw for subtle parallax
  const rotL = Quaternion.fromEulerDegrees(0, -6, 0)
  const rotR = Quaternion.fromEulerDegrees(0, 5, 0)
  Transform.getMutable(planes[0]).rotation = rotL
  Transform.getMutable(planes[2]).rotation = rotR

  return planes
}

/**
 * Sets up the Blood Beach red-tinted environment.
 * Returns handles so you can toggle or remove elements later.
 */
export function setupBloodBeachEnvironment(opts: BloodEnvOptions = {}): BloodEnvHandles {
  const level = opts.level ?? 'heavy'
  const enableFog = opts.enableFog ?? true
  const enableSkyDome = opts.enableSkyDome ?? true
  const enableSkybox = opts.enableSkybox ?? true
  const enableShadows = opts.enableShadows ?? false

  const handles: BloodEnvHandles = {}

  handles.ambient = makeAmbient(level)
  handles.sun = makeSun(level, enableShadows)

  if (enableSkybox) {
    handles.skybox = makeSkybox(level)
  }
  if (enableSkyDome) {
    handles.sky = makeSkyDome(level)
  }
  if (enableFog) {
    handles.fogPlanes = makeFogStack(level)
  }

  return handles
}
