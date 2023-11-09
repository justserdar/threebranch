import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default function initCamera(settings){
    const camera: THREE.Camera = new THREE.PerspectiveCamera(...settings)

    // adjust the camera as necessary
    return camera
} 
