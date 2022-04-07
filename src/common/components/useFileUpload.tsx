import { useRef } from "react";
import styled from "styled-components";

export const useFileUpload = (id: string, onFileUploaded: (file: File) => void) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showUploadDialog = () => {
    const inputEl = fileInputRef.current;
    if (inputEl === null) return;

    // reset the input so change event fires even when user selects same file as previously
    inputEl.value = "";
    inputEl.files = null;
    inputEl.click();
  };

  const HiddenFileInput = () => (
    <HiddenInput
      type="file"
      id={id}
      ref={fileInputRef}
      onChange={(e) => {
        const files = e.target.files;
        if (!!files && files.length > 0) {
          onFileUploaded(files[0]);
        }
      }}
    />
  );
  return { showUploadDialog, HiddenFileInput };
};

const HiddenInput = styled.input`
  display: none;
`;
