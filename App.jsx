import React, { memo } from "react";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
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
  'yapraklar', 
  'köpek', 
  'tabela'
];

const App = memo(() => {
  const layout = useStore.use.layout();
  const isFetching = useStore.use.isFetching();
  const caption = useStore.use.caption();
  const highlightNodes = useStore.use.highlightNodes();
  const [value, setValue] = useState("");
  const [searchPresetIdx, setSearchPresetIdx] = useState(0);
  const inputRef = useRef(null);

  // Preset rotation effect'ini memoize et
  useEffect(() => {
    const interval = setInterval(() =>
      setSearchPresetIdx(n => n === searchPresets.length - 1 ? 0 : n + 1)
    , 5000);

    return () => clearInterval(interval);
  }, []);

  // Event handler'ları memoize et
  const handleInputChange = useCallback((e) => {
    setValue(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && value) {
      sendQuery(value);
      inputRef.current?.blur();
    }
  }, [value]);

  const handleClearClick = useCallback(() => {
    clearQuery();
    setValue("");
  }, []);

  const handleSphereClick = useCallback(() => {
    setLayout("sphere");
  }, []);

  const handleGridClick = useCallback(() => {
    setLayout("grid");
  }, []);

  // Placeholder text'i memoize et
  const placeholderText = useMemo(() => 
    `Görselleri ara… "${searchPresets[searchPresetIdx]}"`, 
    [searchPresetIdx]
  );

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
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            placeholder={placeholderText}
          />
          <img
            src="https://storage.googleapis.com/experiments-uploads/g2demos/photo-applet/spinner.svg"
            className={c("spinner", { active: isFetching })}
            alt="Loading"
          />
          <button
            onClick={handleClearClick}
            className={c("clearButton", { active: highlightNodes })}
            aria-label="Clear search"
          >
            ×
          </button>
        </div>

        <div className="controls">
          <div></div>
          <div>
            <button
              onClick={handleSphereClick}
              className={c({ active: layout === "sphere" })}
            >
              küre
            </button>
            <button
              onClick={handleGridClick}
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
});

App.displayName = 'App';

export default App;
