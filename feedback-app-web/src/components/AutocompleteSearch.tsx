import { useMemo, useState, type KeyboardEvent } from 'react';
import './AutocompleteSearch.css';
import type { AutocompleteSearchProps, SearchSuggestion } from '../types/autoComplete';
import { normalizeSearchText } from '../utils/search';

export default function AutocompleteSearch({
  id,
  className,
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
    const matches = query
      ? suggestions.filter((suggestion) =>
        normalizeSearchText(`${suggestion.label} ${suggestion.searchText ?? ''}`)
          .includes(query)
      )
      : suggestions;
    return matches.slice(0, 6);
  }, [suggestions, value]);

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    onChange(suggestion.value);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!isOpen || matchingSuggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % matchingSuggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? matchingSuggestions.length - 1 : current - 1
      );
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(matchingSuggestions[activeIndex]);
    }
  };

  return (
    <div className={`autocomplete-search ${className}`}>
      <svg aria-hidden="true" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
        <path d="M360-240h440v-107H360v107ZM160-613h120v-107H160v107Zm0 187h120v-107H160v107Zm0 186h120v-107H160v107Zm200-186h440v-107H360v107Zm0-187h440v-107H360v107ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z" />
      </svg>
      <input
        id={id}
        type="search"
        className={inputClassName}
        role="combobox"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={label}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen && matchingSuggestions.length > 0}
        aria-activedescendant={
          isOpen && activeIndex >= 0
            ? `${listId}-option-${activeIndex}`
            : undefined
        }
      />
      {isOpen && matchingSuggestions.length > 0 && (
        <ul className="autocomplete-suggestions" id={listId} role="listbox">
          {matchingSuggestions.map((suggestion, index) => (
            <li
              aria-selected={index === activeIndex}
              className={index === activeIndex ? 'is-active' : ''}
              id={`${listId}-option-${index}`}
              key={suggestion.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
              role="option"
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
