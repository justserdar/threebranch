<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import initCamera from "~/utils/Camera"

const props = withDefaults(
  defineProps<{
    /** The size of the canvas. */
    size?: 'full' | 'container' | 'auto'
    /** Override the container class f.e tailwind classes. */
    customClassOverride?: string | boolean
    /** Enables the debug gui panel. */
    debug?: boolean
    /** Whether the scene is a scroller. */
    scroller?: boolean
    /** Scroller options */
    scrollerOptions?: {
      sections?: number,
      sectionHeight?: number
    } | any
    /** Toggle render on demand for ultra low performance, 
     * will invalidate the loop and only render new frames on mouse interaction or scrolling */
    renderOnDemand?: boolean
    /** The default renderer is not optimized for high-performance. */
    antialias?: boolean
    /** The default renderer is not optimized for high-performance. */
    performance?: 'high-performance' | ''
    /** Enable HDR environment scene lighting. */
    enableHDR?: boolean
    /** Provide a HDR Environment map. */
    hdrEnvMap?: string
    /** The default renderer has no composer, enabling composer allows postprocessing. */
    composer?: boolean
    /** Enable or disable OrbitControls or TrackBall. */
    controls?: 'orbit' | 'trackball' | 'default'
    /** Enable or disable toneMapping. */
    enableToneMapping?: boolean
    /** The tonemapping style. */
    toneMapping?: 'Reindhard' | 'ACES' | 'default'
    /** Tonemapping intensity, default: 1. */
    toneMappingExposure?: number
    /** Whether the scene in a loading state. */
    loading?: boolean
    /** Whether the scene is multi-tenant. */
    socket?: WebSocket
    /** Whether the scene is multi-tenant. */
    socketChannels?: string[]
    /** Whether the scene is VR enabled. */
    enableXR?: boolean
    /** All your assets or single model. */
    assets?: [] | any
    /** Whether your GLB/GLTF models use DRACO compression. */
    compression?: boolean
    /** An indicator that the renderer is rendering */
    badge?: boolean
    /** Add a pulse animation on the rendering badge */
    badgePulse?: boolean
  }>(),
  {
    size: 'full',
    customClassOverride: false,
    debug: false,
    fog: false,
    scroller: false,
    scrollerOptions: {},
    renderOnDemand: true,
    enableToneMapping: false,
    enableHDR: false,
    hdrEnvMap: '',
    compression: true,
    toneMappingExposure: 1,
    toneMapping: 'Reindhard',
    controls: 'orbit',
    loading: true,
    badge: false,
    assets: [],
    badgePulse: false,
  },
)

const appConfig = useAppConfig()
const performance = ref(props.performance ? props.performance : appConfig?.threebranch.defaultPerformance)
const antialias = ref(props.antialias ? props.antialias : appConfig?.threebranch.defaultAntialias)
const toneMappingExposure = ref(props.toneMappingExposure ?? 1)

const isLoading = ref(props.loading ?? true)
const isFullScreen = ref(props.size === 'full' ? true : false)
const isFoggy = ref(props.fog ? true : false)
const debugging = ref(props.debug ? true : false)

const scene = new THREE.Scene()
if(isFoggy) scene.fog = new THREE.FogExp2( 0xbbbbbb, 0.001 );
const sceneAssets = props.assets

onMounted(async () => {
  await nextTick()
  const canvas: HTMLElement = document.getElementById('webgl')

  // Create a scene, camera, and renderer
  scene.background = new THREE.Color(0xffffff)
  if (props.enableHDR) {
    const hdrLoader = new RGBELoader();
    hdrLoader.setDataType(THREE.FloatType); // Set the data type of the loaded HDR file

    hdrLoader.load(props.hdrEnvMap, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });
  }
  
  const camera = await initCamera([35,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  1000])
  camera.position.set(20, 2, 0)
  
  const renderer = new THREE.WebGLRenderer({
    antialias,
    performance,
    toneMapping: THREE.ReinhardToneMapping,
    toneMappingExposure,
  })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.VSMShadowMap
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  canvas.appendChild(renderer.domElement)
  const stats = new Stats()
  if(debugging.value) canvas.appendChild(stats.dom)


  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshPhysicalMaterial({
    wireframe: false,
    metalness: .85,
    roughness: .15,
    color: 0x00ff00,
  })
  const cube = new THREE.Mesh(geometry, material)
  cube.castShadow = true

  cube.position.set(0, 2, 0)
  scene.add(cube)


  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, .25)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(10, 5, 1)
  directionalLight.castShadow = true
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 25
  directionalLight.shadow.camera.left = -10
  directionalLight.shadow.camera.right = 10
  directionalLight.shadow.camera.top = 10
  directionalLight.shadow.camera.bottom = -10
  directionalLight.shadow.mapSize.width = 1024
  directionalLight.shadow.mapSize.height = 1024
  directionalLight.shadow.radius = 5
  directionalLight.shadow.blurSamples = 25
  scene.add(directionalLight)


  const floorGeometry = new THREE.PlaneGeometry(15, 15, 1, 1)
  const floorMaterial = new THREE.ShadowMaterial()
  floorMaterial.opacity = 0.7

  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -0.5 * Math.PI
  floor.position.y = 0
  floor.receiveShadow = true
  scene.add(floor)

  const render = () => {
    requestAnimationFrame(render)
    camera.lookAt(0, 1, 0)
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01

    renderer.render(scene, camera)
    if(debugging.value) stats.update()
  }

  render()

  function handleResize() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }
  window.addEventListener('resize', handleResize)
  setTimeout(function () {
    isLoading.value = false
  }, 1000);
})

onUnmounted(() => {
  window.removeEventListener('resize', () => { })
  document.getElementById('#webgl')?.replaceChildren()
})
</script>

<template>
  <div :class="customClassOverride ? customClassOverride : `webgl-container`"
    :style="{ position: isFullScreen ? 'absolute' : 'relative' }">
    <client-only>
      <div id="webgl" :style="{ opacity: isLoading ? 0 : 1 }"></div>
    </client-only>
  </div>
</template>

<style scoped>
.webgl-container {
  height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
}

#webgl {
  height: 100%;
  width: 100%;
  opacity: 0;
  transition: opacity 1s ease;
}
</style>