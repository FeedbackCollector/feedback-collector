import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/DropdownSelect.css';

export type DropdownOption = {
  value: string;
  label: string;
};

type DropdownSelectProps = {
  id: string;
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
};

export default function DropdownSelect({
  id,
  label,
  value,
  options,
  onChange,
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menu = menuRef.current;
    const gap = 6;
    const maxMenuHeight = 240;
    const desiredHeight = Math.min(menu.scrollHeight, maxMenuHeight);

    const spaceBelow = Math.max(0, window.innerHeight - triggerRect.bottom - gap);
    const spaceAbove = Math.max(0, triggerRect.top - gap);
    const openAbove = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
    const availableSpace = openAbove ? spaceAbove : spaceBelow;
    const menuHeight = Math.min(desiredHeight, availableSpace);

    setMenuStyle({
      top: `${openAbove ? triggerRect.top - gap - menuHeight : triggerRect.bottom + gap}px`,
      left: `${triggerRect.left}px`,
      width: `${triggerRect.width}px`,
      maxHeight: `${availableSpace}px`,
    });
  }, [isOpen, options.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleScroll = (event: Event) => {
      if (isOpen && !menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleResize = () => setIsOpen(false);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="dropdown-select" ref={rootRef}>
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={`${id}-menu`}
        className="dropdown-select__trigger"
        disabled={options.length === 0}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{selectedOption?.label ?? 'Select...'}</span>
        <svg className="dropdown-select__arrow" aria-hidden="true" viewBox="0 0 24 24">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <ul
            ref={menuRef}
            id={`${id}-menu`}
            className="dropdown-select__menu"
            style={menuStyle}
            role="listbox"
            aria-label={label}
          >
            {options.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                tabIndex={0}
                className={`dropdown-select__option${option.value === value ? ' is-active' : ''}`}
                onClick={() => handleSelect(option.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelect(option.value);
                  }
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
