import { useCallback, useEffect, useState } from 'react';

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

interface ParticleOptions {
  colors?: string[];
}

const DEFAULT_PARTICLE_COLORS = ['#ffffff', '#f1f0f0', '#e7e5e4', '#b4b4b4', '#717171', '#1b1b1b'];

const useParticles = ({ colors = DEFAULT_PARTICLE_COLORS }: ParticleOptions = {}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const createParticles = useCallback(
    (cx: number, cy: number, count: number) => {
      setParticles(
        Array.from({ length: count }, (_, id) => {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + Math.random() * 3.5;

          return {
            id,
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 4 + Math.random() * 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            opacity: 1,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
          };
        })
      );
    },
    [colors]
  );

  const clearParticles = useCallback(() => {
    setParticles([]);
  }, []);

  useEffect(() => {
    if (particles.length === 0) {
      return undefined;
    }

    let raf: number;

    const tick = () => {
      setParticles((previousParticles) =>
        previousParticles
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.12,
            opacity: particle.opacity - 0.018,
            rotation: particle.rotation + particle.rotationSpeed,
          }))
          .filter((particle) => particle.opacity > 0)
      );
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [particles.length]);

  return { particles, createParticles, clearParticles };
};

export default useParticles;
