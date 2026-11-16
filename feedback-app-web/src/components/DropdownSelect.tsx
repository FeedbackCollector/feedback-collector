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

  const selectedOption = options.find((opt) => opt.value === value);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        top: `${rect.bottom + 6}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (event: Event) => {
      if (isOpen && !menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', () => setIsOpen(false));

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', () => setIsOpen(false));
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
        className="dropdown-select__trigger"
        disabled={options.length === 0}
        onClick={() => setIsOpen(!isOpen)}
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
            className="dropdown-select__menu"
            style={menuStyle}
          >
            {options.map((option) => (
              <li
                key={option.value}
                aria-selected={option.value === value}
                className={`dropdown-select__option${
                  option.value === value ? ' is-active' : ''
                }`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
}
