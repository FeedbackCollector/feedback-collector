import { useMemo, useState, type KeyboardEvent } from 'react';
import '../styles/AutocompleteSearch.css';
import type { AutocompleteSearchProps, SearchSuggestion } from '../types/autoComplete';
import { normalizeSearchText } from '../utils/search';

export default function AutocompleteSearch({
  id,
  className = '',
  label,
  placeholder,
  inputClassName,
  value,
  suggestions,
  onChange,
}: AutocompleteSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = `${id}-suggestions`;

  const matchingSuggestions = useMemo(() => {
    const query = normalizeSearchText(value.trim());
    if (!query) return suggestions.slice(0, 6);

    return suggestions
      .filter((s) => normalizeSearchText(`${s.label} ${s.searchText ?? ''}`).includes(query))
      .slice(0, 6);
  }, [suggestions, value]);

  const showDropdown = isOpen && matchingSuggestions.length > 0;

  const closeMenu = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    onChange(suggestion.value);
    closeMenu();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') return closeMenu();
    if (!showDropdown) return;

    const total = matchingSuggestions.length;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % total);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? total - 1 : prev - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(matchingSuggestions[activeIndex]);
    }
  };

  return (
    <div className={`autocomplete-search ${className}`.trim()}>
      <input
        id={id}
        type="search"
        className={inputClassName}
        role="combobox"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showDropdown}
        aria-activedescendant={
          showDropdown && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
      />

      {showDropdown && (
        <ul className="autocomplete-suggestions" id={listId} role="listbox">
          {matchingSuggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? 'is-active' : ''}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
            >
              <span>{suggestion.label}</span>
              {suggestion.detail && <small>{suggestion.detail}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
