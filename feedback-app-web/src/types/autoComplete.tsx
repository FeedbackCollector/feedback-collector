export type SearchSuggestion = {
  id: string;
  label: string;
  value: string;
  searchText?: string;
  detail?: string;
};

export type AutocompleteSearchProps = {
  id: string;
  className: string;
  label: string;
  placeholder: string;
  inputClassName?: string;
  value: string;
  suggestions: SearchSuggestion[];
  onChange: (value: string) => void;
};