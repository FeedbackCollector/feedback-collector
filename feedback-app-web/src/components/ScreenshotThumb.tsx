import { useState } from 'react';
import { resolveScreenshotUrl } from '../service/screenshotUrl';

type Props = {
  url: string;
  size?: 'sm' | 'md';
};

function ScreenshotThumb({ url, size = 'md' }: Props) {
  const [open, setOpen] = useState(false);
  const src = resolveScreenshotUrl(url);

  return (
    <>
      <button
        type="button"
        className={`shot-thumb-btn is-${size}`}
        onClick={() => setOpen(true)}
        aria-label="View screenshot"
      >
        <img className="shot-thumb" src={src} alt="Screenshot attached to this entry" />
      </button>

      {open && (
        <div className="shot-overlay" onClick={() => setOpen(false)}>
          <img
            className="shot-preview"
            src={src}
            alt="Screenshot preview"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default ScreenshotThumb;
