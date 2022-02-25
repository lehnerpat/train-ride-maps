import React, { FC, useState } from "react";
import { readFromJson } from "./route-files";

export const JsonInputTester: FC = () => {
  const [inputText, setInputText] = useState("");

  return (
    <div>
      <input type="file" onChange={(ev) => handleFileChange(ev, setInputText)} />
      <textarea
        value={inputText}
        onChange={(ev) => {
          setInputText(ev.target.value);
        }}
        style={{ width: "500px", height: "300px" }}
      />
      <button
        onClick={() => {
          decodeInput(inputText);
        }}
      >
        Decode
      </button>
    </div>
  );
};

function decodeInput(s: string) {
  const r = readFromJson(s);
  console.log(r);
}

async function handleFileChange(
  ev: React.ChangeEvent<HTMLInputElement>,
  setInputText: React.Dispatch<React.SetStateAction<string>>
) {
  const files = ev.target.files || [];
  const j = await files[0].text();
  const r = readFromJson(j);
  setInputText(JSON.stringify(r));
}
