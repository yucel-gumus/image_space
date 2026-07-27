import React, { memo, useRef, useCallback, useMemo, useState, useEffect } from 'react';
import clsx from 'clsx';
import { SEARCH_PRESETS, SEARCH_PRESET_INTERVAL, STORAGE } from '../../../utils/constants';

// =============================================================================
// Types
// =============================================================================

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: (query: string) => void;
    onClear: () => void;
    isLoading?: boolean;
    hasResults?: boolean;
}

// =============================================================================
// SearchInput Component
// =============================================================================

const SearchInput = memo<SearchInputProps>(({
    value,
    onChange,
    onSearch,
    onClear,
    isLoading = false,
    hasResults = false,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [presetIndex, setPresetIndex] = useState(0);
    const [isFocused, setIsFocused] = useState(false);

    // Preset rotasyonu (sadece input boş ve odaksızken çalışır)
    useEffect(() => {
        if (isFocused || value.trim().length > 0) return;

        const interval = setInterval(() => {
            setPresetIndex((prev) => (prev === SEARCH_PRESETS.length - 1 ? 0 : prev + 1));
        }, SEARCH_PRESET_INTERVAL);

        return () => clearInterval(interval);
    }, [isFocused, value]);

    // Handlers
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
        },
        [onChange]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && value.trim()) {
                onSearch(value);
                inputRef.current?.blur();
            }
        },
        [value, onSearch]
    );

    const handleClear = useCallback(() => {
        onClear();
    }, [onClear]);

    // Placeholder
    const placeholder = useMemo(
        () => `Görselleri ara… "${SEARCH_PRESETS[presetIndex]}"`,
        [presetIndex]
    );

    return (
        <div className="input">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                aria-label="Görsellerde ara"
            />
            <img
                src={STORAGE.SPINNER_URL}
                className={clsx('spinner', { active: isLoading })}
                alt="Yükleniyor"
            />
            <button
                onClick={handleClear}
                className={clsx('clearButton', { active: hasResults })}
                aria-label="Aramayı temizle"
                type="button"
            >
                ×
            </button>
        </div>
    );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;
