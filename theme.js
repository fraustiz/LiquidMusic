// LiquidMusic — theme.js
// 1. Light/dark mode (auto follows Windows)  2. Blurred artwork backdrop  3. Accent colour from the album art.
// The colour helpers below are pure and unit-tested (tests/color.test.js); the runtime only runs inside Spotify.
// Kawarp 1.3.1 (https://github.com/better-lyrics/kawarp, MIT licence, (c) Better Lyrics), bundled as is so the theme
// stays a single file with no build step. To update: npm pack @kawarp/core, then
// npx esbuild dist/index.js --minify --format=iife --global-name=__lmK, and replace the line below.
if (typeof window !== "undefined") window.__lmKawarp = (function () {
var __lmK=(()=>{var _=Object.defineProperty;var v=Object.getOwnPropertyDescriptor;var E=Object.getOwnPropertyNames;var F=Object.prototype.hasOwnProperty;var b=(h,e)=>{for(var i in e)_(h,i,{get:e[i],enumerable:!0})},S=(h,e,i,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of E(e))!F.call(h,r)&&r!==i&&_(h,r,{get:()=>e[r],enumerable:!(t=v(e,r))||t.enumerable});return h};var R=h=>S(_({},"__esModule",{value:!0}),h);var O={};b(O,{Kawarp:()=>T,default:()=>C});const f={sampleWidth:128,sampleHeight:72,downsampleFactor:2,frameRate:0,smoothing:0},A=.25,I=8,c=(h,e,i,t)=>typeof h=="number"&&Number.isFinite(h)?Math.min(t,Math.max(i,h)):e,x=h=>"naturalWidth"in h?[h.naturalWidth,h.naturalHeight]:"videoWidth"in h?[h.videoWidth,h.videoHeight]:"displayWidth"in h?[h.displayWidth,h.displayHeight]:[h.width,h.height],d=`
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`,P=`
  precision highp float;
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform float u_offset;
  varying vec2 v_texCoord;

  void main() {
    highp vec2 texelSize = 1.0 / u_resolution;
    highp vec4 color = vec4(0.0);

    color += texture2D(u_texture, v_texCoord + vec2(-u_offset, -u_offset) * texelSize);
    color += texture2D(u_texture, v_texCoord + vec2(u_offset, -u_offset) * texelSize);
    color += texture2D(u_texture, v_texCoord + vec2(-u_offset, u_offset) * texelSize);
    color += texture2D(u_texture, v_texCoord + vec2(u_offset, u_offset) * texelSize);

    gl_FragColor = color * 0.25;
  }
`,B=`
  precision highp float;
  uniform sampler2D u_texture1;
  uniform sampler2D u_texture2;
  uniform float u_blend;
  varying vec2 v_texCoord;

  void main() {
    vec4 color1 = texture2D(u_texture1, v_texCoord);
    vec4 color2 = texture2D(u_texture2, v_texCoord);
    gl_FragColor = mix(color1, color2, u_blend);
  }
`,w=`
  precision highp float;
  uniform sampler2D u_texture;
  uniform vec3 u_tintColor;
  uniform float u_tintIntensity;
  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    // darkMask: 1.0 for black, 0.0 for luma >= 0.5
    float darkMask = 1.0 - smoothstep(0.0, 0.5, luma);

    // Blend dark areas toward tint color
    color.rgb = mix(color.rgb, u_tintColor, darkMask * u_tintIntensity);

    gl_FragColor = color;
  }
`,y=`
  precision highp float;
  uniform sampler2D u_texture;
  uniform float u_time;
  uniform float u_intensity;
  varying vec2 v_texCoord;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = v_texCoord;
    float t = u_time * 0.05;

    vec2 center = uv - 0.5;
    float centerWeight = 1.0 - smoothstep(0.0, 0.7, length(center));

    // Large-scale movement (slow, big blobs)
    float n1 = snoise(uv * 0.35 + vec2(t, t * 0.7));
    float n2 = snoise(uv * 0.35 + vec2(-t * 0.8, t * 0.5) + vec2(50.0, 50.0));

    // Medium-scale detail (adds organic movement)
    float n3 = snoise(uv * 0.9 + vec2(t * 1.2, -t) + vec2(100.0, 0.0));
    float n4 = snoise(uv * 0.9 + vec2(-t, t * 1.1) + vec2(0.0, 100.0));

    // Combine two octaves
    vec2 warp = vec2(
      n1 * 0.65 + n3 * 0.35,
      n2 * 0.65 + n4 * 0.35
    ) * centerWeight;

    vec2 warpedUV = uv + warp * u_intensity;
    warpedUV = clamp(warpedUV, 0.0, 1.0);

    gl_FragColor = texture2D(u_texture, warpedUV);
  }
`,U=`
  precision highp float;
  uniform sampler2D u_texture;
  uniform float u_saturation;
  uniform float u_dithering;
  uniform float u_time;
  uniform float u_scale;
  uniform vec2 u_resolution;
  varying vec2 v_texCoord;

  highp float hash(highp vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec2 uv = (v_texCoord - 0.5) / u_scale + 0.5;
    uv = clamp(uv, 0.0, 1.0);

    vec4 color = texture2D(u_texture, uv);

    vec2 center = v_texCoord - 0.5;
    float vignette = 1.0 - dot(center, center) * 0.3;
    color.rgb *= vignette;

    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(vec3(gray), color.rgb, u_saturation);

    highp vec2 pixelPos = floor(v_texCoord * u_resolution);
    highp float noise = hash(vec3(pixelPos, floor(u_time * 60.0)));
    color.rgb += (noise - 0.5) * u_dithering;

    gl_FragColor = color;
  }
`,L=`
  precision highp float;
  uniform sampler2D u_texture;
  uniform vec2 u_texelSize;
  varying vec2 v_texCoord;

  void main() {
    vec2 offset = u_texelSize * 0.25;
    gl_FragColor = 0.25 * (
      texture2D(u_texture, v_texCoord + vec2(-offset.x, -offset.y)) +
      texture2D(u_texture, v_texCoord + vec2(offset.x, -offset.y)) +
      texture2D(u_texture, v_texCoord + vec2(-offset.x, offset.y)) +
      texture2D(u_texture, v_texCoord + vec2(offset.x, offset.y))
    );
  }
`,D=`
  precision highp float;
  uniform sampler2D u_texture;
  uniform sampler2D u_history;
  uniform float u_response;
  uniform float u_minStep;
  varying vec2 v_texCoord;

  void main() {
    vec4 history = texture2D(u_history, v_texCoord);
    vec4 current = texture2D(u_texture, v_texCoord);
    vec4 blended = mix(history, current, u_response);
    vec4 remaining = current - history;
    vec4 minimal = history + sign(remaining) * min(abs(remaining), vec4(u_minStep));
    gl_FragColor = mix(
      minimal,
      blended,
      step(abs(minimal - history), abs(blended - history))
    );
  }
`;class T{canvas;gl;halfFloatExt=null;halfFloatLinearExt=null;blurProgram;blendProgram;tintProgram;warpProgram;outputProgram;positionBuffer;texCoordBuffer;sourceTexture;blurFBO1;blurFBO2;currentAlbumFBO;nextAlbumFBO;warpFBO;animationId=null;lastFrameTime=0;accumulatedTime=0;isPlaying=!1;disposed=!1;isTransitioning=!1;transitionStartTime=0;_transitionDuration;_warpIntensity;_blurPasses;_animationSpeed;_targetAnimationSpeed;_saturation;_tintColor;_tintIntensity;_dithering;_scale;hasImage=!1;gl2;halfFloatRenderTargets=!1;float32RenderTargets=!1;floatLinearFiltering=!1;_highPrecisionOutput=!1;highPrecisionInputRequested;activeSourceTexture;imageSourceWidth=0;imageSourceHeight=0;videoFrameWidth=0;videoFrameHeight=0;video=null;videoLoadCount=0;shownVideoLoad=0;videoOptions={...f};videoCallbackId=null;videoUploadTexture=null;videoStages=[];videoHistory=[];videoHistoryIndex=0;hasVideoHistory=!1;videoSmoothingTarget=null;videoSmoothingTargetAt=0;videoSmoothedAt=0;videoHistoryStep=0;videoSampleSlot=Number.NEGATIVE_INFINITY;videoTargetsStale=!0;videoSourceWidth=0;videoSourceHeight=0;videoFrameTime=0;videoMediaTime=0;videoFrameShown=!1;videoFramePending=!1;retainedVideoFrame=null;samplingPrograms=null;sampleTargets=[];sampleTargetsLayout=[0,0,0];pendingSampleSize=0;samplePixelBuffer=null;pendingSample=null;attribs;uniforms;constructor(e,i={}){this.canvas=e;const t={alpha:!0,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!0,powerPreference:"high-performance"},r=i.highPrecisionInput||i.highPrecisionOutput?e.getContext("webgl2",t):null,s=r??e.getContext("webgl",t);if(!s)throw new Error("WebGL not supported");this.gl=s,this.gl2=r,this.highPrecisionInputRequested=!!r&&!!i.highPrecisionInput,this.halfFloatExt=s.getExtension("OES_texture_half_float"),this.halfFloatLinearExt=s.getExtension("OES_texture_half_float_linear"),r&&(this.float32RenderTargets=!!r.getExtension("EXT_color_buffer_float"),this.halfFloatRenderTargets=this.float32RenderTargets||!!r.getExtension("EXT_color_buffer_half_float"),this.floatLinearFiltering=!!r.getExtension("OES_texture_float_linear")),this._warpIntensity=i.warpIntensity??1,this._blurPasses=i.blurPasses??8,this._animationSpeed=i.animationSpeed??1,this._targetAnimationSpeed=this._animationSpeed,this._transitionDuration=i.transitionDuration??1e3,this._saturation=i.saturation??1.5,this._tintColor=i.tintColor??[.157,.157,.235],this._tintIntensity=i.tintIntensity??.15,this._dithering=i.dithering??.008,this._scale=i.scale??1,this.blurProgram=this.createProgram(d,P),this.blendProgram=this.createProgram(d,B),this.tintProgram=this.createProgram(d,w),this.warpProgram=this.createProgram(d,y),this.outputProgram=this.createProgram(d,U),this.attribs={position:s.getAttribLocation(this.blurProgram,"a_position"),texCoord:s.getAttribLocation(this.blurProgram,"a_texCoord")},this.uniforms={blur:{resolution:s.getUniformLocation(this.blurProgram,"u_resolution"),texture:s.getUniformLocation(this.blurProgram,"u_texture"),offset:s.getUniformLocation(this.blurProgram,"u_offset")},blend:{texture1:s.getUniformLocation(this.blendProgram,"u_texture1"),texture2:s.getUniformLocation(this.blendProgram,"u_texture2"),blend:s.getUniformLocation(this.blendProgram,"u_blend")},warp:{texture:s.getUniformLocation(this.warpProgram,"u_texture"),time:s.getUniformLocation(this.warpProgram,"u_time"),intensity:s.getUniformLocation(this.warpProgram,"u_intensity")},tint:{texture:s.getUniformLocation(this.tintProgram,"u_texture"),tintColor:s.getUniformLocation(this.tintProgram,"u_tintColor"),tintIntensity:s.getUniformLocation(this.tintProgram,"u_tintIntensity")},output:{texture:s.getUniformLocation(this.outputProgram,"u_texture"),saturation:s.getUniformLocation(this.outputProgram,"u_saturation"),dithering:s.getUniformLocation(this.outputProgram,"u_dithering"),time:s.getUniformLocation(this.outputProgram,"u_time"),scale:s.getUniformLocation(this.outputProgram,"u_scale"),resolution:s.getUniformLocation(this.outputProgram,"u_resolution")}},this.positionBuffer=this.createBuffer(new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1])),this.texCoordBuffer=this.createBuffer(new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1])),this.sourceTexture=this.createTexture(),this.activeSourceTexture=this.sourceTexture,this.blurFBO1=this.createFramebuffer(128,128,!0),this.blurFBO2=this.createFramebuffer(128,128,!0),this.currentAlbumFBO=this.createFramebuffer(128,128,!0),this.nextAlbumFBO=this.createFramebuffer(128,128,!0);const a=Math.max(1,e.width||640),n=Math.max(1,e.height||360);this.warpFBO=this.createFramebuffer(a,n,!0),i.highPrecisionOutput&&this.applyFloatDrawingBuffer()}get highPrecisionOutput(){return this._highPrecisionOutput}get highPrecisionInput(){return this.highPrecisionInputRequested&&this.float32RenderTargets}get warpIntensity(){return this._warpIntensity}set warpIntensity(e){this._warpIntensity=Math.max(0,Math.min(1,e))}get blurPasses(){return this._blurPasses}set blurPasses(e){const i=Math.max(0,Math.min(40,Math.floor(e)));i!==this._blurPasses&&(this._blurPasses=i,this.hasImage&&this.reblurCurrentImage())}get animationSpeed(){return this._targetAnimationSpeed}set animationSpeed(e){this._targetAnimationSpeed=Math.max(0,Math.min(16,e))}get transitionDuration(){return this._transitionDuration}set transitionDuration(e){this._transitionDuration=Math.max(0,Math.min(5e3,e))}get saturation(){return this._saturation}set saturation(e){this._saturation=Math.max(0,Math.min(3,e))}get tintColor(){return this._tintColor}set tintColor(e){const i=e.map(r=>Math.max(0,Math.min(1,r)));i.some((r,s)=>r!==this._tintColor[s])&&(this._tintColor=i,this.hasImage&&this.reblurCurrentImage())}get tintIntensity(){return this._tintIntensity}set tintIntensity(e){const i=Math.max(0,Math.min(1,e));i!==this._tintIntensity&&(this._tintIntensity=i,this.hasImage&&this.reblurCurrentImage())}get dithering(){return this._dithering}set dithering(e){this._dithering=Math.max(0,Math.min(.1,e))}get scale(){return this._scale}set scale(e){this._scale=Math.max(.01,Math.min(4,e))}setOptions(e){e.warpIntensity!==void 0&&(this.warpIntensity=e.warpIntensity),e.blurPasses!==void 0&&(this.blurPasses=e.blurPasses),e.animationSpeed!==void 0&&(this.animationSpeed=e.animationSpeed),e.transitionDuration!==void 0&&(this.transitionDuration=e.transitionDuration),e.saturation!==void 0&&(this.saturation=e.saturation),e.tintColor!==void 0&&(this.tintColor=e.tintColor),e.tintIntensity!==void 0&&(this.tintIntensity=e.tintIntensity),e.dithering!==void 0&&(this.dithering=e.dithering),e.scale!==void 0&&(this.scale=e.scale)}getOptions(){return{warpIntensity:this._warpIntensity,blurPasses:this._blurPasses,animationSpeed:this._targetAnimationSpeed,transitionDuration:this._transitionDuration,saturation:this._saturation,tintColor:this._tintColor,tintIntensity:this._tintIntensity,dithering:this._dithering,scale:this._scale}}async loadImage(e){if(!e)return;const i=this.videoLoadCount;let t=null;try{const a=await fetch(e,{mode:"cors"});if(a.ok){const n=await a.blob();t=await createImageBitmap(n)}}catch{}if(t||(t=await new Promise((a,n)=>{const o=new Image;o.crossOrigin="anonymous",o.onload=()=>a(o),o.onerror=()=>n(new Error(`Failed to load image: ${e}`)),o.src=e})),this.disposed||this.shownVideoLoad>i){"close"in t&&t.close();return}const r=!!this.video&&this.videoLoadCount!==i,s=this.gl;s.bindTexture(s.TEXTURE_2D,this.sourceTexture),s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,0),s.texImage2D(s.TEXTURE_2D,0,s.RGBA,s.RGBA,s.UNSIGNED_BYTE,t),[this.imageSourceWidth,this.imageSourceHeight]=x(t),"close"in t&&typeof t.close=="function"&&t.close(),this.processNewImage(this.sourceTexture,r)}loadImageElement(e){this.showImageElement(e,!1)}showImageElement(e,i){this.gl.bindTexture(this.gl.TEXTURE_2D,this.sourceTexture),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e),[this.imageSourceWidth,this.imageSourceHeight]=x(e),this.processNewImage(this.sourceTexture,i)}loadImageData(e,i,t){this.gl.bindTexture(this.gl.TEXTURE_2D,this.sourceTexture),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,i,t,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e instanceof Uint8ClampedArray?new Uint8Array(e.buffer):e),this.imageSourceWidth=i,this.imageSourceHeight=t,this.processNewImage()}loadFromImageData(e){this.loadImageData(e.data,e.width,e.height)}async loadBlob(e){const i=this.videoLoadCount,t=await createImageBitmap(e);if(this.disposed||this.shownVideoLoad>i){t.close();return}const r=!!this.video&&this.videoLoadCount!==i;this.showImageElement(t,r),t.close()}loadBase64(e){const i=e.startsWith("data:")?e:`data:image/png;base64,${e}`;return this.loadImage(i)}async loadArrayBuffer(e,i="image/png"){const t=new Blob([e],{type:i});return this.loadBlob(t)}loadGradient(e,i=135){const r=document.createElement("canvas");r.width=512,r.height=512;const s=r.getContext("2d");if(!s)return;const a=i*Math.PI/180,n=512/2-Math.cos(a)*512,o=512/2-Math.sin(a)*512,l=512/2+Math.cos(a)*512,u=512/2+Math.sin(a)*512,m=s.createLinearGradient(n,o,l,u);e.forEach((g,p)=>{m.addColorStop(p/(e.length-1),g)}),s.fillStyle=m,s.fillRect(0,0,512,512),this.loadImageElement(r)}loadVideo(e,i={}){if(this.disposed)return;if(typeof e.requestVideoFrameCallback!="function")throw new Error("Video sources require requestVideoFrameCallback");const t=this.video!==e;t&&(this.videoLoadCount++,this.unloadVideo(),this.video=e,this.videoFrameShown=!1,this.hasVideoHistory=!1,this.videoSampleSlot=Number.NEGATIVE_INFINITY);const r={sampleWidth:Math.round(c(i.sampleWidth,f.sampleWidth,1,1024)),sampleHeight:Math.round(c(i.sampleHeight,f.sampleHeight,1,1024)),downsampleFactor:c(i.downsampleFactor,f.downsampleFactor,1.25,4),frameRate:c(i.frameRate,f.frameRate,0,240),smoothing:c(i.smoothing,f.smoothing,0,1e4),onError:i.onError},s=this.videoOptions;(t||r.sampleWidth!==s.sampleWidth||r.sampleHeight!==s.sampleHeight||r.downsampleFactor!==s.downsampleFactor||r.smoothing>0!=s.smoothing>0)&&(this.videoTargetsStale=!0),this.videoOptions=r,this.requestVideoFrame(),e.readyState>=e.HAVE_CURRENT_DATA&&(t||e.paused&&this.videoTargetsStale)&&this.processVideoFrame(performance.now(),e.currentTime)}unloadVideo(){const e=this.video;e&&(this.videoCallbackId!==null&&(e.cancelVideoFrameCallback(this.videoCallbackId),this.videoCallbackId=null),e.removeEventListener("pause",this.resumeVideoCallbacks),this.video=null,this.videoFramePending=!1,this.releaseVideoTargets(),this.videoUploadTexture&&(this.gl.deleteTexture(this.videoUploadTexture),this.videoUploadTexture=null))}sampleSource(e=32){if(this.disposed||!this.hasImage)return Promise.resolve(null);const i=Math.round(c(e,32,1,128));if(this.pendingSample)return this.pendingSampleSize===i?this.pendingSample:this.pendingSample.then(()=>this.sampleSource(i));const t=this.gl,[r,s]=this.activeSourceTexture===this.sourceTexture?[this.imageSourceWidth,this.imageSourceHeight]:[this.videoFrameWidth,this.videoFrameHeight];this.prepareSampleTargets(r,s,i);let a=this.activeSourceTexture;for(const m of this.sampleTargets)this.drawDownsample(a,m),a=m.texture;const n=new Uint8Array(i*i*4),o=this.gl2;if(!o)return t.readPixels(0,0,i,i,t.RGBA,t.UNSIGNED_BYTE,n),Promise.resolve(n);this.samplePixelBuffer??=o.createBuffer(),o.bindBuffer(o.PIXEL_PACK_BUFFER,this.samplePixelBuffer),o.bufferData(o.PIXEL_PACK_BUFFER,n.byteLength,o.STREAM_READ),o.readPixels(0,0,i,i,o.RGBA,o.UNSIGNED_BYTE,0),o.bindBuffer(o.PIXEL_PACK_BUFFER,null);const l=o.fenceSync(o.SYNC_GPU_COMMANDS_COMPLETE,0);if(!l)return Promise.resolve(null);o.flush();const u=new Promise(m=>{const g=()=>{if(this.disposed){o.deleteSync(l),m(null);return}const p=o.clientWaitSync(l,0,0);if(p===o.TIMEOUT_EXPIRED){setTimeout(g,4);return}if(o.deleteSync(l),p===o.WAIT_FAILED){m(null);return}o.bindBuffer(o.PIXEL_PACK_BUFFER,this.samplePixelBuffer),o.getBufferSubData(o.PIXEL_PACK_BUFFER,0,n),o.bindBuffer(o.PIXEL_PACK_BUFFER,null),m(n)};setTimeout(g,0)}).finally(()=>{this.pendingSample=null});return this.pendingSample=u,this.pendingSampleSize=i,u}prepareSampleTargets(e,i,t){const[r,s,a]=this.sampleTargetsLayout;if(e===r&&i===s&&t===a)return;for(const l of this.sampleTargets)this.deleteFramebuffer(l);this.sampleTargets=[];let n=e,o=i;for(;n>t*2||o>t*2;)n=Math.max(t,Math.ceil(n/2)),o=Math.max(t,Math.ceil(o/2)),this.sampleTargets.push(this.createByteFramebuffer(n,o));this.sampleTargets.push(this.createByteFramebuffer(t,t)),this.sampleTargetsLayout=[e,i,t]}createByteFramebuffer(e,i){return this.gl2?this.createSizedFramebuffer(e,i,this.gl2.RGBA8):this.createFramebuffer(e,i)}requestVideoFrame(){!this.video||this.videoCallbackId!==null||(this.videoCallbackId=this.video.requestVideoFrameCallback(this.handleVideoFrame))}handleVideoFrame=(e,i)=>{this.videoCallbackId=null;const t=this.video;if(!t||this.disposed)return;if(!this.isPlaying&&!t.paused){this.videoFramePending=!0,t.addEventListener("pause",this.resumeVideoCallbacks,{once:!0});return}this.requestVideoFrame();const{frameRate:r}=this.videoOptions;if(r>0&&!t.paused){const s=1e3/r;if(e<this.videoSampleSlot+s*.75)return}this.processVideoFrame(e,i.mediaTime)};resumeVideoCallbacks=()=>{this.requestVideoFrame()};processVideoFrame(e,i){const t=this.video;if(!t||t.readyState<t.HAVE_CURRENT_DATA||t.videoWidth===0||t.videoHeight===0)return;const r=this.gl,s=e-this.videoFrameTime;try{this.prepareVideoTargets(t.videoWidth,t.videoHeight),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.videoUploadTexture),r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,!0),r.texImage2D(r.TEXTURE_2D,0,r.RGBA,r.RGBA,r.UNSIGNED_BYTE,t)}catch(u){const{onError:m}=this.videoOptions;this.unloadVideo(),m?.(u);return}finally{r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,!1)}let a=this.videoUploadTexture;for(const u of this.videoStages)this.drawDownsample(a,u),a=u.texture;const{smoothing:n}=this.videoOptions;let o=!1;if(n>0){const u=s/1e3*t.playbackRate,m=Math.abs(i-this.videoMediaTime-u)>A;!this.hasVideoHistory||!this.videoFrameShown||!this.isPlaying||t.paused||m?(a=this.drawSmoothing(a,1),this.videoSmoothingTarget=null):(this.videoSmoothingTarget||(this.videoSmoothedAt=e),this.videoSmoothingTarget=a,this.videoSmoothingTargetAt=e,o=!0),this.hasVideoHistory=!0}else this.hasVideoHistory=!1;const{frameRate:l}=this.videoOptions;if(l>0){const u=1e3/l;this.videoSampleSlot=e-this.videoSampleSlot>u*2?e:this.videoSampleSlot+u}this.videoFrameTime=e,this.videoMediaTime=i,this.videoFrameWidth=this.videoOptions.sampleWidth,this.videoFrameHeight=this.videoOptions.sampleHeight,o||this.showVideoFrame(a)}advanceVideoSmoothing(e){const i=this.videoSmoothingTarget;if(!i)return;const{smoothing:t}=this.videoOptions,r=e-this.videoSmoothingTargetAt>=t*I,s=Math.max(0,e-this.videoSmoothedAt);this.videoSmoothedAt=e;const a=r?1:1-Math.exp(-s/t);this.activeSourceTexture=this.drawSmoothing(i,a),this.releaseRetainedVideoFrame(),this.blurSourceInto(this.nextAlbumFBO),r&&(this.videoSmoothingTarget=null)}showVideoFrame(e){this.videoFrameShown?(this.activeSourceTexture=e,this.releaseRetainedVideoFrame(),this.blurSourceInto(this.nextAlbumFBO)):(this.videoFrameShown=!0,this.shownVideoLoad=this.videoLoadCount,this.processNewImage(e),this.isPlaying||(this.isTransitioning=!1)),this.isPlaying||this.render(this.accumulatedTime)}prepareVideoTargets(e,i){if(!this.videoTargetsStale&&e===this.videoSourceWidth&&i===this.videoSourceHeight)return;this.releaseVideoTargets(),this.videoUploadTexture??=this.createTexture();const{sampleWidth:t,sampleHeight:r,downsampleFactor:s,smoothing:a}=this.videoOptions;let n=e,o=i;for(;n>t*s||o>r*s;){const l=Math.max(t,Math.ceil(n/s)),u=Math.max(r,Math.ceil(o/s));if(l===n&&u===o)break;n=l,o=u,this.videoStages.push(this.createFramebuffer(n,o,!0))}if(this.videoStages.push(this.createFramebuffer(t,r,!0)),a>0){const l=this.highPrecisionInputRequested&&this.float32RenderTargets;for(let m=0;m<2;m++)this.videoHistory.push(this.gl2&&l?this.createSizedFramebuffer(t,r,this.gl2.RGBA32F):this.createFramebuffer(t,r,!0));const u=this.gl2?this.halfFloatRenderTargets:!!(this.halfFloatExt&&this.halfFloatLinearExt);this.videoHistoryStep=l?this.float32RenderTargets?0:1/255:u?1/1024:1/255}this.hasVideoHistory=!1,this.videoSourceWidth=e,this.videoSourceHeight=i,this.videoTargetsStale=!1}releaseVideoTargets(){for(const e of[...this.videoStages,...this.videoHistory])e.texture===this.activeSourceTexture?(this.releaseRetainedVideoFrame(),this.retainedVideoFrame=e):this.deleteFramebuffer(e);this.videoStages=[],this.videoHistory=[],this.videoSmoothingTarget=null,this.videoTargetsStale=!0}releaseRetainedVideoFrame(){!this.retainedVideoFrame||this.retainedVideoFrame.texture===this.activeSourceTexture||(this.deleteFramebuffer(this.retainedVideoFrame),this.retainedVideoFrame=null)}getSamplingPrograms(){if(this.samplingPrograms)return this.samplingPrograms;const e=this.gl,i=this.createProgram(d,L),t=this.createProgram(d,D);return this.samplingPrograms={downsample:i,smoothing:t,downsampleUniforms:{texture:e.getUniformLocation(i,"u_texture"),texelSize:e.getUniformLocation(i,"u_texelSize")},smoothingUniforms:{texture:e.getUniformLocation(t,"u_texture"),history:e.getUniformLocation(t,"u_history"),response:e.getUniformLocation(t,"u_response"),minStep:e.getUniformLocation(t,"u_minStep")}},this.samplingPrograms}drawDownsample(e,i){const t=this.gl,r=this.getSamplingPrograms();t.useProgram(r.downsample),this.setupAttributes(),t.bindFramebuffer(t.FRAMEBUFFER,i.framebuffer),t.viewport(0,0,i.width,i.height),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,e),t.uniform1i(r.downsampleUniforms.texture,0),t.uniform2f(r.downsampleUniforms.texelSize,1/i.width,1/i.height),t.drawArrays(t.TRIANGLES,0,6)}drawSmoothing(e,i){const t=this.gl,r=this.getSamplingPrograms(),s=this.videoHistory[this.videoHistoryIndex];this.videoHistoryIndex=1-this.videoHistoryIndex;const a=this.videoHistory[this.videoHistoryIndex];return!s||!a?e:(t.useProgram(r.smoothing),this.setupAttributes(),t.bindFramebuffer(t.FRAMEBUFFER,a.framebuffer),t.viewport(0,0,a.width,a.height),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,s.texture),t.uniform1i(r.smoothingUniforms.history,1),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,e),t.uniform1i(r.smoothingUniforms.texture,0),t.uniform1f(r.smoothingUniforms.response,i),t.uniform1f(r.smoothingUniforms.minStep,this.videoHistoryStep),t.drawArrays(t.TRIANGLES,0,6),a.texture)}processNewImage(e=this.sourceTexture,i=!1){if(e===this.sourceTexture&&!i&&this.unloadVideo(),this.activeSourceTexture=e,this.releaseRetainedVideoFrame(),!this.hasImage){this.blurSourceInto(this.nextAlbumFBO),this.blurSourceInto(this.currentAlbumFBO),this.hasImage=!0,this.isTransitioning=!1;return}const t=this.currentAlbumFBO;this.currentAlbumFBO=this.nextAlbumFBO,this.nextAlbumFBO=t,this.blurSourceInto(this.nextAlbumFBO),this.isTransitioning=!0,this.transitionStartTime=performance.now()}reblurCurrentImage(){this.blurSourceInto(this.nextAlbumFBO)}blurSourceInto(e){const i=this.gl;i.useProgram(this.tintProgram),this.setupAttributes(),i.bindFramebuffer(i.FRAMEBUFFER,this.blurFBO1.framebuffer),i.viewport(0,0,128,128),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.activeSourceTexture),i.uniform1i(this.uniforms.tint.texture,0),i.uniform3fv(this.uniforms.tint.tintColor,this._tintColor),i.uniform1f(this.uniforms.tint.tintIntensity,this._tintIntensity),i.drawArrays(i.TRIANGLES,0,6),i.useProgram(this.blurProgram),this.setupAttributes(),i.uniform2f(this.uniforms.blur.resolution,128,128),i.uniform1i(this.uniforms.blur.texture,0);let t=this.blurFBO1,r=this.blurFBO2;for(let s=0;s<this._blurPasses;s++){i.bindFramebuffer(i.FRAMEBUFFER,r.framebuffer),i.viewport(0,0,128,128),i.bindTexture(i.TEXTURE_2D,t.texture),i.uniform1f(this.uniforms.blur.offset,s+.5),i.drawArrays(i.TRIANGLES,0,6);const a=t;t=r,r=a}i.bindFramebuffer(i.FRAMEBUFFER,e.framebuffer),i.viewport(0,0,128,128),i.bindTexture(i.TEXTURE_2D,t.texture),i.uniform1f(this.uniforms.blur.offset,0),i.drawArrays(i.TRIANGLES,0,6)}resize(){const e=Math.max(1,this.canvas.width),i=Math.max(1,this.canvas.height);(this.warpFBO.width!==e||this.warpFBO.height!==i)&&(this.warpFBO&&this.deleteFramebuffer(this.warpFBO),this.warpFBO=this.createFramebuffer(e,i,!0))}start(){this.disposed||this.isPlaying||(this.isPlaying=!0,this.lastFrameTime=performance.now(),this.video&&(this.video.removeEventListener("pause",this.resumeVideoCallbacks),this.requestVideoFrame(),this.videoFramePending&&(this.videoFramePending=!1,this.processVideoFrame(this.lastFrameTime,this.video.currentTime))),this.animationId=requestAnimationFrame(this.renderLoop))}stop(){this.isPlaying=!1,this.animationId!==null&&(cancelAnimationFrame(this.animationId),this.animationId=null)}renderFrame(e){const i=performance.now();if(e!==void 0)this.render(e,i);else{const t=(i-this.lastFrameTime)/1e3;this.lastFrameTime=i,this._animationSpeed+=(this._targetAnimationSpeed-this._animationSpeed)*.05,this.accumulatedTime+=t*this._animationSpeed,this.render(this.accumulatedTime,i)}}dispose(){if(this.disposed)return;this.disposed=!0,this.stop(),this.unloadVideo();const e=this.gl;this.retainedVideoFrame&&this.deleteFramebuffer(this.retainedVideoFrame);for(const i of this.sampleTargets)this.deleteFramebuffer(i);this.samplingPrograms&&(e.deleteProgram(this.samplingPrograms.downsample),e.deleteProgram(this.samplingPrograms.smoothing)),this.gl2?.deleteBuffer(this.samplePixelBuffer),e.deleteProgram(this.blurProgram),e.deleteProgram(this.blendProgram),e.deleteProgram(this.tintProgram),e.deleteProgram(this.warpProgram),e.deleteProgram(this.outputProgram),e.deleteBuffer(this.positionBuffer),e.deleteBuffer(this.texCoordBuffer),e.deleteTexture(this.sourceTexture),this.deleteFramebuffer(this.blurFBO1),this.deleteFramebuffer(this.blurFBO2),this.deleteFramebuffer(this.currentAlbumFBO),this.deleteFramebuffer(this.nextAlbumFBO),this.deleteFramebuffer(this.warpFBO)}renderLoop=e=>{if(!this.isPlaying)return;const i=(e-this.lastFrameTime)/1e3;this.lastFrameTime=e,this._animationSpeed+=(this._targetAnimationSpeed-this._animationSpeed)*.05,this.accumulatedTime+=i*this._animationSpeed,this.render(this.accumulatedTime,e),this.animationId=requestAnimationFrame(this.renderLoop)};render(e,i=performance.now()){if(this.disposed||!this.hasImage)return;this.advanceVideoSmoothing(i);const t=this.gl,r=Math.max(1,this.canvas.width),s=Math.max(1,this.canvas.height);(this.warpFBO.width!==r||this.warpFBO.height!==s)&&(this.deleteFramebuffer(this.warpFBO),this.warpFBO=this.createFramebuffer(r,s,!0));let a=1;if(this.isTransitioning){const o=Math.max(0,i-this.transitionStartTime);a=this._transitionDuration>0?Math.min(1,o/this._transitionDuration):1,a>=1&&(this.isTransitioning=!1)}let n;if(this.isTransitioning&&a<1){t.useProgram(this.blendProgram),this.setupAttributes(),t.bindFramebuffer(t.FRAMEBUFFER,this.blurFBO1.framebuffer),t.viewport(0,0,128,128),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.currentAlbumFBO.texture),t.uniform1i(this.uniforms.blend.texture1,0),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.nextAlbumFBO.texture),t.uniform1i(this.uniforms.blend.texture2,1);const o=.5-.5*Math.cos(a*Math.PI);t.uniform1f(this.uniforms.blend.blend,o),t.drawArrays(t.TRIANGLES,0,6),n=this.blurFBO1.texture}else n=this.nextAlbumFBO.texture;t.useProgram(this.warpProgram),this.setupAttributes(),t.bindFramebuffer(t.FRAMEBUFFER,this.warpFBO.framebuffer),t.viewport(0,0,r,s),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,n),t.uniform1i(this.uniforms.warp.texture,0),t.uniform1f(this.uniforms.warp.time,e),t.uniform1f(this.uniforms.warp.intensity,this._warpIntensity),t.drawArrays(t.TRIANGLES,0,6),t.useProgram(this.outputProgram),this.setupAttributes(),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,r,s),t.bindTexture(t.TEXTURE_2D,this.warpFBO.texture),t.uniform1i(this.uniforms.output.texture,0),t.uniform1f(this.uniforms.output.saturation,this._saturation),t.uniform1f(this.uniforms.output.dithering,this._dithering),t.uniform1f(this.uniforms.output.time,e),t.uniform1f(this.uniforms.output.scale,this._scale),t.uniform2f(this.uniforms.output.resolution,r,s),t.drawArrays(t.TRIANGLES,0,6)}setupAttributes(){const e=this.gl;e.bindBuffer(e.ARRAY_BUFFER,this.positionBuffer),e.enableVertexAttribArray(this.attribs.position),e.vertexAttribPointer(this.attribs.position,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,this.texCoordBuffer),e.enableVertexAttribArray(this.attribs.texCoord),e.vertexAttribPointer(this.attribs.texCoord,2,e.FLOAT,!1,0,0)}createShader(e,i){const t=this.gl,r=t.createShader(e);if(!r)throw new Error("Failed to create shader");if(t.shaderSource(r,this.gl2&&e===t.FRAGMENT_SHADER?`precision highp sampler2D;
${i}`:i),t.compileShader(r),!t.getShaderParameter(r,t.COMPILE_STATUS)){const s=t.getShaderInfoLog(r);throw t.deleteShader(r),new Error(`Shader compile error: ${s}`)}return r}createProgram(e,i){const t=this.gl,r=this.createShader(t.VERTEX_SHADER,e),s=this.createShader(t.FRAGMENT_SHADER,i),a=t.createProgram();if(!a)throw new Error("Failed to create program");if(t.attachShader(a,r),t.attachShader(a,s),t.linkProgram(a),!t.getProgramParameter(a,t.LINK_STATUS)){const n=t.getProgramInfoLog(a);throw t.deleteProgram(a),new Error(`Program link error: ${n}`)}return t.deleteShader(r),t.deleteShader(s),a}createBuffer(e){const i=this.gl,t=i.createBuffer();if(!t)throw new Error("Failed to create buffer");return i.bindBuffer(i.ARRAY_BUFFER,t),i.bufferData(i.ARRAY_BUFFER,e,i.STATIC_DRAW),t}createTexture(){const e=this.gl,i=e.createTexture();if(!i)throw new Error("Failed to create texture");return e.bindTexture(e.TEXTURE_2D,i),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),i}createFramebuffer(e,i,t=!1){if(this.gl2)return this.createSizedFramebuffer(e,i,t&&this.halfFloatRenderTargets?this.gl2.RGBA16F:this.gl2.RGBA8);const r=this.gl,s=this.createTexture(),n=t&&this.halfFloatExt&&this.halfFloatLinearExt?this.halfFloatExt.HALF_FLOAT_OES:r.UNSIGNED_BYTE;r.texImage2D(r.TEXTURE_2D,0,r.RGBA,e,i,0,r.RGBA,n,null);const o=r.createFramebuffer();if(!o)throw new Error("Failed to create framebuffer");return r.bindFramebuffer(r.FRAMEBUFFER,o),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,s,0),{framebuffer:o,texture:s,width:e,height:i}}createSizedFramebuffer(e,i,t){const r=this.gl2,s=this.createTexture(),a=t===r.RGBA32F?r.FLOAT:t===r.RGBA16F?r.HALF_FLOAT:r.UNSIGNED_BYTE;t===r.RGBA32F&&!this.floatLinearFiltering&&(r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,r.NEAREST)),r.texImage2D(r.TEXTURE_2D,0,t,e,i,0,r.RGBA,a,null);const n=r.createFramebuffer();if(!n)throw new Error("Failed to create framebuffer");return r.bindFramebuffer(r.FRAMEBUFFER,n),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,s,0),t!==r.RGBA8&&r.checkFramebufferStatus(r.FRAMEBUFFER)!==r.FRAMEBUFFER_COMPLETE&&(t===r.RGBA32F?this.float32RenderTargets=!1:this.halfFloatRenderTargets=!1,r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.LINEAR),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,r.LINEAR),r.texImage2D(r.TEXTURE_2D,0,r.RGBA8,e,i,0,r.RGBA,r.UNSIGNED_BYTE,null)),{framebuffer:n,texture:s,width:e,height:i}}applyFloatDrawingBuffer(){const e=this.gl2;!e?.drawingBufferStorage||!this.halfFloatRenderTargets||(e.drawingBufferStorage(e.RGBA16F,Math.max(1,this.canvas.width),Math.max(1,this.canvas.height)),this._highPrecisionOutput=e.drawingBufferFormat===e.RGBA16F)}deleteFramebuffer(e){this.gl.deleteFramebuffer(e.framebuffer),this.gl.deleteTexture(e.texture)}}var C=T;return R(O);})();
	return __lmK.Kawarp;
})();

(function liquidMusic() {
	"use strict";

	const FALLBACK_ACCENT = { r: 250, g: 45, b: 72 }; // Apple Music red #FA2D48
	const CONTENT_BG = { dark: { r: 22, g: 22, b: 24 }, light: { r: 255, g: 255, b: 255 } };
	const MIN_CONTRAST = 4.5;
	const ON_ACCENT_WHITE_MIN = 3; // icons and semibold text on the accent, like Apple's white-on-red
	const PREFERENCE = {
		dark: ["VIBRANT", "LIGHT_VIBRANT", "PROMINENT", "DESATURATED"],
		light: ["DARK_VIBRANT", "VIBRANT", "PROMINENT"],
	};
	const WHITE = { r: 255, g: 255, b: 255 };
	const BLACK = { r: 0, g: 0, b: 0 };
	// The translucent layers between the artwork and the text (mirror the user.css tokens)
	const SURFACES = {
		dark: {
			scrim: { rgb: BLACK, alpha: 0.45 },
			content: { rgb: { r: 22, g: 22, b: 24 }, alpha: 0.62 },
			glass: { rgb: { r: 30, g: 30, b: 32 }, alpha: 0.55 },
			label2: { rgb: { r: 235, g: 235, b: 245 }, alpha: 0.6 },
		},
		light: {
			scrim: { rgb: WHITE, alpha: 0.5 },
			content: { rgb: WHITE, alpha: 0.68 },
			glass: { rgb: { r: 250, g: 250, b: 252 }, alpha: 0.6 },
			label2: { rgb: { r: 60, g: 60, b: 67 }, alpha: 0.6 },
		},
	};
	const LIQUID_SURFACES = {
		dark: {
			scrim: { rgb: BLACK, alpha: 0.45 },
			content: { rgb: { r: 22, g: 22, b: 24 }, alpha: 0.28 },
			glass: { rgb: { r: 30, g: 30, b: 32 }, alpha: 0.24 },
			label2: { rgb: { r: 235, g: 235, b: 245 }, alpha: 0.78 },
		},
		light: {
			scrim: { rgb: WHITE, alpha: 0.5 },
			content: { rgb: WHITE, alpha: 0.36 },
			glass: { rgb: { r: 250, g: 250, b: 252 }, alpha: 0.32 },
			label2: { rgb: { r: 60, g: 60, b: 67 }, alpha: 0.78 },
		},
	};
	const MAX_SURFACE_ALPHA = 0.96;
	// Spicetify neutrals swapped at runtime in "auto" mode; must match color.ini [dark] / [light] (tested)
	const NEUTRALS = {
		dark: {
			text: "#FFFFFF", subtext: "#98989F", main: "#161618", "main-elevated": "#2C2C2E",
			highlight: "#2C2C2E", "highlight-elevated": "#3A3A3C", sidebar: "#000000", player: "#1C1C1E",
			card: "#2C2C2E", shadow: "#000000", "selected-row": "#FFFFFF", "button-disabled": "#48484A",
			"tab-active": "#3A3A3C", "notification-error": "#FF453A", misc: "#8E8E93",
		},
		light: {
			text: "#000000", subtext: "#6E6E73", main: "#FFFFFF", "main-elevated": "#F2F2F7",
			highlight: "#E5E5EA", "highlight-elevated": "#D1D1D6", sidebar: "#F2F2F7", player: "#FFFFFF",
			card: "#F2F2F7", shadow: "#000000", "selected-row": "#000000", "button-disabled": "#C7C7CC",
			"tab-active": "#E5E5EA", "notification-error": "#FF3B30", misc: "#8E8E93",
		},
	};

	// ------------------------------------------------------------------ pure helpers

	function parseColor(str) {
		if (typeof str !== "string") return null;
		const s = str.trim();
		let m = /^#([0-9a-f]{3})$/i.exec(s);
		if (m) {
			const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16));
			return { r, g, b };
		}
		m = /^#([0-9a-f]{6})$/i.exec(s);
		if (m) {
			const n = parseInt(m[1], 16);
			return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
		}
		m = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/i.exec(s);
		if (m) {
			const [r, g, b] = m.slice(1, 4).map(Number);
			if (r <= 255 && g <= 255 && b <= 255) return { r, g, b };
		}
		return null;
	}

	function toHex({ r, g, b }) {
		return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
	}

	function relativeLuminance({ r, g, b }) {
		const lin = (v) => {
			const c = v / 255;
			return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
		};
		return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
	}

	function contrastRatio(a, b) {
		const la = relativeLuminance(a);
		const lb = relativeLuminance(b);
		return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
	}

	function rgbToHsl({ r, g, b }) {
		const rn = r / 255;
		const gn = g / 255;
		const bn = b / 255;
		const max = Math.max(rn, gn, bn);
		const min = Math.min(rn, gn, bn);
		const l = (max + min) / 2;
		if (max === min) return { h: 0, s: 0, l };
		const d = max - min;
		const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		let h;
		if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
		else if (max === gn) h = (bn - rn) / d + 2;
		else h = (rn - gn) / d + 4;
		return { h: h * 60, s, l };
	}

	function hslToRgb({ h, s, l }) {
		const c = (1 - Math.abs(2 * l - 1)) * s;
		const hp = (((h % 360) + 360) % 360) / 60;
		const x = c * (1 - Math.abs((hp % 2) - 1));
		const [r1, g1, b1] =
			hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
		const m = l - c / 2;
		return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) };
	}

	function pickAccent(swatches, mode) {
		if (!swatches || typeof swatches !== "object") return null;
		for (const key of PREFERENCE[mode] || PREFERENCE.dark) {
			const rgb = parseColor(swatches[key]);
			if (rgb && rgbToHsl(rgb).s >= 0.15) return rgb;
		}
		return null;
	}

	function ensureContrast(rgb, bg, min) {
		const lighten = relativeLuminance(bg) < 0.5;
		let hsl = rgbToHsl(rgb);
		let out = { ...rgb };
		for (let i = 0; i < 40 && contrastRatio(out, bg) < min; i++) {
			hsl = { ...hsl, l: Math.min(1, Math.max(0, hsl.l + (lighten ? 0.025 : -0.025))) };
			out = hslToRgb(hsl);
		}
		return out;
	}

	function onAccent(rgb) {
		return contrastRatio(rgb, WHITE) >= ON_ACCENT_WHITE_MIN ? WHITE : BLACK;
	}

	function compositeOver(top, alpha, bottom) {
		const mix = (t, b) => Math.round(t * alpha + b * (1 - alpha));
		return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b) };
	}

	// The artwork's dominant colour stands in for the blurred backdrop behind the panels.
	function representativeColor(swatches) {
		if (!swatches || typeof swatches !== "object") return null;
		for (const key of ["PROMINENT", "VIBRANT", "DARK_VIBRANT", "LIGHT_VIBRANT", "DESATURATED"]) {
			const rgb = parseColor(swatches[key]);
			if (rgb) return rgb;
		}
		return null;
	}

	// Secondary text must stay as readable as on the opaque reference surface: 4.5:1 in dark mode; in light mode
	// Apple's own secondary label only reaches ~3.5:1 on white, so the reference itself is the bar.
	function labelTarget(mode, liquid = false) {
		const materials = liquid ? LIQUID_SURFACES : SURFACES;
		const s = materials[mode] || materials.dark;
		const onOpaque = (surface) => contrastRatio(compositeOver(s.label2.rgb, s.label2.alpha, surface.rgb), surface.rgb);
		const reference = Math.min(onOpaque(s.content), onOpaque(s.glass));
		return Math.min(MIN_CONTRAST, Math.round((reference - 0.1) * 100) / 100);
	}

	// Smallest opacity, from the design's base value up, at which secondary text is readable on the surface.
	function surfaceOver(surface, backdrop, label, target) {
		for (let alpha = surface.alpha; ; alpha = Math.min(MAX_SURFACE_ALPHA, alpha + 0.02)) {
			const effective = compositeOver(surface.rgb, alpha, backdrop);
			const text = compositeOver(label.rgb, label.alpha, effective);
			if (contrastRatio(text, effective) >= target || alpha >= MAX_SURFACE_ALPHA) {
				return { rgb: surface.rgb, alpha: Math.round(alpha * 100) / 100, effective };
			}
		}
	}

	// Content panel and glass panels over a given artwork colour; `worst` is the rendered surface the accent must
	// contrast with (the brighter one in dark mode, the darker one in light mode).
	function adaptSurfaces(artwork, mode, liquid = false) {
		const materials = liquid ? LIQUID_SURFACES : SURFACES;
		const s = materials[mode] || materials.dark;
		const backdrop = compositeOver(s.scrim.rgb, s.scrim.alpha, artwork);
		const target = labelTarget(mode, liquid);
		const content = surfaceOver(s.content, backdrop, s.label2, target);
		const glass = surfaceOver(s.glass, backdrop, s.label2, target);
		const brighter = relativeLuminance(content.effective) >= relativeLuminance(glass.effective) ? content : glass;
		const darker = brighter === content ? glass : content;
		return { content, glass, worst: (mode === "light" ? darker : brighter).effective };
	}

	// Spotify's GraphQL `fetchExtractedColors` entry → the palette keys pickAccent() understands.
	function swatchesFromExtracted(entry) {
		if (!entry || typeof entry !== "object") return null;
		const usable = (c) => (c && !c.isFallback && typeof c.hex === "string" ? c.hex : null);
		const raw = usable(entry.colorRaw);
		const light = usable(entry.colorLight);
		const dark = usable(entry.colorDark);
		const swatches = {};
		if (raw) Object.assign(swatches, { VIBRANT: raw, PROMINENT: raw });
		if (light) swatches.LIGHT_VIBRANT = light;
		if (dark) swatches.DARK_VIBRANT = dark;
		return Object.keys(swatches).length ? swatches : null;
	}

	// Pages that need their own treatment, exposed to CSS as html[data-lm-page] (cheaper than :has() lookups)
	function pageKind(pathname) {
		if (typeof pathname !== "string") return "other";
		if (/^\/lyrics\/?$/.test(pathname)) return "lyrics";
		if (pathname === "/") return "home";
		return "other";
	}

	// Kawarp's animation speed for a moment of the song, from Spotify's audio analysis (as Spicy Lyrics does): the
	// current section's tempo (against 120 BPM) times its loudness, plus a pulse that decays through each confident
	// beat. Clamped to 0.1-3.
	function speedFromAnalysis(seconds, data) {
		const active = (list) => list?.find((el) => seconds >= el.start && seconds < el.start + el.duration) || null;
		const loudness = (dB) => 0.5 + Math.max(0, (dB + 40) / 40) * 0.7;
		const source = active(data.sections) || data.track;
		let speed = ((source?.tempo || 120) / 120) * loudness(source?.loudness ?? -20);
		const beat = active(data.beats);
		if (beat && beat.confidence > 0.4) {
			speed += 1.5 * Math.exp(-5 * ((seconds - beat.start) / beat.duration)) * beat.confidence;
		}
		return Math.max(0.1, Math.min(speed, 3));
	}

	function artworkUrl(imageUri) {
		if (typeof imageUri !== "string" || !imageUri) return null;
		if (imageUri.startsWith("spotify:image:")) return "https://i.scdn.co/image/" + imageUri.slice("spotify:image:".length);
		if (imageUri.startsWith("https://")) return imageUri;
		return null;
	}

	// "dark" and "light" are fixed; anything else (auto, unset, or "marketplace" before the Marketplace sets the
	// scheme it installed) follows the system.
	function resolveMode(scheme, prefersLight) {
		const name = String(scheme || "").toLowerCase();
		if (name === "dark" || name === "light") return { auto: false, mode: name };
		return { auto: true, mode: prefersLight ? "light" : "dark" };
	}

	// user.css styles Spotify through the readable class names Spicetify adds from its class map (css-map). When
	// the map doesn't know the running Spotify (1.3.3 renamed nearly every hashed class), those names are missing
	// and the theme falls apart. Each hook finds the same element through markers Spotify keeps between versions
	// (ids, data-testid, structure) and gives it back its name. Order matters: a hook may build on names added by
	// the hooks above it.
	// The player pill, re-gridded by user.css: one name missing and its part falls out of the grid (without
	// main-nowPlayingBar-left the artwork and titles dropped under the pill, full size). Spicetify's class map can
	// cover the rest of a Spotify build and not these, so they run even when the map is present (see startClassHooks).
	// Only the pill's own elements: the track info names are shared with the Now Playing panel.
	const PILL_HOOKS = [
		["Root__now-playing-bar", ":has(> [data-testid='now-playing-bar'])"],
		["main-nowPlayingBar-container", "[data-testid='now-playing-bar']"],
		["main-nowPlayingBar-nowPlayingBar", "[data-testid='now-playing-bar'] > :has([data-testid='player-controls'])"],
		// Spotify 1.3.6 renamed the widget now-playing-widget-v2: its artwork sits in cover-art-container and the artists
		// are the second line of the titles' column
		["main-nowPlayingBar-left", ".main-nowPlayingBar-nowPlayingBar > :has([data-testid='now-playing-widget'], [data-testid='now-playing-widget-v2'])"],
		["main-nowPlayingBar-center", ".main-nowPlayingBar-nowPlayingBar > :has([data-testid='player-controls'])"],
		["main-nowPlayingBar-right", ".main-nowPlayingBar-nowPlayingBar > :has([data-testid='volume-bar'], [data-testid='control-button-queue'])"],
		["main-nowPlayingBar-extraControls", ".main-nowPlayingBar-right > *"],
		["main-nowPlayingBar-volumeBar", "[data-testid='volume-bar']"],
		["main-nowPlayingWidget-nowPlaying", "[data-testid='now-playing-widget'], [data-testid='now-playing-widget-v2']"],
		["main-coverSlotCollapsed-container", "[data-testid='CoverSlotCollapsed__container'], [data-testid='now-playing-widget-v2'] > [data-testid='cover-art-container']"],
		["main-nowPlayingWidget-coverArt", ":has(> [data-testid='cover-art-button'])"],
		["main-nowPlayingWidget-coverArtContainer", "[data-testid='cover-art-button']"],
		["main-trackInfo-container", "[data-testid='now-playing-widget'] > [data-testid='CoverSlotCollapsed__container'] + *, [data-testid='now-playing-widget-v2'] > [data-testid='cover-art-container'] + *"],
		["main-trackInfo-name", ".main-nowPlayingWidget-nowPlaying .main-trackInfo-container > :first-child"],
		["main-trackInfo-artists", "[data-testid='now-playing-widget'] .main-trackInfo-container > :nth-child(3), [data-testid='now-playing-widget-v2'] .main-trackInfo-container > :nth-child(2)"],
		["main-nowPlayingWidget-actionButtonWrapper", ":is([data-testid='now-playing-widget'], [data-testid='now-playing-widget-v2']) > :last-child:has(button)"],
		["player-controls", "[data-testid='player-controls']"],
		["player-controls__buttons", "[data-testid='general-controls']"],
		["player-controls__left", "[data-testid='general-controls'] > :first-child"],
		["playback-bar", "[data-testid='player-controls'] > :has([data-testid='playback-position'])"],
		["progress-bar", "[data-testid='now-playing-bar'] [data-testid='progress-bar']"],
	];

	const CLASS_HOOKS = [
		// Layout
		["Root__top-container", ".Root > :has(> #main-view)"],
		["Root__globalNav", "#global-nav-bar"],
		["Root__nav-bar", "#Desktop_LeftSidebar_Id"],
		["Root__main-view", "#main-view"],
		["Root__right-sidebar", ".Root__top-container > :has(> .LayoutResizer__inline-start)"],
		["Root__right-sidebar-peek", ".Root__right-sidebar > :not(.LayoutResizer__resize-bar)"],
		["Root__right-sidebar-overlayWrapper", ".Root__right-sidebar-peek > *"],
		["Root__right-sidebar-peekContent", ".Root__right-sidebar-overlayWrapper > :has(aside)"],
		["main-nowPlayingView-container", ":has(> .NowPlayingView)"],
		// Library (left). Its row images get no hook: artists' round images can't be told from square ones
		["main-navBar-mainNav", ".Root__nav-bar > nav"],
		["main-yourLibraryX-library", ".Root__nav-bar > nav > :has(.YourLibraryX)"],
		["main-yourLibraryX-libraryContainer", ".YourLibraryX"],
		["main-yourLibraryX-collapseButton", ".YourLibraryX header > * > :first-child:has(button)"],
		["main-yourLibraryX-libraryRootlist", ".YourLibraryX [data-overlayscrollbars-viewport] > :first-child"],
		// Toolbar
		["main-globalNav-historyButtonsWrapper", "#global-nav-bar > div:first-of-type"],
		["main-globalNav-historyButtons", ".main-globalNav-historyButtonsWrapper > * > :has(> button + button)"],
		["main-globalNav-searchSection", "#global-nav-bar > :has([role='search'])"],
		["main-globalNav-searchContainer", ".main-globalNav-searchSection > :has([role='search'])"],
		["main-globalNav-link-icon", ".main-globalNav-searchContainer > button"],
		["main-globalNav-searchInputSection", ".main-globalNav-searchContainer > :has(> [role='search'])"],
		["main-globalNav-searchInputWrapper", ".main-globalNav-searchContainer > :has(> [role='search'])"],
		["main-globalNav-searchInputContainer", "#global-nav-bar [role='search']"],
		["main-globalNav-searchInputKBDWrapper", "#global-nav-bar [role='search'] :has(> kbd)"],
		["main-globalNav-contentRight", "#global-nav-bar > :last-child > :has(> [data-testid='user-widget-link'])"],
		["main-actionButtons", ".main-globalNav-contentRight > :has(> button[data-encore-id='buttonTertiary'])"],
		// Not styled by the theme: Spicetify only adds extensions' top-bar buttons (Spicetify.Topbar) once it finds
		// this button to copy its look from. Friend activity, or the group's last icon when it's turned off
		["main-globalNav-buddyFeed", ".main-actionButtons > button[data-restore-focus-key='buddy_feed'], .main-actionButtons:not(:has(> [data-restore-focus-key='buddy_feed'])) > button[data-encore-id='buttonTertiary']:last-of-type"],
		...PILL_HOOKS,
		// Pages: sticky top bar, header (playlist, album, artist…), action bar, track list
		["main-topBar-background", "[data-testid='topbar'] > :first-child"],
		// Not styled by the theme: the Marketplace mounts its tab bar (Extensions, Themes…) into this wrapper and
		// shows none without it
		["main-topBar-topbarContentWrapper", "[data-testid='topbar-content-wrapper']"],
		["main-topBar-overlay", ".main-topBar-background > *"],
		["main-entityHeader-container", "[data-testid='entity-header']"],
		["main-entityHeader-contentWrapper", "[data-testid='entity-header'] > .contentSpacing"],
		// The page's colour: the header's first layer, Spotify's gradient over it, the band under the header (also
		// the names the "Smooth Reveal Playlist Gradient" snippet animates)
		["main-entityHeader-backgroundColor", "[data-testid='entity-header'] > div:first-child:empty:is([style*='background-color'], [style*='--background-base'])"],
		["main-entityHeader-overlay", ".main-entityHeader-backgroundColor + div:empty"],
		["main-actionBarBackground-background", "[data-testid='entity-header'] ~ div:empty:is([style*='background-color'], [style*='--background-base']), [data-testid='entity-header'] ~ div > div:empty:first-child:is([style*='background-color'], [style*='--background-base'])"],
		// Covers that open full size (album, podcast, episode, audiobook) are a button with no test id on Spotify
		// 1.3.4. Only square artwork is one: round pictures (artist, profile) sit in a div
		["main-entityHeader-imageContainer", ".main-entityHeader-contentWrapper [data-testid$='-image'], .main-entityHeader-contentWrapper > button:has(> * > img)"],
		["main-entityHeader-image", ".main-entityHeader-imageContainer img"],
		["main-entityHeader-title", "[data-testid='entityTitle'], [data-testid='adaptiveEntityTitle']"],
		["main-entityHeader-titleInner", "[data-testid='entityTitle'] h1, [data-testid='adaptiveEntityTitle'] > *"],
		["main-entityHeader-metaData", ".main-entityHeader-contentWrapper > :last-child > div:last-child:not(:has([data-testid='entityTitle'], [data-testid='adaptiveEntityTitle']))"],
		["playlist-playlist-actionBarBackground-background", "[data-testid='entity-header'] + div:empty"],
		["main-actionBar-ActionBarRow", "[data-testid='action-bar-row']"],
		["main-trackList-trackListHeader", "#main-view [role='grid'][aria-colcount] > :has([role='columnheader'])"],
		["main-trackList-trackListHeaderRow", "#main-view [role='grid'][aria-colcount] [role='row']:has(> [role='columnheader'])"],
		["main-trackList-trackListRow", "#main-view [role='grid'][aria-colcount] [role='row'] > [draggable='true']"],
		["main-trackList-rowImage", ".main-trackList-trackListRow [aria-colindex='2'] img"],
		// Not styled by the theme: Quick Queue's "button on the left" option looks for the title cell by this name
		["main-trackList-rowSectionStart", ".main-trackList-trackListRow > [role='gridcell'][aria-colindex='2']"],
		["main-trackList-rowDuration", ".main-trackList-trackListRow [role='gridcell']:last-child [data-encore-id='text']"],
		// Cards (home, search, artist pages…); artist and profile pictures are round
		["main-card-cardContainer", "[data-encore-id='card']"],
		["main-card-imageContainer", "[data-encore-id='card'] > :has(img)"],
		["main-cardImage-imageWrapper", ".main-card-imageContainer > :first-child"],
		["main-cardImage-image", ".main-cardImage-imageWrapper img"],
		["main-cardImage-circular", "[data-encore-id='card']:has(> :is([aria-labelledby*=':artist:'], [aria-labelledby*=':user:'])) :is(.main-cardImage-imageWrapper, .main-cardImage-image)"],
		["main-card-PlayButtonContainer", ".main-card-imageContainer > :has([data-encore-id='buttonPrimary'])"],
		["main-card-cardTitle", "[data-encore-id='cardTitle']"],
		// Expanded / full-screen Now Playing: the only scroll host right under the root grid
		["main-actionBar-ActionBarContainer", ".Root__top-container > * > [data-overlayscrollbars]"],
		// Now Playing panel (right)
		["main-nowPlayingView-headerContainer", ".NowPlayingView > * > :first-child:not([data-overlayscrollbars])"],
		["main-nowPlayingView-headerWrapper", ".main-nowPlayingView-headerContainer > *"],
		["main-nowPlayingView-headerTextWrapper", ".main-nowPlayingView-headerWrapper > :has(> a)"],
		["main-nowPlayingView-mainContainer", ".NowPlayingView > * > [data-overlayscrollbars]"],
		["main-nowPlayingView-panel", "[data-testid='NPV_Panel_OpenDiv']"],
		// From the test id, not from the panel's name: the [data-npv-root] panel below has that name too, and its
		// two columns are no grid and no section (the second one, taken for a card, got a background of its own)
		["main-nowPlayingView-nowPlayingGrid", "[data-testid='NPV_Panel_OpenDiv'] > :first-child > *"],
		["main-nowPlayingView-coverArtContainer", ".main-nowPlayingView-nowPlayingGrid [data-testid='track-visual-enhancement'] [data-testid='cover-drop-target']"],
		["main-nowPlayingView-coverArt", ".main-nowPlayingView-coverArtContainer > *"],
		["main-nowPlayingView-canvasVisualEnhancement", ".main-nowPlayingView-nowPlayingGrid :has(> * > .canvasVideoContainerNPV)"],
		["main-nowPlayingView-contextItemInfo", ".main-nowPlayingView-nowPlayingGrid > :has([data-testid='minimized-track-visual-enhancement'])"],
		["main-nowPlayingView-section", "[data-testid='NPV_Panel_OpenDiv'] > :not(:first-child)"],
		["main-nowPlayingView-sectionHeader", ".main-nowPlayingView-section :has(> h2)"],
		["main-nowPlayingView-aboutArtist", ".main-nowPlayingView-section:has([style*='background-image'])"],
		// Track title and artists, in the pill and in the Now Playing panel
		["main-trackInfo-container", "[data-testid='now-playing-widget'] > [data-testid='CoverSlotCollapsed__container'] + *, .main-nowPlayingView-contextItemInfo > [data-testid='minimized-track-visual-enhancement'] + *"],
		["main-trackInfo-name", ".main-trackInfo-container > :first-child"],
		["main-trackInfo-artists", "[data-testid='now-playing-widget'] .main-trackInfo-container > :nth-child(3), .main-nowPlayingView-contextItemInfo .main-trackInfo-container > :nth-child(2)"],
		["progress-bar", "[data-testid='progress-bar']"],
	];

	// Spotify 1.3.3 ships a second Now Playing panel, picked per install: [data-npv-root], a header floating over a
	// scroll area that holds the artwork, the track info and the section cards. Spicetify's class map doesn't know
	// it, so these hooks run even when the map covers the rest of Spotify. Only the names whose rules fit it.
	const NPV_ROOT_HOOKS = [
		["main-nowPlayingView-headerContainer", "[data-npv-root] > :first-child:not([data-overlayscrollbars])"],
		["main-nowPlayingView-mainContainer", "[data-npv-root] > [data-overlayscrollbars]"],
		// The scroll area's content. Found by position too: the artwork's slot only carries its test id while it shows
		// the cover, so with a Canvas, a video or an ad in its place this name and the next one were lost
		["main-nowPlayingView-panel", "[data-npv-root] [data-overlayscrollbars-viewport] > :has(> * > [data-testid='cover-art-slot']), [data-npv-root] > [data-overlayscrollbars] > [data-overlayscrollbars-viewport] > :only-child"],
		// The artwork is styled through its cover-art-slot in user.css: Spotify's styles for coverArtContainer would
		// turn the slot into a flex box with a 1s aspect-ratio transition.
		// The row under the artwork with the title and artists (the cards below have an h2 title)
		["main-nowPlayingView-contextItemInfo", "[data-npv-root] :has(> [data-testid='cover-art-slot']) + * > :has(a[href*='/artist/']):not(:has(h2)), [data-npv-root] .main-nowPlayingView-panel > :first-child + * > :has(a[href*='/artist/']):not(:has(h2))"],
		// Not main-trackInfo-container on their column: Spotify's own styles for that name (the pill's grid) centred
		// the title
		["main-trackInfo-name", "[data-npv-root] .main-nowPlayingView-contextItemInfo > :first-child > :first-child"],
		["main-trackInfo-artists", "[data-npv-root] .main-nowPlayingView-contextItemInfo > :first-child > :nth-child(2)"],
	];

	// Gives each element matched by a hook its class, when it doesn't already have it. Several passes, so hooks
	// can build on classes added in the pass before. Returns how many classes were added.
	function applyClassHooks(root, hooks) {
		const combined = hooks.map(([, selector]) => selector).join(", ");
		let added = 0;
		for (let pass = 0; pass < 8; pass++) {
			let addedThisPass = 0;
			const targets = [...(root.matches?.(combined) ? [root] : []), ...(root.querySelectorAll?.(combined) ?? [])];
			for (const el of targets) {
				for (const [name, selector] of hooks) {
					if (!el.classList.contains(name) && el.matches(selector)) {
						el.classList.add(name);
						addedThisPass++;
					}
				}
			}
			added += addedThisPass;
			if (!addedThisPass) break;
		}
		return added;
	}

	// Of the elements that changed, those no other changed element contains (each subtree is processed once).
	function outermostNodes(nodes) {
		const set = new Set(nodes);
		return [...set].filter((node) => {
			for (let parent = node.parentElement; parent; parent = parent.parentElement) if (set.has(parent)) return false;
			return true;
		});
	}

	// Diagnostic: the theme names (from the hook table) that no element on the page carries, in table order.
	function missingClassNames(hooks, isPresent) {
		return hooks.map(([name]) => name).filter((name) => !isPresent(name));
	}

	const helpers = {
		PILL_HOOKS,
		CLASS_HOOKS,
		NPV_ROOT_HOOKS,
		applyClassHooks,
		outermostNodes,
		missingClassNames,
		resolveMode,
		parseColor,
		toHex,
		relativeLuminance,
		contrastRatio,
		rgbToHsl,
		hslToRgb,
		pickAccent,
		ensureContrast,
		onAccent,
		compositeOver,
		representativeColor,
		labelTarget,
		adaptSurfaces,
		swatchesFromExtracted,
		pageKind,
		artworkUrl,
		speedFromAnalysis,
		FALLBACK_ACCENT,
		CONTENT_BG,
		MIN_CONTRAST,
		SURFACES,
		LIQUID_SURFACES,
		NEUTRALS,
	};
	if (typeof module !== "undefined" && module.exports) {
		module.exports = helpers;
		return;
	}

	// ------------------------------------------------------------------ runtime (Spotify only)

	// Loaded twice (e.g. re-injected)? Keep the first instance: a second one would duplicate every listener.
	if (window.LiquidMusic) return;
	window.LiquidMusic = {};

	// The theme's typeface. Added as a non-blocking <link> (an @import in user.css delayed the stylesheet and
	// tipped Spicetify's startup race into crashing Spotify).
	const FONT_CSS = "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&display=swap";
	if (!document.getElementById("lm-font")) {
		const link = document.createElement("link");
		link.id = "lm-font";
		link.rel = "stylesheet";
		link.href = FONT_CSS;
		(document.head || document.documentElement).append(link);
	}

	const LIGHT_QUERY = "(prefers-color-scheme: light)";
	// Under these preferences user.css makes every surface opaque: nothing to adapt
	const SOLID_SURFACES_QUERY = "(prefers-reduced-transparency: reduce), (prefers-contrast: more)";
	const WINDOW_BG = { dark: BLACK, light: { r: 242, g: 242, b: 247 } };
	const UNKNOWN_ARTWORK = { r: 128, g: 128, b: 128 };
	const root = document.documentElement;
	const state = { mode: "dark", auto: true, swatches: null, hasImage: false, request: 0, layer: 0, accent: FALLBACK_ACCENT, kawarp: undefined, kawarpShown: false, speed: 0, settleUntil: 0 };

	function warn(...args) {
		console.warn("[LiquidMusic]", ...args);
	}

	function safe(fn) {
		try {
			const result = fn();
			if (result && typeof result.catch === "function") result.catch(warn);
			return result;
		} catch (e) {
			warn(e);
		}
	}

	// Restores the readable class names when Spicetify's class map doesn't cover this Spotify (see CLASS_HOOKS).
	// The observer starts with the theme's script, before the extensions load: on each change it adds the names
	// right away, in the same batch, so extensions that look for them as soon as an element appears (Quick Queue
	// reads .main-trackList-trackListRow in new rows) find them. Once the main view exists it decides: with the map
	// present the main view already carries its name, and only the hooks for what the map may miss (the pill, the
	// [data-npv-root] panel) keep running.
	function startClassHooks() {
		let hooks = null;
		const decide = () => {
			const mainView = document.querySelector("#main-view, .Root__main-view");
			if (!mainView || !document.body) return false;
			const translate = !mainView.classList.contains("Root__main-view");
			hooks = (translate ? [...CLASS_HOOKS, ...NPV_ROOT_HOOKS] : [...PILL_HOOKS, ...NPV_ROOT_HOOKS]).filter(([name, selector]) => {
				try {
					document.querySelector(selector);
					return true;
				} catch {
					warn("class hook skipped (selector not supported):", name);
					return false;
				}
			});
			if (translate) root.dataset.lmClassHooks = "on";
			applyClassHooks(document.body, hooks);
			return true;
		};
		const observer = new MutationObserver((records) => {
			safe(() => {
				if (hooks === null && !decide()) return;
				if (!hooks.length) return observer.disconnect();
				// Re-checked where the page changed: the subtree of each changed element (children added, or classes
				// reset by a React re-render), the outermost ones only
				for (const node of outermostNodes(records.map((record) => record.target))) {
					if (node.isConnected) applyClassHooks(node, hooks);
				}
			});
		});
		observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
		safe(decide);
	}
	safe(startClassHooks);

	// Marks for the expanded Now Playing view and its lyrics, which user.css found with :has([style*="--…"]). An
	// inline-style test inside :has() makes Chrome re-check the :has() anchors up the tree whenever any element's style
	// attribute changes, and Spicy Lyrics animates its lines through inline styles: the whole page was restyled many
	// times a second while music played (issue #8, ~2.5 s of style work per 4 s of scrolling). The same elements are
	// marked here instead, re-checked a few times a second at most when the page changes.
	const LYRICS_COLOURS = '[style*="--lyrics-color-background"]';
	const CINEMA_COLOURS = '[style*="--cinema-mode-bg-color-from"]';
	const VIEW_COLOURS = '[style*="--cinema-mode-bg-color"]';
	// A readable class can also be mapped onto a sidebar scroll host. Lyrics in that host are a preview,
	// not the expanded view: marking them as cinema lyrics would hide the very sidebar containing them.
	const CINEMA_VIEW = ".Root__top-container > :not(.Root__right-sidebar, .Root__main-view, .Root__nav-bar) > .main-actionBar-ActionBarContainer";
	const LYRICS_MARKS = ["data-lm-view-colours", "data-lm-lyrics", "data-lm-lyrics-host", "data-lm-before-lyrics"];

	function markLyricsViews() {
		const marks = new Map(LYRICS_MARKS.map((name) => [name, new Set()]));
		// The view's direct child that holds its colour layer (`> :not(:has(--cinema-mode-bg-color-from))`)
		for (const colours of document.querySelectorAll(CINEMA_COLOURS)) {
			const viewport = colours.closest(".main-actionBar-ActionBarContainer > [data-overlayscrollbars-viewport]");
			let child = colours;
			while (viewport && child.parentElement !== viewport) child = child.parentElement;
			if (viewport) marks.get("data-lm-view-colours").add(child);
		}
		for (const lyrics of document.querySelectorAll(LYRICS_COLOURS)) {
			const container = lyrics.closest(CINEMA_VIEW);
			if (container) {
				marks.get("data-lm-lyrics").add(container); // `.main-actionBar-ActionBarContainer:has(lyrics)`
				const before = container.previousElementSibling; // `:has(+ .main-actionBar-ActionBarContainer lyrics)`
				if (before) marks.get("data-lm-before-lyrics").add(before);
			}
			// `[style*="--cinema-mode-bg-color"]:has(> lyrics)`
			if (lyrics.parentElement?.matches(VIEW_COLOURS)) marks.get("data-lm-lyrics-host").add(lyrics.parentElement);
		}
		for (const [name, elements] of marks) {
			for (const el of document.querySelectorAll(`[${name}]`)) if (!elements.has(el)) el.removeAttribute(name);
			for (const el of elements) if (!el.hasAttribute(name)) el.setAttribute(name, "");
		}
		const lyricsView = marks.get("data-lm-lyrics").size > 0;
		if (lyricsView !== root.hasAttribute("data-lm-lyrics-view")) root.toggleAttribute("data-lm-lyrics-view", lyricsView);
	}

	function watchLyricsViews() {
		let timer = 0;
		const schedule = () => {
			if (!timer) timer = setTimeout(() => ((timer = 0), safe(markLyricsViews)), 250);
		};
		// Elements come and go with the view; Spotify flags the view's states on <html> (data-cinema-npv-*)
		new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
		new MutationObserver(schedule).observe(root, { attributes: true });
		safe(markLyricsViews);
	}

	// Marks a track list's column header while it is stuck under the page's sticky bar: user.css then draws one
	// glass layer behind the two (see .main-trackList-trackListHeader). CSS can't tell the bar that the header is
	// stuck, and Spotify's own mark, a class, comes late on a fast scroll: the header's background lingered after
	// it had left. Checked as the page scrolls, once per frame: a few rectangles, nothing when they haven't changed.
	function watchStuckListHeaders() {
		let pending = 0;
		const update = () => {
			pending = 0;
			const bar = document.querySelector("[data-testid='topbar']");
			const edge = bar ? bar.getBoundingClientRect().bottom : null;
			for (const header of document.querySelectorAll("#main-view .main-trackList-trackListHeader")) {
				const stuck = edge !== null && Math.abs(header.getBoundingClientRect().top - edge) < 1;
				if (stuck !== header.hasAttribute("data-lm-stuck")) header.toggleAttribute("data-lm-stuck", stuck);
			}
		};
		// Scroll events don't bubble: caught on their way down, whichever page's list is scrolling
		document.addEventListener("scroll", () => (pending ||= requestAnimationFrame(() => safe(update))), { capture: true, passive: true });
		root.dataset.lmStuckHeaders = "on";
	}
	safe(watchStuckListHeaders);

	// After a Spotify update, LiquidMusic.hooks() in the DevTools console lists the names the theme styles that are
	// missing from the current page, i.e. what broke. Some only exist on some pages (track rows on playlists,
	// cards on home) or with the right panel open: check a few pages.
	const PAGE_SPECIFIC = /^(main-entityHeader|main-trackList|main-topBar|main-actionBar|playlist-|main-card|main-nowPlayingView-(canvas|aboutArtist))/;
	window.LiquidMusic.hooks = () => {
		const missing = missingClassNames(CLASS_HOOKS, (name) => !!document.querySelector("." + CSS.escape(name)));
		// The [data-npv-root] Now Playing panel has no counterpart for some of the other panel's names
		const npvRootNames = document.querySelector("[data-npv-root]") ? new Set(NPV_ROOT_HOOKS.map(([name]) => name)) : null;
		const expected = (name) => !PAGE_SPECIFIC.test(name) && !(npvRootNames && name.startsWith("main-nowPlayingView-") && !npvRootNames.has(name));
		const report = {
			translator: root.dataset.lmClassHooks === "on" ? "on (restoring names)" : "off (Spicetify's class map covers this Spotify)",
			page: Spicetify.Platform?.History?.location?.pathname ?? location.pathname,
			// Expected on every page (with the right panel open): any name here is broken
			missing: missing.filter(expected),
			// Page headers, track lists, cards, Canvas…: only a problem on a page (or Now Playing panel) that shows them
			notOnThisPage: missing.filter((name) => !expected(name)),
		};
		console.info("[LiquidMusic]", report.missing.length ? `${report.missing.length} names missing` : "nothing missing", report);
		return report;
	};

	function setSpice(name, rgb) {
		root.style.setProperty(`--spice-${name}`, toHex(rgb));
		root.style.setProperty(`--spice-rgb-${name}`, `${rgb.r},${rgb.g},${rgb.b}`);
	}

	// Thickens the translucent panels just enough for the current artwork and returns the rendered surface
	// the accent has to contrast with (the opaque reference when the panels are solid).
	function applySurfaces() {
		if (matchMedia(SOLID_SURFACES_QUERY).matches) {
			root.style.removeProperty("--lm-bg-content");
			root.style.removeProperty("--lm-glass-thick-bg");
			return CONTENT_BG[state.mode];
		}
		const artwork = representativeColor(state.swatches) || (state.hasImage ? UNKNOWN_ARTWORK : WINDOW_BG[state.mode]);
		// Clear panels: the backdrop is graded like Spicy Lyrics' card (user.css), so text and accent sit on the
		// graded artwork itself: darkened (× 0.6) in dark mode, lifted (0.68 × c + 0.51) in light
		if (panelsMode() === "clear") {
			root.style.removeProperty("--lm-bg-content");
			root.style.removeProperty("--lm-glass-thick-bg");
			const grade = state.mode === "dark" ? (c) => c * 0.6 : (c) => Math.min(255, c * 0.68 + 130);
			return { r: Math.round(grade(artwork.r)), g: Math.round(grade(artwork.g)), b: Math.round(grade(artwork.b)) };
		}
		const s = adaptSurfaces(artwork, state.mode, panelsMode() === "liquid");
		const rgba = ({ rgb, alpha }) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
		root.style.setProperty("--lm-bg-content", rgba(s.content));
		root.style.setProperty("--lm-glass-thick-bg", rgba(s.glass));
		return s.worst;
	}

	function applyAccent() {
		const background = applySurfaces();
		const picked = pickAccent(state.swatches, state.mode) || FALLBACK_ACCENT;
		const accent = ensureContrast(picked, background, MIN_CONTRAST);
		state.accent = accent;
		root.style.setProperty("--lm-accent", toHex(accent));
		root.style.setProperty("--lm-on-accent", toHex(onAccent(accent)));
		for (const name of ["button", "button-active", "notification"]) setSpice(name, accent);
	}

	function applyMode() {
		const appearance = appearanceMode();
		Object.assign(state, resolveMode(appearance === "default" ? Spicetify.Config?.color_scheme : appearance, matchMedia(LIGHT_QUERY).matches));
		root.dataset.lmTheme = state.mode;
		for (const [name, hex] of Object.entries(NEUTRALS[state.mode])) {
			if (state.auto || appearance !== "default") setSpice(name, parseColor(hex));
			// A fixed scheme gets its colours from color.ini (or the Marketplace): drop what auto mode set inline
			else for (const prefix of ["--spice-", "--spice-rgb-"]) root.style.removeProperty(prefix + name);
		}
		applyAccent();
	}

	// The Marketplace switches schemes live: it sets Config.color_scheme, then swaps in a
	// <style class="marketplaceScheme"> with the new colours (appended to <body> today; <head> watched too).
	function watchMarketplaceScheme() {
		const isScheme = (node) => node.nodeType === 1 && node.matches("style.marketplaceScheme");
		const observer = new MutationObserver((records) => {
			if (records.some((r) => [...r.addedNodes].some(isScheme))) safe(applyMode);
		});
		for (const parent of [document.head, document.body]) observer.observe(parent, { childList: true });
	}

	function backdrop() {
		let el = document.getElementById("lm-backdrop");
		if (!el) {
			el = document.createElement("div");
			el.id = "lm-backdrop";
			el.setAttribute("aria-hidden", "true");
			for (let i = 0; i < 2; i++) {
				const layer = document.createElement("div");
				layer.className = "lm-backdrop-layer";
				el.append(layer);
			}
			const canvas = document.createElement("canvas");
			canvas.className = "lm-backdrop-canvas";
			el.append(canvas);
			document.body.prepend(el);
		}
		return el;
	}

	function showBackdrop(url) {
		const layers = backdrop().children;
		const incoming = layers[1 - state.layer];
		incoming.style.backgroundImage = url ? `url("${url}")` : "none";
		incoming.classList.add("is-visible");
		layers[state.layer].classList.remove("is-visible");
		state.layer = 1 - state.layer;
	}

	// ---- Kawarp background (WebGL), tuned like Spicy Lyrics' "Dynamic (Kawarp)" background: same options, same
	// colour grade (user.css), speed following the song's tempo, loudness and beats, a slow drift while paused.
	// The blurred CSS layers above stay as the fallback (no WebGL, artwork that won't load).
	// Two settings, kept in localStorage and picked from the profile menu: "static" (default) lets the cross-fade
	// play and then freezes the frame; "animated" keeps it moving.
	const BG_KEY = "lm-background";
	// Preserve existing choices and the frosted-glass default; Liquid Glass is opt-in.
	const BG_MODES = [
		["classic", "Blurred artwork"],
		["static", "Kawarp"],
		["animated", "Kawarp, animated"],
	];
	const APPEARANCE_KEY = "lm-appearance";
	const APPEARANCE_MODES = [
		["default", "Spicetify setting"],
		["auto", "Follow system"],
		["dark", "Dark"],
		["light", "Light"],
	];
	const PANELS_KEY = "lm-panels";
	const PANEL_MODES = [
		["glass", "Frosted glass"],
		["liquid", "Liquid Glass"],
		["clear", "Clear, like Spicy Lyrics"],
	];
	const BG_SCALE = 0.5; // the effect is a blur: half the pixels look the same and cost a quarter
	const BG_FPS = 60; // the render loop's cap
	const PAUSED_SPEED = 0.1;
	const KAWARP_OPTIONS = {
		warpIntensity: 1,
		blurPasses: 8,
		animationSpeed: PAUSED_SPEED,
		saturation: 1.5,
		dithering: 0.008,
		tintIntensity: 0,
		scale: 1,
		transitionDuration: 500, // the first cover; later ones cross-fade over KAWARP_TRANSITION
	};
	const KAWARP_TRANSITION = 1000;
	const COVER_PREVIEW_AFTER_MS = 250; // full-size cover not in by then: show the small one first
	const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
	const TRANSPARENCY_QUERY = "(prefers-reduced-transparency: reduce)";

	function storedChoice(key, modes) {
		try {
			const value = localStorage.getItem(key);
			return modes.some(([id]) => id === value) ? value : modes[0][0];
		} catch {
			return modes[0][0];
		}
	}
	let refreshSettingsMenu = () => {};
	const appearanceMode = () => storedChoice(APPEARANCE_KEY, APPEARANCE_MODES);
	const backgroundMode = () => storedChoice(BG_KEY, BG_MODES);
	const panelsMode = () => storedChoice(PANELS_KEY, PANEL_MODES);

	// The panels' look lives on <html> for user.css; the accent is measured against what they now show
	function applyPanelsMode() {
		root.dataset.lmPanels = panelsMode();
		root.dispatchEvent(new Event("lm-material-change"));
		safe(applyAccent);
	}

	function sizeKawarp() {
		const canvas = backdrop().querySelector(".lm-backdrop-canvas");
		canvas.width = Math.max(1, Math.round(innerWidth * BG_SCALE));
		canvas.height = Math.max(1, Math.round(innerHeight * BG_SCALE));
		state.kawarp?.resize();
	}

	// undefined = not tried yet, null = unavailable (no WebGL, bundle missing): the CSS layers take over
	function ensureKawarp() {
		if (state.kawarp !== undefined) return state.kawarp;
		state.kawarp = null;
		try {
			const Kawarp = window.__lmKawarp;
			if (!Kawarp) throw new Error("Kawarp bundle missing");
			const canvas = backdrop().querySelector(".lm-backdrop-canvas");
			sizeKawarp();
			state.kawarp = new Kawarp(canvas, KAWARP_OPTIONS);
			state.speed = PAUSED_SPEED;
			let pending = 0;
			addEventListener("resize", () => {
				cancelAnimationFrame(pending);
				pending = requestAnimationFrame(() => {
					sizeKawarp(); // resizing clears the canvas: draw it again
					settleKawarp();
				});
			});
		} catch (e) {
			warn("Kawarp unavailable, using the CSS backdrop:", e);
		}
		return state.kawarp;
	}

	function setKawarpActive(active) {
		backdrop().classList.toggle("lm-kawarp", active);
	}

	// Kawarp's own start() runs an uncapped requestAnimationFrame loop: the theme renders from its own capped loop.
	// start() still seeds Kawarp's clock (so the first frame doesn't jump by the time it was stopped); the loop it
	// queues is cancelled at once (`animationId` is private, but a plain field), as Spicy Lyrics does.
	const loop = { id: 0, last: 0 };

	function loopWanted() {
		return (
			!!state.kawarp &&
			!document.hidden &&
			!matchMedia(TRANSPARENCY_QUERY).matches &&
			(backgroundMode() === "animated" || performance.now() < state.settleUntil)
		);
	}

	function tick(now) {
		loop.id = 0;
		const kawarp = state.kawarp;
		if (!loopWanted()) return kawarp?.stop();
		loop.id = requestAnimationFrame(tick);
		if (now - loop.last < 1000 / BG_FPS - 2) return;
		loop.last = now;
		kawarp.renderFrame();
	}

	function syncAnimation() {
		const kawarp = state.kawarp;
		if (!kawarp) return;
		applySpeed();
		const wanted = loopWanted();
		if (wanted && !loop.id) {
			kawarp.start();
			if (kawarp.animationId != null) cancelAnimationFrame(kawarp.animationId);
			kawarp.animationId = null;
			loop.last = 0;
			loop.id = requestAnimationFrame(tick);
		} else if (!wanted && loop.id) {
			cancelAnimationFrame(loop.id);
			loop.id = 0;
			kawarp.stop();
		}
	}

	// After a new image (or a resize) the loop runs while the cross-fade plays, then a static background freezes
	function settleKawarp() {
		const kawarp = state.kawarp;
		if (!kawarp) return;
		state.settleUntil = performance.now() + kawarp.transitionDuration + 150;
		syncAnimation();
	}

	// ---- Speed: the song's audio analysis (see speedFromAnalysis), the paused drift otherwise
	const analysis = { uri: null, data: null };

	async function loadAnalysis(uri) {
		analysis.uri = uri;
		analysis.data = null;
		if (backgroundMode() !== "animated" || !uri?.startsWith("spotify:track:")) return;
		if (typeof Spicetify.getAudioData !== "function") return;
		try {
			const data = await Spicetify.getAudioData(uri);
			if (analysis.uri === uri && data?.track && Array.isArray(data.sections) && Array.isArray(data.beats)) {
				analysis.data = data;
			}
		} catch {
			// Many tracks have no analysis (404): they animate at the base speed
		}
	}

	function targetSpeed() {
		if (!Spicetify.Player.isPlaying?.()) return PAUSED_SPEED;
		const seconds = (Spicetify.Player.getProgress?.() || 0) / 1000;
		const speed = analysis.data ? speedFromAnalysis(seconds, analysis.data) : 1;
		return matchMedia(MOTION_QUERY).matches ? Math.min(speed, PAUSED_SPEED) : speed; // reduced motion: the drift
	}

	// Kawarp eases between speeds itself
	function applySpeed() {
		const kawarp = state.kawarp;
		if (!kawarp) return;
		const speed = targetSpeed();
		if (speed === state.speed) return;
		state.speed = speed;
		kawarp.animationSpeed = speed;
	}

	function store(key, value) {
		try {
			localStorage.setItem(key, value);
		} catch {}
	}

	function setBackgroundMode(mode) {
		const before = backgroundMode();
		store(BG_KEY, mode);
		if (mode === "animated" && !analysis.data) loadAnalysis(currentItem()?.uri);
		// Between the blurred artwork and Kawarp the backdrop is drawn again; between Kawarp's two, only its motion
		if ((before === "classic") !== (mode === "classic")) loadBackdrop(state.backdropUrl, state.request, state.previewUrl);
		syncAnimation();
		refreshSettingsMenu();
	}

	function setPanelsMode(mode) {
		store(PANELS_KEY, mode);
		applyPanelsMode();
		refreshSettingsMenu();
	}

	// One profile-menu entry, with independent radio groups and summaries of the current choices.
	function registerSettingsMenu() {
		const { Menu } = Spicetify;
		if (!Menu?.SubMenu || !Menu.Item) return warn("Spicetify.Menu missing, the settings are not in the menu");
		const groups = [];
		const group = (title, modes, current, apply) => {
			const items = modes.map(([id, label]) => new Menu.Item(label, id === current(), () => {
				apply(id);
				refreshSettingsMenu();
			}));
			const submenu = new Menu.SubMenu(title, items);
			groups.push(() => {
				const selected = current();
				items.forEach((item, index) => item.setState(modes[index][0] === selected));
				submenu.name = `${title}: ${modes.find(([id]) => id === selected)?.[1] || modes[0][1]}`;
			});
			return submenu;
		};
		const appearance = group("Appearance", APPEARANCE_MODES, appearanceMode, (mode) => {
			store(APPEARANCE_KEY, mode);
			applyMode();
		});
		const surfaces = group("Surfaces", PANEL_MODES, panelsMode, setPanelsMode);
		const background = group("Background", BG_MODES, backgroundMode, setBackgroundMode);
		const reset = new Menu.Item("Reset theme settings", false, () => {
			store(APPEARANCE_KEY, "default");
			store(PANELS_KEY, "glass");
			setBackgroundMode("classic");
			applyPanelsMode();
			applyMode();
			refreshSettingsMenu();
		});
		refreshSettingsMenu = () => groups.forEach((refresh) => refresh());
		refreshSettingsMenu();
		new Menu.SubMenu("LiquidMusic", [appearance, surfaces, background, reset]).register();
	}

	// ---- Loading the artwork into Kawarp
	// Loads run one after the other: unserialized, a slow load for the previous track could land after the current
	// one and leave the wrong cover. Each checks it is still current when its turn comes.
	let kawarpChain = Promise.resolve();
	function queueKawarpLoad(load, request) {
		const next = kawarpChain.then(async () => {
			if (request !== state.request) return false;
			await load();
			return request === state.request;
		});
		kawarpChain = next.catch(() => undefined);
		return next;
	}

	// Fetched at high priority: left to the browser at image priority, the cover can wait behind other requests
	async function fetchCover(url) {
		try {
			const res = await fetch(url, { priority: "high" });
			return res.ok ? await res.blob() : null;
		} catch {
			return null;
		}
	}

	async function loadKawarpCover(kawarp, url, previewUrl, request) {
		const shown = () => {
			setKawarpActive(true);
			settleKawarp();
			if (!state.kawarpShown) {
				state.kawarpShown = true;
				setTimeout(() => (kawarp.transitionDuration = KAWARP_TRANSITION), KAWARP_OPTIONS.transitionDuration * 2);
			}
		};
		const full = fetchCover(url);
		const TIMED_OUT = {};
		const early = await Promise.race([full, new Promise((r) => setTimeout(() => r(TIMED_OUT), COVER_PREVIEW_AFTER_MS))]);
		if (early === TIMED_OUT && previewUrl && previewUrl !== url) {
			if (await queueKawarpLoad(() => kawarp.loadImage(previewUrl), request).catch(() => false)) shown();
		}
		const blob = early === TIMED_OUT ? await full : early;
		if (await queueKawarpLoad(() => (blob ? kawarp.loadBlob(blob) : kawarp.loadImage(url)), request)) shown();
	}

	function loadBackdrop(url, request, previewUrl) {
		Object.assign(state, { backdropUrl: url, previewUrl }); // to draw it again when the setting changes
		if (!url) {
			setKawarpActive(false);
			return showBackdrop(null);
		}
		// Preload so the cross-fade never fades to an empty layer; a newer track cancels an older load.
		const legacy = () => {
			setKawarpActive(false);
			const img = new Image();
			img.onload = () => request === state.request && showBackdrop(url);
			img.onerror = () => request === state.request && showBackdrop(null);
			img.src = url;
		};
		const kawarp = backgroundMode() === "classic" ? null : ensureKawarp();
		if (!kawarp) return legacy();
		loadKawarpCover(kawarp, url, previewUrl, request).catch((e) => {
			if (request !== state.request) return;
			warn("Kawarp could not load the artwork:", e);
			legacy();
		});
	}

	// Spicetify.Player.data stays null until the first player event (e.g. after a reload while paused);
	// PlayerAPI already knows the current item.
	function currentItem() {
		return Spicetify.Player.data?.item || safe(() => Spicetify.Platform?.PlayerAPI?.getState?.()?.item) || null;
	}

	// At a cold start Spicetify.GraphQL can be populated after the first track is known: wait for it briefly
	// rather than dropping to colorExtractor (which is broken on Spotify 1.3.x). The wait is paid once: if the
	// query never shows up, later tracks go straight to the fallback.
	let graphqlWaitSpent = false;
	async function graphqlReady(timeoutMs = 5000) {
		for (let waited = 0; ; waited += 100) {
			const gql = Spicetify.GraphQL;
			if (gql?.Request && gql.Definitions?.fetchExtractedColors) return gql;
			if (graphqlWaitSpent || waited >= timeoutMs) {
				graphqlWaitSpent = true;
				return null;
			}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	// Spicetify.colorExtractor fails on Spotify 1.3.x ("Resolver not found"); the GraphQL query Spotify
	// itself uses works, so it goes first and colorExtractor stays as the fallback for other versions.
	async function extractSwatches(item, imageUrl) {
		const gql = imageUrl && (await graphqlReady());
		if (gql) {
			const res = await gql.Request(gql.Definitions.fetchExtractedColors, { imageUris: [imageUrl] });
			return swatchesFromExtracted(res?.data?.extractedColors?.[0]);
		}
		return typeof Spicetify.colorExtractor === "function" ? Spicetify.colorExtractor(item.uri) : null;
	}

	// The expanded Now Playing view shows the title and artists at its bottom left: user.css draws them from these
	// variables, as CSS strings
	function showTrackInfo(item) {
		const cssString = (text) => `"${String(text).replace(/[\\"]/g, "\\$&").replace(/\s+/g, " ")}"`;
		const artists = item?.artists?.map((artist) => artist.name).join(", ") || item?.metadata?.artist_name || "";
		for (const [name, text] of [["--lm-track-name", item?.name], ["--lm-track-artists", artists]]) {
			if (text) root.style.setProperty(name, cssString(text));
			else root.style.removeProperty(name);
		}
	}

	async function onSongChange() {
		const request = ++state.request;
		const item = currentItem();
		const meta = item?.metadata || {};
		const isAd = meta.is_advertisement === "true" || item?.type === "ad";
		showTrackInfo(isAd ? null : item);
		const imageUrl = isAd ? null : artworkUrl(meta.image_url);
		state.hasImage = !!imageUrl;
		loadBackdrop(imageUrl, request, isAd ? null : artworkUrl(meta.image_small_url));
		loadAnalysis(isAd ? null : item?.uri);
		if (!item?.uri || isAd) {
			state.swatches = null;
			return applyAccent();
		}
		let swatches = null;
		try {
			swatches = await extractSwatches(item, imageUrl);
		} catch (e) {
			warn("colour extraction failed for", item.uri, e);
		}
		if (request !== state.request) return; // a newer track took over while we waited
		state.swatches = swatches;
		applyAccent();
	}

	// An optical layer on floating controls, never a filter on their foreground. The displacement map is
	// neutral in the centre and bends the backdrop along a rounded edge. Rebuild only on size changes;
	// a bounded bitmap keeps a wide player inexpensive. Chromium supports SVG backdrop filters.
	function startGlassOptics() {
		if (!CSS.supports("backdrop-filter", 'url("#lm-optics-probe")')) return;
		const selector = ".main-globalNav-historyButtons, .main-globalNav-link-icon, .custom-navlinks-scrollable_container, .main-globalNav-searchInputContainer, .main-globalNav-contentRight > .main-actionButtons, [data-testid='user-widget-link'], .main-nowPlayingBar-container";
		const ns = "http://www.w3.org/2000/svg";
		const svg = document.createElementNS(ns, "svg");
		svg.id = "lm-glass-optics";
		svg.setAttribute("aria-hidden", "true");
		svg.setAttribute("width", "0");
		svg.setAttribute("height", "0");
		svg.style.cssText = "position:fixed;pointer-events:none;overflow:hidden";
		const defs = document.createElementNS(ns, "defs");
		svg.append(defs);
		document.body.append(svg);
		const entries = new Map();
		const solid = matchMedia(SOLID_SURFACES_QUERY);
		let serial = 0;
		let frame = 0;
		const create = (name, attributes) => {
			const node = document.createElementNS(ns, name);
			for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
			return node;
		};
		function update(el, entry) {
			const { width, height } = el.getBoundingClientRect();
			if (width < 1 || height < 1) return;
			const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || height / 2, width / 2, height / 2);
			const key = `${Math.round(width)}:${Math.round(height)}:${radius}`;
			if (entry.key === key) return;
			entry.key = key;
			const canvas = document.createElement("canvas");
			const ratio = Math.min(1, 768 / width, 256 / height);
			canvas.width = Math.max(1, Math.round(width * ratio));
			canvas.height = Math.max(1, Math.round(height * ratio));
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			const map = ctx.createImageData(canvas.width, canvas.height);
			const band = Math.min(12, radius * 0.7);
			for (let y = 0; y < canvas.height; y++) {
				for (let x = 0; x < canvas.width; x++) {
					const px = (x + 0.5) * width / canvas.width;
					const py = (y + 0.5) * height / canvas.height;
					const dx = px - Math.max(radius, Math.min(width - radius, px));
					const dy = py - Math.max(radius, Math.min(height - radius, py));
					const length = Math.hypot(dx, dy);
					const depth = radius - length;
					const bend = band > 0 && depth > 0 && depth < band ? Math.sin(depth / band * Math.PI) : 0;
					const i = (y * canvas.width + x) * 4;
					map.data[i] = Math.round(128 + (length ? dx / length : 0) * bend * 110);
					map.data[i + 1] = Math.round(128 + (length ? dy / length : 0) * bend * 110);
					map.data[i + 2] = 128;
					map.data[i + 3] = 255;
				}
			}
			ctx.putImageData(map, 0, 0);
			entry.filter.setAttribute("width", width);
			entry.filter.setAttribute("height", height);
			entry.image.setAttribute("width", width);
			entry.image.setAttribute("height", height);
			entry.image.setAttribute("href", canvas.toDataURL());
			el.style.setProperty("--lm-glass-optics", `url("#${entry.filter.id}")`);
		}
		const resize = new ResizeObserver(() => schedule());
		function refresh() {
			frame = 0;
			for (const [el, entry] of entries) {
				if (!el.isConnected || solid.matches || root.dataset.lmPanels !== "liquid") {
					resize.unobserve(el);
					entry.filter.remove();
					el.style.removeProperty("--lm-glass-optics");
					entries.delete(el);
				}
			}
			if (solid.matches || root.dataset.lmPanels !== "liquid") return;
			for (const el of document.querySelectorAll(selector)) {
				// Custom app icons share their parent's material; do not create nested optical surfaces.
				if (el.matches(".main-globalNav-link-icon") && el.closest(".custom-navlinks-scrollable_container")) continue;
				if (!entries.has(el)) {
					const filter = create("filter", { id: `lm-lens-${++serial}`, x: 0, y: 0, width: 1, height: 1, filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB" });
					const image = create("feImage", { x: 0, y: 0, width: "100%", height: "100%", preserveAspectRatio: "none", result: "lens" });
					filter.append(
						image,
						create("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "0.7", result: "soft" }),
						create("feDisplacementMap", { in: "soft", in2: "lens", scale: "18", xChannelSelector: "R", yChannelSelector: "G" }),
					);
					defs.append(filter);
					entries.set(el, { filter, image, key: null });
					resize.observe(el);
				}
				update(el, entries.get(el));
			}
		}
		function schedule() {
			if (!frame) frame = requestAnimationFrame(() => safe(refresh));
		}
		new MutationObserver((records) => {
			if (records.some((record) => !svg.contains(record.target))) schedule();
		}).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
		root.addEventListener("lm-material-change", schedule);
		solid.addEventListener("change", schedule);
		schedule();
	}

	function init() {
		backdrop();
		safe(startGlassOptics);
		applyMode();
		matchMedia(LIGHT_QUERY).addEventListener("change", () => safe(applyMode));
		matchMedia(SOLID_SURFACES_QUERY).addEventListener("change", () => safe(applyAccent));
		watchMarketplaceScheme();
		applyPanelsMode();
		safe(registerSettingsMenu);
		safe(watchLyricsViews);
		Spicetify.Player.addEventListener("onplaypause", () => safe(syncAnimation));
		Spicetify.Player.addEventListener("onprogress", () => loop.id && safe(applySpeed));
		document.addEventListener("visibilitychange", () => safe(syncAnimation));
		for (const query of [MOTION_QUERY, TRANSPARENCY_QUERY]) {
			matchMedia(query).addEventListener("change", () => safe(syncAnimation));
		}
		Spicetify.Player.addEventListener("songchange", () => safe(onSongChange));
		watchPages(0);
		Object.assign(window.LiquidMusic, {
			refresh: () => onSongChange(),
			// The profile menu's settings, from the console too: background("classic" | "static" | "animated"),
			// panels("glass" | "liquid" | "clear")
			background: (mode) => BG_MODES.some(([id]) => id === mode) && (setBackgroundMode(mode), true),
			panels: (mode) => PANEL_MODES.some(([id]) => id === mode) && (setPanelsMode(mode), true),
			state: () => ({ mode: state.mode, auto: state.auto, accent: toHex(state.accent), request: state.request }),
		});
		whenItemReady(0);
	}

	// Flags the current page on <html data-lm-page>. Spicetify.Platform can arrive after the player APIs:
	// wait for its History (bounded to ~10 s).
	function watchPages(attempt) {
		const history = Spicetify.Platform?.History;
		if (!history?.listen) {
			if (attempt < 40) setTimeout(() => watchPages(attempt + 1), 250);
			return;
		}
		const markPage = (location) => (root.dataset.lmPage = pageKind(location?.pathname));
		markPage(history.location);
		history.listen((location) => safe(() => markPage(location)));
	}

	// At startup the player may not know the current item yet: wait for it (bounded to ~10 s).
	function whenItemReady(attempt) {
		if (currentItem() || attempt >= 40) return safe(onSongChange);
		setTimeout(() => whenItemReady(attempt + 1), 250);
	}

	(function waitForSpicetify(attempt) {
		const ready = window.Spicetify?.Player?.addEventListener && Spicetify.Config && document.body;
		if (ready) return safe(init);
		if (attempt >= 100) return warn("Spicetify APIs not available — dynamic colour disabled");
		setTimeout(() => waitForSpicetify(attempt + 1), 100);
	})(0);
})();
