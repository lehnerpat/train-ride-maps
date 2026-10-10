export function isTrackTitleValid(title: string): boolean {
  return title.trim().length > 0;
}

export function isVideoUrlValid(videoUrl: string): boolean {
  return videoUrl.startsWith("https://");
}

export function isTrackInfoValid(title: string, videoUrl: string): boolean {
  return isTrackTitleValid(title) && isVideoUrlValid(videoUrl);
}
