import React from "react";
import { useRef, useState, useEffect } from "react";
import c from "clsx";
import PhotoViz from "./PhotoViz";
import useStore from "./store";

import {
  setLayout,
  sendQuery,
  clearQuery,
} from "./actions";

const searchPresets = [
  'kış', 
  'matematiksel kavramlar', 
  'sualtı hayvanları', 
  'dairesel şekiller'
]

export default function App() {
  const layout = useStore.use.layout();
  const isFetching = useStore.use.isFetching();
  const caption = useStore.use.caption();
  const highlightNodes = useStore.use.highlightNodes();
  const [value, setValue] = useState("");
  const [searchPresetIdx, setSearchPresetIdx] = useState(0)
  const inputRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() =>
      setSearchPresetIdx(n => n === searchPresets.length - 1 ? 0 : n + 1)
    , 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <main>
      <PhotoViz />
      <footer>
        <div className="caption">
          {caption && (
            <>
              <div />
              {caption}
            </>
          )}
        </div>
        <div className="input">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value) {
                sendQuery(value);
                inputRef.current.blur();
              }
            }}
            ref={inputRef}
            placeholder={`Görselleri ara… "${searchPresets[searchPresetIdx]}"`}
          />
          <img
            src="https://storage.googleapis.com/experiments-uploads/g2demos/photo-applet/spinner.svg"
            className={c("spinner", { active: isFetching })}
          />
          <button
            onClick={() => {
              clearQuery();
              setValue("");
            }}
            className={c("clearButton", { active: highlightNodes })}
          >
            ×
          </button>
        </div>

        <div className="controls">
          <div></div>
          <div>
            <button
              onClick={() => setLayout("sphere")}
              className={c({ active: layout === "sphere" })}
            >
              küre
            </button>
            <button
              onClick={() => setLayout("grid")}
              className={c({ active: layout === "grid" })}
            >
              ızgara
            </button>
          </div>
          <div></div>
        </div>
      </footer>
    </main>
  );
}
