// Warp Speed 2 - WebGL Background Shader
// Based on David Hoskins' shader: https://www.shadertoy.com/view/4tjSDt
// Adapted for Hugo blog homepage background
// Light/Dark dual shader with theme auto-switching

(function() {
  'use strict';

  const canvas = document.getElementById('shader-bg');
  if (!canvas) return;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    console.warn('WebGL not supported');
    return;
  }

  // ===== 顶点着色器（共用）=====
  const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // ===== Dark 主题 shader：深蓝紫 warp speed 效果 =====
  const darkFragSource = `
    precision highp float;
    uniform vec3 iResolution;
    uniform float iTime;

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      float s = 0.0, v = 0.0;
      vec2 uv = (fragCoord / iResolution.xy) * 2.0 - 1.0;
      float time = (iTime - 2.0) * 58.0;
      vec3 col = vec3(0.0);
      vec3 init = vec3(sin(time * 0.0032) * 0.3, 0.35 - cos(time * 0.005) * 0.3, time * 0.002);

      for (int r = 0; r < 100; r++) {
        vec3 p = init + s * vec3(uv, 0.05);
        p.z = fract(p.z);
        for (int i = 0; i < 10; i++) {
          p = abs(p * 2.04) / dot(p, p) - 0.9;
        }
        v += pow(dot(p, p), 0.7) * 0.06;
        col += vec3(v * 0.2 + 0.4, 12.0 - s * 2.0, 0.1 + v * 1.0) * v * 0.00003;
        s += 0.025;
      }

      col = col / (1.0 + abs(col));
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // ===== Light 主题 shader：柔和光晕 + Warp Speed 风格粒子，与 body 渐变融合 =====
  const lightFragSource = `
    precision highp float;
    uniform vec3 iResolution;
    uniform float iTime;

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 uv = (fragCoord / iResolution.xy) * 2.0 - 1.0;
      uv.x *= iResolution.x / iResolution.y;

      // 底色：径向渐变纯色（与 body background-image 一致）
      // 中心：#fff + rgba(196,133,246,0.2) = rgb(243,231,253)
      // 40%：#fff + rgba(243,232,255,0.4) = rgb(251,247,255)
      // 边缘：#ffffff
      vec3 bgCenter = vec3(0.953, 0.906, 0.992);
      vec3 bgMid = vec3(0.984, 0.969, 1.0);
      vec3 bgEdge = vec3(1.0, 1.0, 1.0);

      float dist = length(uv);
      float t = dist / 1.414;
      vec3 bg;
      if (t < 0.4) {
        bg = mix(bgCenter, bgMid, t / 0.4);
      } else {
        bg = mix(bgMid, bgEdge, (t - 0.4) / 0.6);
      }

      // Warp Speed 风格粒子（与 Dark 完全同源）
      float s = 0.0, v = 0.0;
      float time = (iTime - 2.0) * 58.0;
      vec3 col = vec3(0.0);
      vec3 init = vec3(sin(time * 0.0032) * 0.3, 0.35 - cos(time * 0.005) * 0.3, time * 0.002);

      for (int r = 0; r < 80; r++) {
        vec3 p = init + s * vec3(uv, 0.05);
        p.z = fract(p.z);
        for (int i = 0; i < 8; i++) {
          p = abs(p * 2.04) / dot(p, p) - 0.9;
        }
        v += pow(dot(p, p), 0.7) * 0.06;
        col += vec3(v * 0.2 + 0.4, 12.0 - s * 2.0, 0.1 + v * 1.0) * v * 0.000015;
        s += 0.03;
      }

      col = col / (1.0 + abs(col));

      // 提取亮度
      float brightness = dot(col, vec3(0.299, 0.587, 0.114));

      // 波纹：以粒子为中心向外扩散的 #9333ea 波纹
      float ripple = sin(brightness * 30.0 - iTime * 1.5) * 0.5 + 0.5;
      float waveMask = brightness * ripple;

      vec3 purpleColor = vec3(0.576, 0.2, 0.918);

      // 波纹光晕层：#9333ea 向外发散变淡
      vec3 glowColor = mix(bg, purpleColor, clamp(waveMask * 2.5, 0.0, 0.6));

      // 粒子核心层：更亮的紫色
      vec3 coreColor = mix(glowColor, vec3(0.8, 0.5, 1.0), clamp(brightness * 5.0, 0.0, 0.8));

      // 合成：底色 + 波纹光晕 + 核心
      vec3 finalCol = mix(bg, glowColor, clamp(waveMask * 2.0, 0.0, 0.5));
      finalCol = mix(finalCol, coreColor, clamp(brightness * 4.0, 0.0, 0.7));

      gl_FragColor = vec4(finalCol, 1.0);
    }
  `;

  // ===== Shader 编译工具 =====
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, fragSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragSource);
    if (!vs || !fs) return null;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return null;
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return prog;
  }

  // ===== 预编译两套 shader program =====
  const darkProgram = createProgram(gl, darkFragSource);
  const lightProgram = createProgram(gl, lightFragSource);
  if (!darkProgram || !lightProgram) return;

  // ===== 缓存 uniform 位置 =====
  function getUniforms(prog) {
    return {
      resolution: gl.getUniformLocation(prog, 'iResolution'),
      time: gl.getUniformLocation(prog, 'iTime'),
    };
  }
  const darkUniforms = getUniforms(darkProgram);
  const lightUniforms = getUniforms(lightProgram);

  // ===== 共用顶点 buffer =====
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  // ===== 主题状态 =====
  let currentTheme = '';
  let activeUniforms = null;

  function getTheme() {
    return document.documentElement.getAttribute('data-theme')
      || document.body.getAttribute('data-theme')
      || 'dark';
  }

  function switchProgram(theme) {
    if (theme === currentTheme) return;
    currentTheme = theme;
    const prog = theme === 'light' ? lightProgram : darkProgram;
    const u = theme === 'light' ? lightUniforms : darkUniforms;
    gl.useProgram(prog);
    const posLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    activeUniforms = u;
  }

  // ===== 初始化 shader =====
  switchProgram(getTheme());

  // ===== 尺寸适配 =====
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const newWidth = Math.round(w * dpr);
    const newHeight = Math.round(h * dpr);
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  resizeCanvas();

  let resizeTimer;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 16);
  });
  resizeObserver.observe(canvas);
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 50);
  });

  // ===== 监听主题切换 =====
  const themeObserver = new MutationObserver(() => {
    switchProgram(getTheme());
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  // ===== 动画循环 =====
  let startTime = Date.now();
  let animationId;

  function render() {
    const time = (Date.now() - startTime) / 1000.0;

    const u = activeUniforms || darkUniforms;
    gl.uniform3f(u.resolution, canvas.width, canvas.height, 1.0);
    gl.uniform1f(u.time, time);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    animationId = requestAnimationFrame(render);
  }

  // ===== 可见性优化 =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!animationId) render();
      } else {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    });
  }, { threshold: 0.1 });

  observer.observe(canvas);

  // ===== 清理 =====
  window.addEventListener('beforeunload', () => {
    if (animationId) cancelAnimationFrame(animationId);
    resizeObserver.disconnect();
    themeObserver.disconnect();
    gl.deleteProgram(darkProgram);
    gl.deleteProgram(lightProgram);
    gl.deleteBuffer(positionBuffer);
  });
})();
