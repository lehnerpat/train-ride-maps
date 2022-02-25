import { FC, useState } from "react";
import { Panel } from "./components/Panel";

interface NewFileStarterProps {
  onCreateNewFile: (videoUrl: string) => void;
}
export const NewFileStarter: FC<NewFileStarterProps> = ({ onCreateNewFile }) => {
  const [videoUrl, setVideoUrl] = useState("");
  return (
    <Panel>
      <div>
        <label htmlFor="new-video-url">Video URL:</label>
        <input
          type="text"
          id="new-video-url"
          value={videoUrl}
          onChange={(ev) => {
            setVideoUrl(ev.target.value);
          }}
        />
      </div>
      <button onClick={() => onCreateNewFile(videoUrl)}>Create new</button>
    </Panel>
  );
};
