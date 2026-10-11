const storageKey = (trackUuid: string) => `trm_tracks-videoUrlOverride:${trackUuid}`;

export function loadVideoUrlOverride(trackUuid: string): string | undefined {
  try {
    return localStorage.getItem(storageKey(trackUuid)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function saveVideoUrlOverride(trackUuid: string, url: string | undefined): void {
  if (url) {
    localStorage.setItem(storageKey(trackUuid), url);
  } else {
    localStorage.removeItem(storageKey(trackUuid));
  }
}
