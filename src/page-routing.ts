export const PageRouting = {
  viewTrackPage(trackId: string): string {
    return `/track/${trackId}`;
  },
  viewTrackPageV2(trackId: string): string {
    return `/trackv2/${trackId}`;
  },
};
