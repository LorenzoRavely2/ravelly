// Fundo animado em WebGL (adaptado do componente AnimatedGradient, versão JS puro)

const VERTEX = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
  vec3 color1 = c1.rgb * c1.a;
  vec3 color2 = c2.rgb * c2.a;
  vec3 color3 = c3.rgb * c3.a;

  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);

  vec3 blended_color_2 = mix(color1, color2, r1);
  float blended_opacity_2 = mix(c1.a, c2.a, r1);

  vec3 c = mix(blended_color_2, color3, r2);
  float o = mix(blended_opacity_2, c3.a, r2);
  return vec4(c, o);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = .5 * u_time;

  float noise_scale = .0005 + .006 * u_scale;

  uv -= .5;
  uv *= (noise_scale * u_resolution);
  uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;

  float n1 = noise(uv * 1. + t);
  float n2 = noise(uv * 2. - t);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= iterations_number; i++) {
    uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
    uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);

  float shape = 0.;
  float mixer = 0.;
  if (u_shape < .5) {
    vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
    float f = fract(stripes_shape_uv.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float sh = 1. - uv.y;
    sh -= .5;
    sh /= (noise_scale * u_resolution.y);
    sh += .5;
    float shape_scaling = .2 * (1. - u_shapeScale);
    shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
    mixer = shape;
  }

  vec4 color_mix = blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);
  fragColor = vec4(color_mix.rgb, color_mix.a);
}
`;

const FORMATOS = { Checks: 0, Stripes: 1, Edge: 2 };

function hexParaRgb(hex){
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}

function criarShader(gl, tipo, codigo){
  const shader = gl.createShader(tipo);
  gl.shaderSource(shader, codigo);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function criarGradiente(container, cfg){
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: true });

  // sem WebGL2 o fundo CSS de reserva continua aparecendo
  if(!gl) return;

  const vs = criarShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = criarShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if(!vs || !fs) return;

  const programa = gl.createProgram();
  gl.attachShader(programa, vs);
  gl.attachShader(programa, fs);
  gl.linkProgram(programa);
  gl.useProgram(programa);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

  const pos = gl.getAttribLocation(programa, 'a_position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const u = nome => gl.getUniformLocation(programa, nome);
  const tempo = u('u_time'), resolucao = u('u_resolution'), pixelRatio = u('u_pixelRatio');

  // valores que não mudam entre os quadros
  const c1 = hexParaRgb(cfg.cor1), c2 = hexParaRgb(cfg.cor2), c3 = hexParaRgb(cfg.cor3);
  gl.uniform1f(u('u_scale'), cfg.escala);
  gl.uniform1f(u('u_rotation'), cfg.rotacao * Math.PI / 180);
  gl.uniform4f(u('u_color1'), c1[0], c1[1], c1[2], 1);
  gl.uniform4f(u('u_color2'), c2[0], c2[1], c2[2], 1);
  gl.uniform4f(u('u_color3'), c3[0], c3[1], c3[2], 1);
  gl.uniform1f(u('u_proportion'), cfg.proporcao / 100);
  gl.uniform1f(u('u_softness'), cfg.suavidade / 100);
  gl.uniform1f(u('u_shape'), FORMATOS[cfg.formato]);
  gl.uniform1f(u('u_shapeScale'), cfg.tamanho / 100);
  gl.uniform1f(u('u_distortion'), cfg.distorcao / 50);
  gl.uniform1f(u('u_swirl'), cfg.giro / 100);
  gl.uniform1f(u('u_swirlIterations'), cfg.giro === 0 ? 0 : cfg.iteracoes);

  const velocidade = (cfg.velocidade / 100) * 5;
  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inicio = performance.now();
  let visivel = true;
  let rodando = false;
  let quadro = 0;

  function desenhar(segundos){
    gl.uniform1f(tempo, segundos * velocidade + cfg.deslocamento * 0.01);
    gl.uniform2f(resolucao, canvas.width, canvas.height);
    gl.uniform1f(pixelRatio, ratio());
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // limitei em 1.5 para não pesar em telas retina
  function ratio(){
    return Math.min(window.devicePixelRatio || 1, 1.5);
  }

  function ajustar(){
    canvas.width = container.clientWidth * ratio();
    canvas.height = container.clientHeight * ratio();
    gl.viewport(0, 0, canvas.width, canvas.height);
    if(reduzirMovimento || !rodando) desenhar((performance.now() - inicio) / 1000);
  }

  function animar(agora){
    if(!visivel){
      rodando = false;
      return;
    }
    desenhar((agora - inicio) / 1000);
    quadro = requestAnimationFrame(animar);
  }

  container.appendChild(canvas);
  new ResizeObserver(ajustar).observe(container);
  ajustar();

  if(reduzirMovimento) return;

  // só anima enquanto o fundo está na tela
  new IntersectionObserver(entradas => {
    visivel = entradas[0].isIntersecting;
    if(visivel && !rodando){
      rodando = true;
      quadro = requestAnimationFrame(animar);
    }
  }).observe(container);
}

const fundoHero = document.getElementById('heroBg');
if(fundoHero){
  criarGradiente(fundoHero, {
    cor1: '#060608',
    cor2: '#7c5cff',
    cor3: '#060608',
    rotacao: 0,
    proporcao: 33,
    escala: 0.48,
    velocidade: 22,
    distorcao: 4,
    giro: 65,
    iteracoes: 5,
    suavidade: 100,
    deslocamento: -235,
    formato: 'Edge',
    tamanho: 48
  });
}
