import React from "react";

import c from "clsx";
import useStore from "./store";
import { setSidebarOpen, setTargetImage } from "./actions";

const truncateDescription = (description, wordLimit = 7) => {
  if (!description) {
    return "";
  }
  const words = description.split(" ");
  if (words.length <= wordLimit) {
    return description;
  }
  return words.slice(0, wordLimit).join(" ") + " ...";
};

const Sidebar = () => {
  const images = useStore.use.images();
  const isSidebarOpen = useStore.use.isSidebarOpen();

  return (
    <aside className={c("sidebar", { open: isSidebarOpen })}>
      <button
        className="closeButton"
        onClick={() => setSidebarOpen(false)}
        aria-label="Kenar çubuğunu kapat"
      >
        <span className="icon">close</span>
      </button>

      <ul>
        {images?.map((image) => (
          <li key={image.id} onClick={() => setTargetImage(image.id)}>
            <img
              src={`https://www.gstatic.com/aistudio/starter-apps/photosphere/${image.id}`}
              alt={truncateDescription(image.description, 3)}
              className="thumbnail"
            />
            <p>{image.description}</p>
          </li>
        ))}
        {(!images || images.length === 0) && <li>Kullanılabilir görsel yok.</li>}
      </ul>
    </aside>
  );
};

export default Sidebar;
