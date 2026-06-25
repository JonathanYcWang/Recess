import type { ReactNode } from 'react';
import { Tab, TabList, TabPanel, Tabs, type Key } from 'react-aria-components';

import interaction from '../shared/interaction.module.css';
import styles from './TabList.module.css';

export interface PrimitiveTabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export type PrimitiveTabListOrientation = 'horizontal' | 'vertical';

export interface PrimitiveTabListProps {
  items: PrimitiveTabItem[];
  selectedKey?: Key;
  defaultSelectedKey?: Key;
  onSelectionChange?: (key: Key) => void;
  orientation?: PrimitiveTabListOrientation;
  /** Compact bottom bar vs full-tab sidebar styling */
  layout?: 'compact' | 'full';
  'aria-label': string;
}

export const PrimitiveTabList = ({
  items,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  orientation = 'horizontal',
  layout = 'compact',
  'aria-label': ariaLabel,
}: PrimitiveTabListProps) => (
  <Tabs
    selectedKey={selectedKey}
    defaultSelectedKey={defaultSelectedKey ?? items[0]?.id}
    onSelectionChange={onSelectionChange}
    orientation={orientation}
    className={`${styles.tabs} ${styles[layout]} ${styles[orientation]}`}
  >
    <TabList aria-label={ariaLabel} className={`${styles.tabList} ${interaction.focusVisible}`}>
      {items.map((item) => (
        <Tab key={item.id} id={item.id} className={styles.tab}>
          {item.label}
        </Tab>
      ))}
    </TabList>
    {items.map((item) => (
      <TabPanel key={item.id} id={item.id} className={styles.tabPanel}>
        {item.content}
      </TabPanel>
    ))}
  </Tabs>
);
