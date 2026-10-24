import { FC, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
} from "@mui/material";
import { VideoFile as VideoFileIcon } from "@mui/icons-material";

export const VideoOverrideButton: FC<{
  override: string | undefined;
  onChange: (url: string | undefined, options?: { isLocalFile?: boolean }) => void;
}> = ({ override, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const close = () => setIsOpen(false);

  return (
    <>
      <IconButton
        color={override ? "secondary" : "inherit"}
        title="Override video source"
        aria-label="Override video source"
        onClick={() => {
          setText(override?.startsWith("blob:") ? "" : (override ?? ""));
          setIsOpen(true);
        }}
      >
        <VideoFileIcon />
      </IconButton>
      <Dialog open={isOpen} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>Override video source</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Play a video file instead of the track's video. This is stored only in this browser and is not included in
            downloaded tracks. A selected file is only kept until the page is reloaded; a URL or server-side absolute
            path is remembered.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Video URL or absolute path"
            value={text}
            onChange={(ev) => setText(ev.target.value)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(ev) => {
              const file = ev.target.files?.[0];
              ev.target.value = "";
              if (!file) return;
              onChange(URL.createObjectURL(file), { isLocalFile: true });
              close();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => fileInputRef.current?.click()}>Choose file…</Button>
          <Button
            disabled={!override}
            onClick={() => {
              onChange(undefined);
              close();
            }}
          >
            Remove override
          </Button>
          <Button onClick={close}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!text.trim()}
            onClick={() => {
              onChange(text.trim());
              close();
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
