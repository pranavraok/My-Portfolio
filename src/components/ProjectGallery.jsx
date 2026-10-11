import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import AssetImage from "./AssetImage.jsx";

export default function ProjectGallery({ project }) {
  const dialog = useRef(null);
  const previousOverflow = useRef(null);
  const [selected, setSelected] = useState(0);
  const image = project.images[selected];
  const restoreScroll = () => {
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
  };
  useEffect(() => () => restoreScroll(), []);
  const openImage = (index) => {
    setSelected(index);
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.showModal();
  };
  return (
    <div className="project-media-gallery" style={{ "--media-color": project.color }}>
      {project.images.map((picture, index) => (
        <figure key={picture.src}>
          <button className="project-gallery-image" aria-label={`Enlarge ${project.title} image ${index + 1}`} onClick={() => openImage(index)}>
            <AssetImage src={picture.src} alt={picture.alt} width={picture.width} height={picture.height} loading={index === 0 ? "eager" : "lazy"} />
            <span className="project-image-zoom"><Icon name="external" size={17} /> Enlarge image</span>
          </button>
          <figcaption>{project.title} · Project preview</figcaption>
        </figure>
      ))}
      <dialog ref={dialog} className="project-image-dialog" aria-label={`${project.title} image viewer`} onClose={restoreScroll} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }} data-lenis-prevent>
        <div className="project-image-dialog-header"><span>{project.title}</span><button aria-label="Close image viewer" onClick={() => dialog.current.close()}><Icon name="close" size={22} /></button></div>
        <AssetImage src={image.src} alt={image.alt} width={image.width} height={image.height} loading="eager" />
        {project.images.length > 1 ? <div className="project-image-dialog-controls"><button aria-label="Previous project image" onClick={() => setSelected(value => (value - 1 + project.images.length) % project.images.length)}><Icon name="back" /></button><span>{selected + 1} / {project.images.length}</span><button aria-label="Next project image" onClick={() => setSelected(value => (value + 1) % project.images.length)}><Icon name="arrow" /></button></div> : null}
      </dialog>
    </div>
  );
}
