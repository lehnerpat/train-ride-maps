import { Track, Tracks } from ".";

class TrackLocalStorageServiceImpl {
  load(trackId: string): Track | null {
    return this.loadKey(this.makeKey(trackId));
  }

  private loadKey(key: string): Track | null {
    const loadedValue = localStorage.getItem(key);
    if (loadedValue === null) return null;
    return Tracks.readFromJson(loadedValue);
  }

  save(value: Track) {
    const serializedTrack = Tracks.serializeToJson(value);
    console.debug(`Saving track id ${value.uuid} with size ${serializedTrack.length}`);
    localStorage.setItem(this.makeKey(value.uuid), serializedTrack);
  }

  getList(): Track[] {
    const tracks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(storageKeyPrefix)) {
        const r = this.loadKey(key);
        if (r !== null) tracks.push(r);
      }
    }
    return tracks;
  }

  delete(trackId: string) {
    localStorage.removeItem(this.makeKey(trackId));
  }

  private makeKey(trackId: string): string {
    return storageKeyPrefix + trackId;
  }
}

const storageKeyPrefix = "trm_tracks-v2_";

export const TrackLocalStorageService = new TrackLocalStorageServiceImpl();
