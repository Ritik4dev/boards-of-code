import * as THREE from 'three';

export class WebGLHero {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;
    
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xE8080A, 0); // Transparent so red DOM background shines through
    this.container.appendChild(this.renderer.domElement);

    // 4. Create Open Torus / Cuff Geometry
    // Radius: 2.1, Tube: 0.65, Arc: Math.PI * 1.62 (creates the distinct open gap)
    const geometry = new THREE.TorusGeometry(2.1, 0.62, 48, 120, Math.PI * 1.64);
    geometry.center();

    // 5. Halftone Dot-Matrix Shader
    const customHalftoneShader = {
      uniforms: {
        uTime: { value: 0 },
        uLightPos: { value: new THREE.Vector3(3.0, 4.0, 5.0) },
        uBaseColor: { value: new THREE.Color('#E8080A') },
        uDotColor: { value: new THREE.Color('#680005') }, // Dark blood-red stipple
        uDotSize: { value: 5.5 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uBaseColor;
        uniform vec3 uDotColor;
        uniform vec3 uLightPos;
        uniform float uDotSize;
        
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(uLightPos);
          
          // Lambert diffuse
          float NdotL = max(dot(normal, lightDir), 0.0);
          
          // Secondary rim light for depth
          vec3 viewDir = normalize(vViewPosition);
          float rim = 1.0 - max(dot(normal, viewDir), 0.0);
          rim = pow(rim, 2.5);

          // Shading value (0.0 = darkest shadow, 1.0 = brightest)
          float shade = NdotL * 0.85 + rim * 0.15;
          shade = clamp(shade, 0.05, 0.95);

          // Screen-space coordinates for halftone dot raster
          vec2 screenPos = gl_FragCoord.xy;
          
          // Rotated halftone raster (45 degrees) for graphic print look
          float angle = 0.785398; // 45 deg
          mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          vec2 rotatedPos = rot * screenPos;
          
          vec2 grid = fract(rotatedPos / uDotSize);
          float dist = length(grid - vec2(0.5));

          // Inverse dot radius: larger dots in darker areas
          float maxRadius = 0.65;
          float dotRadius = (1.0 - shade) * maxRadius;
          
          // Smooth dot edge
          float dotMask = smoothstep(dotRadius + 0.08, dotRadius - 0.08, dist);

          // Combine: base red surface overlaid with dark red halftone dots
          vec3 finalColor = mix(uBaseColor, uDotColor, dotMask * 0.85);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: customHalftoneShader.uniforms,
      vertexShader: customHalftoneShader.vertexShader,
      fragmentShader: customHalftoneShader.fragmentShader,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    
    // Initial 3/4 tilt matching the video
    this.mesh.rotation.x = 1.15;
    this.mesh.rotation.y = 0.2;
    this.mesh.rotation.z = -0.4;
    
    this.scene.add(this.mesh);

    // Event listeners
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));

    this.clock = new THREE.Clock();
    this.animate();
  }

  onMouseMove(e) {
    this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
    this.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
  }

  onResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    if (this.material && this.material.uniforms.uTime) {
      this.material.uniforms.uTime.value = elapsedTime;
    }

    // Smooth mouse follow
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    // Continuous idle rotation + mouse influence
    if (this.mesh) {
      this.mesh.rotation.z += delta * 0.45;
      this.mesh.rotation.x = 1.15 + this.mouseY * 0.4;
      this.mesh.rotation.y = 0.2 + this.mouseX * 0.5;
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateOnScroll(progress) {
    if (this.mesh) {
      this.mesh.rotation.z += progress * 0.02;
    }
  }
}
