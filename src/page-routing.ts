export const PageRouting = {
  viewTrackPage(trackId: string, mode?: "view" | "edit"): string {
    return `/track/${trackId}${mode && mode !== "view" ? `/${mode}` : ""}`;
  },
};
