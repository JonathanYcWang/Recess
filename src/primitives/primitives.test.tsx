import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

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
import { PrimitiveExamples } from '@/primitives/examples/PrimitiveExamples';

describe('PrimitiveButton', () => {
  it('renders semantic button with variant and disabled protection', () => {
    const markup = renderToStaticMarkup(
      <>
        <PrimitiveButton variant="primary">Save</PrimitiveButton>
        <PrimitiveButton variant="destructive" disabled>
          Delete
        </PrimitiveButton>
        <PrimitiveButton variant="primary" isLoading>
          Saving
        </PrimitiveButton>
      </>
    );

    expect(markup).toContain('<button');
    expect(markup).toContain('Save');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-disabled="true"');
  });
});

describe('PrimitiveLink', () => {
  it('renders anchor with href', () => {
    const markup = renderToStaticMarkup(<PrimitiveLink href="/settings">Settings</PrimitiveLink>);
    expect(markup).toContain('<a');
    expect(markup).toContain('href="/settings"');
  });
});

describe('PrimitiveTextField', () => {
  it('associates label, description, and error message', () => {
    const markup = renderToStaticMarkup(
      <PrimitiveTextField
        label="Email"
        description="We never share your email."
        isInvalid
        errorMessage="Invalid email."
        defaultValue="bad"
      />
    );

    expect(markup).toContain('Email');
    expect(markup).toContain('We never share your email.');
    expect(markup).toContain('Invalid email.');
    expect(markup).toContain('<input');
  });
});

describe('PrimitiveTextArea', () => {
  it('renders multiline control with label', () => {
    const markup = renderToStaticMarkup(<PrimitiveTextArea label="Notes" rows={3} />);
    expect(markup).toContain('<textarea');
    expect(markup).toContain('Notes');
  });
});

describe('PrimitiveSelect', () => {
  it('renders labeled select trigger and options', () => {
    const markup = renderToStaticMarkup(
      <PrimitiveSelect
        label="Energy"
        options={[
          { id: 'low', label: 'Low', value: 'low' },
          { id: 'high', label: 'High', value: 'high' },
        ]}
        defaultSelectedKey="low"
      />
    );

    expect(markup).toContain('Energy');
    expect(markup).toContain('Low');
    expect(markup).toContain('High');
  });
});

describe('PrimitiveSwitch', () => {
  it('renders switch with visible label', () => {
    const markup = renderToStaticMarkup(<PrimitiveSwitch label="Sound" defaultSelected />);
    expect(markup).toContain('Sound');
    expect(markup).toContain('role="switch"');
  });
});

describe('PrimitiveDialog', () => {
  it('renders nothing when closed (portal content mounts client-side)', () => {
    const markup = renderToStaticMarkup(
      <PrimitiveDialog isOpen={false} title="Hidden" onOpenChange={() => undefined} />
    );
    expect(markup).toBe('');
  });
});

describe('PrimitiveTabList', () => {
  it('renders tablist with panels', () => {
    const markup = renderToStaticMarkup(
      <PrimitiveTabList
        aria-label="Sections"
        items={[
          { id: 'a', label: 'Alpha', content: <p>Alpha panel</p> },
          { id: 'b', label: 'Beta', content: <p>Beta panel</p> },
        ]}
      />
    );

    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('role="tab"');
    expect(markup).toContain('role="tabpanel"');
    expect(markup).toContain('Alpha panel');
    expect(markup).toContain('Beta');
  });
});

describe('PrimitiveAlert', () => {
  it('uses alert role by default', () => {
    const markup = renderToStaticMarkup(
      <PrimitiveAlert title="Error">Something failed.</PrimitiveAlert>
    );
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Something failed.');
  });
});

describe('PrimitiveLiveRegion', () => {
  it('exposes polite live region semantics', () => {
    const markup = renderToStaticMarkup(
      <PrimitiveLiveRegion politeness="polite">Saved.</PrimitiveLiveRegion>
    );
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('role="status"');
  });
});

describe('PrimitiveCard and PrimitivePanel', () => {
  it('render section landmarks', () => {
    const markup = renderToStaticMarkup(
      <>
        <PrimitiveCard title="Card">Body</PrimitiveCard>
        <PrimitivePanel title="Panel">Content</PrimitivePanel>
      </>
    );
    expect(markup).toContain('<section');
    expect(markup).toContain('Card');
    expect(markup).toContain('Panel');
  });
});

describe('PrimitiveSlider', () => {
  it('renders labeled slider with output', () => {
    const markup = renderToStaticMarkup(
      <PrimitiveSlider label="Duration" defaultValue={30} minValue={15} maxValue={120} step={15} />
    );
    expect(markup).toContain('Duration');
    expect(markup).toContain('type="range"');
    expect(markup).toContain('aria-valuetext="30"');
  });
});

describe('PrimitiveExamples', () => {
  it('composes primitives for migration reference', () => {
    const markup = renderToStaticMarkup(<PrimitiveExamples />);
    expect(markup).toContain('Primitive examples');
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('role="switch"');
    expect(markup).toContain('type="range"');
    expect(markup).toContain('role="alert"');
  });
});
