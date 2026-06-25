import { useEffect, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { selectRenderableThemePreference } from '@/store/selectors/settingsProjectionSelectors';
import { resolveEffectiveTheme } from '@/styles/theme/resolveEffectiveTheme';

const applyThemeToDocument = (preference: ReturnType<typeof selectRenderableThemePreference>) => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = resolveEffectiveTheme(preference, prefersDark);
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = effective;
};

export const ThemeApplier = ({ children }: { children: ReactNode }) => {
  const themePreference = useSelector(selectRenderableThemePreference);

  useEffect(() => {
    applyThemeToDocument(themePreference);

    if (themePreference !== 'system') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeToDocument('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [themePreference]);

  return children;
};
