/**
 * SHIFT — Hexagonal dot grid with cursor interaction.
 * Base: faint dots everywhere in a hex pattern.
 * Cursor: ring of brightened dots around cursor, fades to nothing within 50px.
 */

class HexDots {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.mouse  = { x: -9999, y: -9999 };
    this.smooth = { x: -9999, y: -9999 };
    this.dots   = [];

    this.CFG = {
      spacing:     11,    // hex grid spacing (px)
      dotR:        0.65,  // dot radius
      baseOpacity: 0.04,  // ambient opacity everywhere
      peakOpacity: 0.55,  // max opacity at cursor centre
      outerRadius: 220,   // outer edge of influence
    };

    this._resize = this._resize.bind(this);
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
    requestAnimationFrame(() => this._tick());
  }

  _buildGrid() {
    const { spacing } = this.CFG;
    const rowH = spacing * Math.sqrt(3) / 2;
    this.dots  = [];
    const rows = Math.ceil(this.h / rowH) + 2;
    const cols = Math.ceil(this.w / spacing) + 2;

    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const offset = (r % 2 === 0) ? 0 : spacing / 2;
        this.dots.push({
          x: c * spacing + offset,
          y: r * rowH,
        });
      }
    }
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w   = window.innerWidth;
    const h   = window.innerHeight;

    this.canvas.width        = w * dpr;
    this.canvas.height       = h * dpr;
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);
    this.w = w;
    this.h = h;

    this._buildGrid();
  }

  _tick() {
    // Smooth mouse follow
    this.smooth.x += (this.mouse.x - this.smooth.x) * 0.09;
    this.smooth.y += (this.mouse.y - this.smooth.y) * 0.09;

    const ctx = this.ctx;
    const { dotR, baseOpacity, peakOpacity, outerRadius } = this.CFG;
    const mx = this.smooth.x;
    const my = this.smooth.y;

    ctx.clearRect(0, 0, this.w, this.h);

    for (const dot of this.dots) {
      const dx   = dot.x - mx;
      const dy   = dot.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let opacity = baseOpacity;

      if (dist < outerRadius) {
        // Smooth radial falloff: peak at cursor, fades to base at outerRadius
        const t  = dist / outerRadius;          // 0 at cursor → 1 at edge
        const f  = 1 - t * t;                   // quadratic ease-out
        opacity  = baseOpacity + f * (peakOpacity - baseOpacity);
      }

      if (opacity < 0.005) continue;

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${opacity.toFixed(3)})`;
      ctx.fill();
    }

    requestAnimationFrame(() => this._tick());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HexDots('dotsCanvas');
});
