import React, { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './LineWaves.css';

function hexToVec3(hex) {
  const c = parseInt(hex.replace('#', ''), 16);
  return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
}

const vertexShader = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uSpeed;
  uniform float uInnerLineCount;
  uniform float uOuterLineCount;
  uniform float uWarpIntensity;
  uniform float uRotation;
  uniform float uEdgeFadeWidth;
  uniform float uColorCycleSpeed;
  uniform float uBrightness;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec2 uMouse;
  uniform float uMouseInfluence;
  uniform float uEnableMouse;

  mat2 rotate(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  // Basic noise
  float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
  float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= uResolution.x / uResolution.y;
    
    uv *= rotate(uRotation * 3.14159 / 180.0);
    
    if (uEnableMouse > 0.5) {
      vec2 m = uMouse - 0.5;
      m.x *= uResolution.x / uResolution.y;
      float dist = length(uv - m);
      float influence = exp(-dist * 3.0) * uMouseInfluence;
      uv.y += sin(uTime * 2.0 - dist * 10.0) * influence * 0.1;
    }

    float t = uTime * uSpeed;
    
    float warp = noise(uv * 3.0 + t * 0.5) * uWarpIntensity;
    float y = uv.y + warp * 0.1;

    float innerLines = sin(y * uInnerLineCount * 3.14159 + t);
    float outerLines = cos(y * uOuterLineCount * 3.14159 - t * 0.8);
    
    float lines = smoothstep(0.9, 1.0, (innerLines * 0.5 + outerLines * 0.5));
    
    vec3 color = mix(uColor1, uColor2, sin(uv.x * 2.0 + t * uColorCycleSpeed) * 0.5 + 0.5);
    color = mix(color, uColor3, cos(uv.y * 2.0 - t * uColorCycleSpeed) * 0.5 + 0.5);
    
    color *= lines * uBrightness * 5.0; // Boost brightness for lines
    
    if (uEdgeFadeWidth > 0.0) {
      float fade = smoothstep(0.0, uEdgeFadeWidth, vUv.x) * smoothstep(1.0, 1.0 - uEdgeFadeWidth, vUv.x);
      fade *= smoothstep(0.0, uEdgeFadeWidth, vUv.y) * smoothstep(1.0, 1.0 - uEdgeFadeWidth, vUv.y);
      color *= fade;
    }

    gl_FragColor = vec4(color, 1.0); // No alpha background, rely on color addition or just output
  }
`;

export default function LineWaves({
  speed = 0.3,
  innerLineCount = 32,
  outerLineCount = 36,
  warpIntensity = 1.0,
  rotation = -45,
  edgeFadeWidth = 0,
  colorCycleSpeed = 1.0,
  brightness = 0.15,
  color1 = '#2563eb',
  color2 = '#7c3aed',
  color3 = '#22c55e',
  enableMouseInteraction = true,
  mouseInfluence = 1.5,
  className = ''
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, antialias: true });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uSpeed: { value: speed },
        uInnerLineCount: { value: innerLineCount },
        uOuterLineCount: { value: outerLineCount },
        uWarpIntensity: { value: warpIntensity },
        uRotation: { value: rotation },
        uEdgeFadeWidth: { value: edgeFadeWidth },
        uColorCycleSpeed: { value: colorCycleSpeed },
        uBrightness: { value: brightness },
        uColor1: { value: hexToVec3(color1) },
        uColor2: { value: hexToVec3(color2) },
        uColor3: { value: hexToVec3(color3) },
        uMouse: { value: [0.5, 0.5] },
        uMouseInfluence: { value: mouseInfluence },
        uEnableMouse: { value: enableMouseInteraction ? 1 : 0 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    let animationId;
    let mouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      program.uniforms.uResolution.value = [rect.width, rect.height];
    };
    window.addEventListener('resize', resize);
    resize();

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      targetMouse[0] = (e.clientX - rect.left) / rect.width;
      targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
    };
    
    if (enableMouseInteraction) {
      window.addEventListener('mousemove', onMouseMove);
    }

    const render = (t) => {
      program.uniforms.uTime.value = t * 0.001;
      
      mouse[0] += (targetMouse[0] - mouse[0]) * 0.05;
      mouse[1] += (targetMouse[1] - mouse[1]) * 0.05;
      program.uniforms.uMouse.value = mouse;

      renderer.render({ scene: mesh });
      animationId = requestAnimationFrame(render);
    };
    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (enableMouseInteraction) {
        window.removeEventListener('mousemove', onMouseMove);
      }
      container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [
    speed, innerLineCount, outerLineCount, warpIntensity, rotation,
    edgeFadeWidth, colorCycleSpeed, brightness, color1, color2, color3,
    enableMouseInteraction, mouseInfluence
  ]);

  return <div ref={containerRef} className={`line-waves-container ${className}`} />;
}
