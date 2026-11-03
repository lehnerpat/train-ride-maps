export const PageRouting = {
  viewTrackPage(trackId: string): string {
    return `/track/${trackId}/view`;
  },
  editTrackPage(trackId: string): string {
    return `/track/${trackId}/edit`;
  },
};
