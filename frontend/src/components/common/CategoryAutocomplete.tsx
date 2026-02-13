import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { productService } from '../../services/productService';

interface CategoryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const CategoryAutocomplete = ({
  value,
  onChange,
  error,
  required,
}: CategoryAutocompleteProps) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    productService
      .getCategories()
      .then((response) => {
        setCategories(response.data.data);
      })
      .catch(() => {
        // Silently fail — user can still type a custom category
      });
  }, []);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const filtered = categories.filter((cat) =>
    cat.toLowerCase().includes(value.toLowerCase()),
  );

  const showDropdown = isOpen && value.length > 0 && filtered.length > 0;

  const selectCategory = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          const selected = filtered[highlightedIndex];
          if (selected) {
            selectCategory(selected);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  const handleFocus = () => {
    if (value.length > 0 && filtered.length > 0) {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  return (
    <div className="w-full relative">
      <label
        htmlFor="category"
        className="block text-sm font-medium text-text-secondary mb-2"
      >
        Category
        {required && <span className="text-orange ml-1">*</span>}
      </label>
      <input
        ref={inputRef}
        id="category"
        type="text"
        className={`w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200 ${
          error ? 'border-red-500 focus:ring-red-500' : ''
        }`}
        placeholder="Search or enter a category"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls="category-listbox"
        autoComplete="off"
      />
      {showDropdown && (
        <ul
          ref={listRef}
          id="category-listbox"
          role="listbox"
          className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-dark-elevated border border-dark-border rounded-lg shadow-lg"
        >
          {filtered.map((category, index) => (
            <li
              key={category}
              role="option"
              aria-selected={index === highlightedIndex}
              className={`px-4 py-2 cursor-pointer text-text-primary transition-colors duration-100 ${
                index === highlightedIndex
                  ? 'bg-orange/20 text-orange'
                  : 'hover:bg-dark-surface'
              }`}
              onMouseDown={() => selectCategory(category)}
            >
              {category}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};
