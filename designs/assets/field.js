// Hero field: a slow fbm smoke on the brand ground with a low-alpha warm glow (data-field a|b|c sets the
// composition). Our own shader, after the rebrand Field pattern. Guarded: no WebGL, an exception, reduced motion
// (one still frame) or a slow device (frame-time watchdog: the last frame stays, still) all degrade quietly.
// Starts once the page has loaded and gone idle, so the shader compile and first frames never delay the content.
(() => {
  const host = document.querySelector(".field[data-field]");
  const canvas = host && host.querySelector("canvas");
  if (!canvas) return;
  const mode = { a: 0, b: 1, c: 2 }[host.dataset.field] || 0;
  // phones (coarse pointer) get one still frame too: a continuous shader costs battery and main-thread time there
  const still = matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches;
  const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"; // glsl
  // glsl
  const FRAG = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;uniform float k;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 q=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*n(p);p=q*p;a*=.5;}return v;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*r)/r.y;
  float T=t*.03;
  vec2 mo=(m-.5*r)/r.y;
  vec2 w=uv+.06*(mo-uv)*exp(-2.5*length(uv-mo));
  vec2 q=vec2(fbm(w*1.2+vec2(0.,T)),fbm(w*1.2+vec2(5.2,1.3)-T));
  vec2 s=vec2(fbm(w*1.4+2.*q+vec2(1.7,9.2)+.6*T),fbm(w*1.4+2.*q+vec2(8.3,2.8)-.5*T));
  float f=fbm(w*1.1+2.2*s);
  vec3 ground=vec3(.027,.039,.059);
  vec3 slate=vec3(.075,.105,.15);
  vec3 warm=vec3(.953,.592,.196);
  vec3 c=mix(ground,slate,smoothstep(.25,1.,f)*.8);
  float silk=pow(1.-abs(sin(f*7.+T*3.)),12.);
  c+=vec3(.55,.6,.68)*silk*.05*smoothstep(.45,.9,f);
  vec2 g=k<.5?vec2(.55,.25):(k<1.5?vec2(0.,.45):vec2(.42,0.));
  float glow=exp(-2.2*length((uv-g)*vec2(.8,1.1)));
  c+=warm*glow*(.06+.07*smoothstep(.4,.9,s.y));
  if(k<.5){vec2 gp=fract(gl_FragCoord.xy/68.);float line=step(gp.x,.016)+step(gp.y,.016);c+=vec3(.05,.07,.1)*min(line,1.)*.35*f;}
  float v=1.-.45*dot(uv*vec2(.55,1.),uv*vec2(.55,1.));
  c*=v;
  c+=(h(gl_FragCoord.xy+fract(t))-.5)*.01;
  gl_FragColor=vec4(c,1.);
}`;
  const start = () => { try {
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error("link");
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(pr, n), uR = U("r"), uT = U("t"), uM = U("m"), uK = U("k");
    gl.uniform1f(uK, mode);
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const size = () => { const b = host.getBoundingClientRect(); canvas.width = Math.max(1, Math.round(b.width * dpr * 0.75)); canvas.height = Math.max(1, Math.round(b.height * dpr * 0.75)); gl.viewport(0, 0, canvas.width, canvas.height); };
    size(); addEventListener("resize", size, { passive: true });
    const mouse = { x: 0.6, y: 0.6, tx: 0.6, ty: 0.6 };
    addEventListener("pointermove", (e) => { const b = host.getBoundingClientRect(); mouse.tx = (e.clientX - b.left) / b.width; mouse.ty = 1 - (e.clientY - b.top) / b.height; }, { passive: true });
    let clock = 8, last = performance.now(), visible = true, slow = 0, frames = 0, raf = 0, stopped = false;
    const draw = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.04; mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, clock); gl.uniform2f(uM, mouse.x * canvas.width, mouse.y * canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now) => {
      const dt = Math.min(now - last, 100); last = now; clock += dt / 1000;
      if (++frames > 4 && dt > 40) slow++; // watchdog: frames over a ~25 fps budget
      if (slow > 6) { stopped = true; cancelAnimationFrame(raf); return; }
      draw();
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    draw(); canvas.classList.add("on");
    if (still) return;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !stopped) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } }).observe(host);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && visible && !stopped) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } });
  } catch (e) { canvas.remove(); } };
  const idle = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 2000 }) : setTimeout(start, 600));
  if (document.readyState === "complete") idle(); else addEventListener("load", idle, { once: true });
})();
