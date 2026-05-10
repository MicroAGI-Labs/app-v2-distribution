/**
 * SHIFT — Full-page video background with cursor-reveal spotlight.
 * Base: video at very low opacity across entire page.
 * Cursor: soft radial reveal brightens the video where you move.
 * Footer: canvas fades out gently as footer enters view.
 */

class VideoBackground {
  constructor({ canvasId, videoSrc }) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Hidden video element — try mp4 type explicitly so browser doesn't reject on ext
    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.muted = true;
    this.video.loop = true;
    this.video.playsInline = true;
    this.video.setAttribute('playsinline', '');
    this.video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:-9999px;';
    // Use <source> with explicit type to force mp4 decoding regardless of .mov extension
    const src1 = document.createElement('source');
    src1.src  = videoSrc;
    src1.type  = 'video/mp4';
    this.video.appendChild(src1);
    document.body.appendChild(this.video);

    this.mouse    = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.smooth   = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this._off     = null; // offscreen canvas for spotlight compositing
    this._offCtx  = null;

    this._resize  = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    window.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('touchmove', e => {
      if (e.touches[0]) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    this._resize();
    this.video.play().catch(() => {});
    requestAnimationFrame(() => this._tick());
  }

  /* ── Resize ───────────────────────────────────────────────── */
  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w   = window.innerWidth;
    const h   = window.innerHeight;

    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);
    this.w = w;
    this.h = h;

    // Offscreen canvas for spotlight mask compositing
    this._off        = document.createElement('canvas');
    this._off.width  = w * dpr;
    this._off.height = h * dpr;
    this._offCtx     = this._off.getContext('2d');
    this._offCtx.scale(dpr, dpr);
  }

  /* ── Cover-fit drawImage (like object-fit: cover) ────────── */
  _drawCover(ctx, w, h) {
    const vw = this.video.videoWidth  || w;
    const vh = this.video.videoHeight || h;
    const scale = Math.max(w / vw, h / vh);
    const dw    = vw * scale;
    const dh    = vh * scale;
    const dx    = (w - dw) / 2;
    const dy    = (h - dh) / 2;
    ctx.drawImage(this.video, dx, dy, dw, dh);
  }

  /* ── Footer fade ──────────────────────────────────────────── */
  _footerFade() {
    const footer = document.querySelector('.footer');
    if (!footer) return 1;
    const rect = footer.getBoundingClientRect();
    const vh   = window.innerHeight;
    if (rect.top >= vh) return 1;                     // footer not in view
    const entry = vh - rect.top;                       // px of footer visible
    const over  = footer.offsetHeight * 0.85;         // fade over this distance
    return Math.max(0, 1 - entry / over);
  }

  /* ── Render loop ──────────────────────────────────────────── */
  _tick() {
    if (this.video.readyState < 2) {
      requestAnimationFrame(() => this._tick());
      return;
    }

    const ctx  = this.ctx;
    const w    = this.w;
    const h    = this.h;
    const fade = this._footerFade();

    // Smooth mouse
    this.smooth.x += (this.mouse.x - this.smooth.x) * 0.07;
    this.smooth.y += (this.mouse.y - this.smooth.y) * 0.07;
    const mx = this.smooth.x;
    const my = this.smooth.y;

    ctx.clearRect(0, 0, w, h);

    if (fade < 0.01) {
      requestAnimationFrame(() => this._tick());
      return;
    }

    // ── Layer 1: base video, very low opacity everywhere ───────
    ctx.globalAlpha               = 0.07 * fade;
    ctx.globalCompositeOperation  = 'source-over';
    this._drawCover(ctx, w, h);

    // ── Layer 2: spotlight reveal using offscreen compositing ──
    const off    = this._off;
    const offCtx = this._offCtx;
    offCtx.clearRect(0, 0, w, h);

    // Draw video at full opacity on offscreen canvas
    offCtx.globalAlpha              = 1;
    offCtx.globalCompositeOperation = 'source-over';
    this._drawCover(offCtx, w, h);

    // Punch a soft radial alpha mask into it (destination-in)
    offCtx.globalCompositeOperation = 'destination-in';
    const grad = offCtx.createRadialGradient(mx, my, 0, mx, my, 380);
    grad.addColorStop(0.0,  'rgba(0,0,0,0.42)');
    grad.addColorStop(0.3,  'rgba(0,0,0,0.28)');
    grad.addColorStop(0.65, 'rgba(0,0,0,0.08)');
    grad.addColorStop(1.0,  'rgba(0,0,0,0)');
    offCtx.fillStyle = grad;
    offCtx.fillRect(0, 0, w, h);
    offCtx.globalCompositeOperation = 'source-over';

    // Composite spotlight onto main canvas
    ctx.globalAlpha              = fade;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(off, 0, 0);

    // Reset
    ctx.globalAlpha              = 1;
    ctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(() => this._tick());
  }
}

/* ── Boot ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  new VideoBackground({
    canvasId: 'bgCanvas',
    videoSrc: '/assets/hero-bg.mp4',
  });
});
