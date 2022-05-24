export const useFileDownload = (
  filename: string,
  provideFileContents: () => string,
  fileType: string = "application/json"
) => {
  return () => {
    const contents = provideFileContents();
    if (!contents) return;

    const element = document.createElement("a");
    const file = new Blob([contents], { type: fileType });
    const fileDownloadUrl = URL.createObjectURL(file);
    element.href = fileDownloadUrl;
    element.download = filename;
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    URL.revokeObjectURL(fileDownloadUrl);
    document.body.removeChild(element);
  };
};
