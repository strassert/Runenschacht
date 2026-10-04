import * as THREE from 'three';

/** Himmelskuppel mit vertikalem Verlauf und Sonnenglanz. */
export function createSky(sunDirection: THREE.Vector3): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSunDir: { value: sunDirection.clone().normalize() },
      uTop: { value: new THREE.Color(0x7fa7c9) },
      uHorizon: { value: new THREE.Color(0xf6d7a3) },
      uBottom: { value: new THREE.Color(0xc9a776) },
      uSun: { value: new THREE.Color(0xfff1c8) },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDir;
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uBottom;
      uniform vec3 uSun;
      varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 col = h > 0.0 ? mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.55)) : mix(uHorizon, uBottom, clamp(-h * 3.0, 0.0, 1.0));
        float sun = pow(max(dot(normalize(vDir), uSunDir), 0.0), 64.0);
        col += uSun * sun * 0.9;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(350, 32, 16), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return mesh;
}

export function applyFog(scene: THREE.Scene): void {
  scene.fog = new THREE.Fog(0xe9c99a, 45, 210);
}
