import React from 'react';
import Card from './Card';
import styles from './CardCarousel.module.css';

export interface CardCarouselItem {
  id: string;
  title: string;
  description: string;
  footer?: string;
  onClick?: () => void;
  refreshOnClick?: () => void;
}

interface CardCarouselProps {
  cards: CardCarouselItem[];
}

const CardCarousel: React.FC<CardCarouselProps> = ({ cards }) => {
  return (
    <div className={styles.carousel}>
      <div className={styles.carouselContainer}>
        {cards.map((card) => (
          <Card
            key={card.id}
            title={card.title}
            description={card.description}
            footer={card.footer}
            onClick={card.onClick}
            refreshOnClick={card.refreshOnClick}
          />
        ))}
      </div>
    </div>
  );
};

export default CardCarousel;

