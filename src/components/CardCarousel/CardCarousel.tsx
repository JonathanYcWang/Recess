import Icon from '../Icon/Icon';
import RefreshButton from '../RefreshButton/RefreshButton';
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

type CardProps = Omit<CardCarouselItem, 'id'>;

const Card = ({ title, description, footer, onClick, refreshOnClick }: CardProps) => {
  return (
    <div className={styles.cardWrapper}>
      <div className={styles.card} onClick={onClick}>
        <p className={styles.title}>{title}</p>
        <p className={styles.description}>{description}</p>
        <div className={styles.placeholderImage}>
          <Icon
            src={`https://www.google.com/s2/favicons?domain=${description}&sz=128`}
            alt="Placeholder"
            size="md"
          />
        </div>
        {footer && <p className={styles.footer}>{footer}</p>}
      </div>
      {refreshOnClick && (
        <div className={styles.refreshButtonContainer}>
          <RefreshButton onClick={refreshOnClick} />
        </div>
      )}
    </div>
  );
};

const CardCarousel = ({ cards }: CardCarouselProps) => {
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
