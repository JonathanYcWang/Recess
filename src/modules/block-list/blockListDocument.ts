export interface BlockListValue {
  entries: string[];
}

const DEFAULT_ENTRIES = [
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'messenger.com',
  'web.whatsapp.com',
  'discord.com',
  'tiktok.com',
  'netflix.com',
  'primevideo.com',
  'amazon.com',
  'reddit.com',
];

export const createDefaultBlockListValue = (): BlockListValue => ({
  entries: [...DEFAULT_ENTRIES],
});
