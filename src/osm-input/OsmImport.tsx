import { FC, useRef, useState } from "react";
import styled from "styled-components";
import { parseOsmXml } from "./parse-osm-xml";

export const OsmImport: FC = () => {
  const [message, setMessage] = useState<string>();
  const [isError, setIsError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <MainContainer>
      <h1>OSM Import</h1>
      <div>
        <label htmlFor="osm-import-file-selector">
          Select OSM XML file: <input type="file" id="osm-import-file-selector" ref={inputRef} />
        </label>
        <button
          onClick={async () => {
            if (!inputRef.current) return;
            if (!inputRef.current.files?.length) {
              setIsError(true);
              setMessage("No files selected");
              return;
            }
            if (inputRef.current.files.length > 1) {
              setIsError(true);
              setMessage(`Multiple files are not supported (${inputRef.current.files.length} selected)`);
              return;
            }
            setIsProcessing(true);
            let message: string[] = [];
            try {
              setIsError(false);
              const textInput = await inputRef.current.files[0].text();
              const nodes = parseOsmXml(textInput);
              message.push("Successful!", "", `Parsed ${nodes.length} path nodes`);
            } catch (e) {
              setIsError(true);
              message.push(`${e}`);
            } finally {
              setIsProcessing(false);
              setMessage(message.join("\n"));
            }
          }}
        >
          Import!
        </button>
        {isProcessing && <span style={{ color: "orange", fontWeight: "bold", marginLeft: "10px" }}>Processing...</span>}
      </div>
      {!!message && <MessageBox className={isError ? "error" : ""}>{message}</MessageBox>}
    </MainContainer>
  );
};

const MainContainer = styled.div`
  margin: 10px auto 0;
  max-width: 1000px;
  border: 2px solid gray;
  background: #333;
  padding: 1em;
`;

const MessageBox = styled.div`
  border: 2px solid gray;
  padding: 0.5em;
  font-family: monospace;
  margin-top: 20px;
  white-space: pre-wrap;

  &.error {
    color: #ff7272;
  }
`;
