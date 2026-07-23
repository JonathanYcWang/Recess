import { defineManifest } from '@crxjs/vite-plugin';

// MV3 manifest expressed as a Vite config module so @crxjs/vite-plugin can
// build the popup (action.default_popup) and background service worker
// (background.service_worker) from source in a single dev/build pipeline.
export default defineManifest({
  manifest_version: 3,
  name: 'Recess',
  version: '1.0.0',
  description: 'A focus session manager with breaks and site blocking',
  permissions: ['storage', 'tabs', 'alarms', 'notifications'],
  action: {
    default_title: 'Recess',
    default_popup: 'index.html',
  },
  background: {
    service_worker: 'src/Background/background.ts',
  },
  icons: {
    '16': 'assets/logo.png',
    '48': 'assets/logo.png',
    '128': 'assets/logo.png',
  },
});
