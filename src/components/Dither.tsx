import { useEffect, useRef } from "react";

interface DitherProps {
  waveColor?: [number, number, number];
  backgroundColor?: [number, number, number];
  colorNum?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
  waveSpeed?: number;
  disableAnimation?: boolean;
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
}

const BAYER_4X4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
].map((v) => v / 16);

const VERT_SRC = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAG_SRC = `
  precision mediump float;
  varying vec2 v_uv;
  uniform float u_time;
  uniform vec2  u_resolution;
  uniform vec3  u_waveColor;
  uniform vec3  u_bgColor;
  uniform float u_amplitude;
  uniform float u_frequency;
  uniform vec2  u_mouse;
  uniform float u_mouseRadius;
  uniform int   u_mouse_active;
  uniform int   u_colorNum;
  uniform sampler2D u_bayer;

  float wave(vec2 uv, float time) {
    float x = uv.x * u_frequency * 6.2831853;
    float y = uv.y * u_frequency * 6.2831853 * 0.7;
    return sin(x + time) * cos(y + time * 0.6) * u_amplitude;
  }

  void main() {
    vec2 uv = v_uv;
    float w = wave(uv, u_time);
    float brightness = clamp(0.5 + w + uv.y * 0.3, 0.0, 1.0);
    if (u_mouse_active == 1) {
      vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
      float d = length((uv - u_mouse) * aspect);
      float spot = smoothstep(u_mouseRadius, 0.0, d);
      brightness = clamp(brightness + spot * 0.4, 0.0, 1.0);
    }
    vec2 bayerCoord = mod(floor(gl_FragCoord.xy), 4.0) / 4.0;
    float threshold = texture2D(u_bayer, bayerCoord).r;
    float n = float(u_colorNum);
    float quantised = clamp(floor(brightness * n + threshold) / n, 0.0, 1.0);
    vec3 color = mix(u_bgColor, u_waveColor, quantised);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("Shader error:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function createProgram(gl: WebGLRenderingContext, vert: string, frag: string) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vert);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Program error:", gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

export default function Dither({
  waveColor = [0.659, 0.333, 0.969],
  backgroundColor = [0, 0, 0],
  colorNum = 4,
  waveAmplitude = 0.3,
  waveFrequency = 3,
  waveSpeed = 0.05,
  disableAnimation = false,
  enableMouseInteraction = false,
  mouseRadius = 0.3,
}: DitherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<[number, number]>([0.5, 0.5]);
  const mouseActiveRef = useRef(false);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const prog = createProgram(gl, VERT_SRC, FRAG_SRC);
    if (!prog) return;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const bayerTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, bayerTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 4, 4, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE,
      new Uint8Array(BAYER_4X4.map((v) => Math.round(v * 255))));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.useProgram(prog);
    gl.uniform1i(gl.getUniformLocation(prog, "u_bayer"), 0);

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? document.body);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = [
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height,
      ];
      mouseActiveRef.current = true;
    };
    if (enableMouseInteraction) window.addEventListener("mousemove", onMove);

    const render = (ts: number) => {
      if (!disableAnimation) {
        const dt = lastTsRef.current == null ? 0 : ts - lastTsRef.current;
        lastTsRef.current = ts;
        timeRef.current += dt * 0.001 * waveSpeed;
      }
      const ul = (n: string) => gl.getUniformLocation(prog, n);
      gl.useProgram(prog);
      gl.uniform1f(ul("u_time"), timeRef.current);
      gl.uniform2f(ul("u_resolution"), canvas.width, canvas.height);
      gl.uniform3fv(ul("u_waveColor"), new Float32Array(waveColor));
      gl.uniform3fv(ul("u_bgColor"), new Float32Array(backgroundColor));
      gl.uniform1f(ul("u_amplitude"), waveAmplitude);
      gl.uniform1f(ul("u_frequency"), waveFrequency);
      gl.uniform2fv(ul("u_mouse"), new Float32Array(mouseRef.current));
      gl.uniform1f(ul("u_mouseRadius"), mouseRadius);
      gl.uniform1i(ul("u_mouse_active"), mouseActiveRef.current ? 1 : 0);
      gl.uniform1i(ul("u_colorNum"), colorNum);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bayerTex);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      if (enableMouseInteraction) window.removeEventListener("mousemove", onMove);
      gl.deleteBuffer(buf);
      gl.deleteTexture(bayerTex);
      gl.deleteProgram(prog);
    };
  }, [waveColor, backgroundColor, colorNum, waveAmplitude, waveFrequency, waveSpeed, disableAnimation, enableMouseInteraction, mouseRadius]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
