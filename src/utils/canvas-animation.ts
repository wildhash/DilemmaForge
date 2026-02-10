// Canvas animation utilities for reveal animations
// Used as fallback when WebView animations are not available

export class RevealAnimation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    this.ctx = ctx;
    this.resize();
  }

  resize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }

  startCooperateAnimation() {
    this.clear();
    this.createParticles('🤝', '#667eea');
    this.animate();
  }

  startDefectAnimation() {
    this.clear();
    this.createParticles('⚔️', '#f5576c');
    this.animate();
  }

  startMixedAnimation() {
    this.clear();
    this.createParticles('💥', '#ffa500');
    this.animate();
  }

  private createParticles(emoji: string, color: string) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const speed = 2 + Math.random() * 3;
      
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        emoji,
        color,
        alpha: 1,
        size: 20 + Math.random() * 20,
      });
    }
  }

  private animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.alpha -= 0.01;

      if (particle.alpha > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.font = `${particle.size}px Arial`;
        this.ctx.fillStyle = particle.color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(particle.emoji, particle.x, particle.y);
        this.ctx.restore();
        return true;
      }
      return false;
    });

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  clear() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  stop() {
    this.clear();
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  color: string;
  alpha: number;
  size: number;
}

// Export functions for easy use in HTML
export function createRevealAnimation(canvasId: string) {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) {
    console.error(`Canvas with id ${canvasId} not found`);
    return null;
  }
  return new RevealAnimation(canvas);
}
