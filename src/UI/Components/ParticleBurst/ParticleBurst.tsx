import { useEffect } from 'react';
import useParticles from '@/UI/Hooks/useParticles';
import styles from './ParticleBurst.module.css';

interface ParticleBurstProps {
  count?: number;
  display: boolean;
  originX?: number;
  originY?: number;
}

const ParticleBurst = ({ count = 80, display, originX = 0, originY = 0 }: ParticleBurstProps) => {
  const { particles, createParticles, clearParticles } = useParticles();

  useEffect(() => {
    if (!display) {
      clearParticles();
      return;
    }

    createParticles(originX, originY, count);
  }, [clearParticles, count, createParticles, display, originX, originY]);

  if (particles.length === 0) {
    return null;
  }

  return (
    <div className={styles.particleLayer} aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={styles.particle}
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: particle.id % 3 === 0 ? '50%' : 2,
            opacity: particle.opacity,
            transform: `rotate(${particle.rotation}deg)`,
            boxShadow: `0 0 ${particle.size}px ${particle.color}`,
          }}
        />
      ))}
    </div>
  );
};

export default ParticleBurst;
