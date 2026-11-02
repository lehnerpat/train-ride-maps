export const PageRouting = {
  viewTrackPage(trackId: string): string {
    return `/track/${trackId}/view-new`;
  },
  editTrackPage(trackId: string): string {
    return `/track/${trackId}/edit`;
  },
};
