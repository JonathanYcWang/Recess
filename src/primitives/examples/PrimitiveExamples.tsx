import { useState } from 'react';

import {
  PrimitiveAlert,
  PrimitiveButton,
  PrimitiveCard,
  PrimitiveDialog,
  PrimitiveLink,
  PrimitiveLiveRegion,
  PrimitivePanel,
  PrimitiveSelect,
  PrimitiveSlider,
  PrimitiveSwitch,
  PrimitiveTabList,
  PrimitiveTextArea,
  PrimitiveTextField,
} from '@/primitives';

import styles from './PrimitiveExamples.module.css';

const selectOptions = [
  { id: 'low', label: 'Low energy', value: 'low' },
  { id: 'medium', label: 'Medium energy', value: 'medium' },
  { id: 'high', label: 'High energy', value: 'high' },
];

const tabItems = [
  { id: 'focus', label: 'Focus', content: <p>Focus tab panel content.</p> },
  { id: 'schedule', label: 'Schedule', content: <p>Schedule tab panel content.</p> },
];

/**
 * Composition reference for feature migrations (#115). Mounted on /primitive-examples for e2e axe.
 */
export const PrimitiveExamples = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Primitive examples</h1>

      <PrimitivePanel title="Actions and links">
        <div className={styles.row}>
          <PrimitiveButton variant="primary">Primary</PrimitiveButton>
          <PrimitiveButton variant="secondary">Secondary</PrimitiveButton>
          <PrimitiveButton variant="destructive">Destructive</PrimitiveButton>
          <PrimitiveButton variant="ghost">Ghost</PrimitiveButton>
          <PrimitiveButton variant="primary" isLoading>
            Loading
          </PrimitiveButton>
          <PrimitiveButton variant="primary" disabled>
            Disabled
          </PrimitiveButton>
        </div>
        <PrimitiveLink href="#focus">Ink link with underline</PrimitiveLink>
      </PrimitivePanel>

      <PrimitivePanel title="Form controls">
        <PrimitiveTextField
          label="Task name"
          description="Short label for the active task."
          placeholder="Write release notes"
        />
        <PrimitiveTextField
          label="Email"
          type="email"
          isInvalid
          errorMessage="Enter a valid email address."
          defaultValue="not-an-email"
        />
        <PrimitiveTextArea label="Notes" description="Optional context for the next session." />
        <PrimitiveSelect label="Energy" options={selectOptions} defaultSelectedKey="medium" />
        <PrimitiveSwitch label="Sound effects" defaultSelected />
        <PrimitiveSlider
          label="Duration (minutes)"
          defaultValue={60}
          minValue={15}
          maxValue={180}
          step={15}
        />
      </PrimitivePanel>

      <PrimitivePanel title="Navigation">
        <PrimitiveTabList items={tabItems} aria-label="Section navigation" layout="compact" />
      </PrimitivePanel>

      <PrimitivePanel title="Status and surfaces">
        <PrimitiveAlert variant="error" title="Disconnected">
          Settings could not be saved. Retry when the extension reconnects.
        </PrimitiveAlert>
        <PrimitiveCard title="Insights card">
          <p>Estimate accuracy: 82% over the last 30 sessions.</p>
        </PrimitiveCard>
      </PrimitivePanel>

      <PrimitivePanel title="Dialog">
        <PrimitiveButton variant="secondary" onClick={() => setDialogOpen(true)}>
          Open dialog
        </PrimitiveButton>
        <PrimitiveButton
          variant="ghost"
          onClick={() => setLiveMessage(`Saved at ${new Date().toLocaleTimeString()}`)}
        >
          Announce save
        </PrimitiveButton>
        <PrimitiveLiveRegion>{liveMessage}</PrimitiveLiveRegion>
        <PrimitiveDialog
          isOpen={dialogOpen}
          title="Confirm change"
          description="This dialog traps focus and restores it on close."
          onOpenChange={setDialogOpen}
        >
          <div className={styles.row}>
            <PrimitiveButton variant="primary" onClick={() => setDialogOpen(false)}>
              Confirm
            </PrimitiveButton>
            <PrimitiveButton variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </PrimitiveButton>
          </div>
        </PrimitiveDialog>
      </PrimitivePanel>
    </main>
  );
};
