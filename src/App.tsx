import { memo, useState, useCallback } from 'react';
import useStore from './store';
import { setLayout, sendQuery, clearQuery } from './store/actions';
import PhotoViz from './components/three/PhotoViz';
import SearchInput from './components/ui/SearchInput';
import LayoutControls from './components/ui/LayoutControls';
import Caption from './components/ui/Caption';
import type { LayoutType } from './types';

// =============================================================================
// App Component
// =============================================================================

const App = memo(() => {
    // Store state
    const layout = useStore.use.layout();
    const isFetching = useStore.use.isFetching();
    const caption = useStore.use.caption();
    const highlightNodes = useStore.use.highlightNodes();

    // Local state
    const [searchValue, setSearchValue] = useState('');

    // Handlers
    const handleSearchChange = useCallback((value: string) => {
        setSearchValue(value);
    }, []);

    const handleSearch = useCallback((query: string) => {
        sendQuery(query);
    }, []);

    const handleClear = useCallback(() => {
        clearQuery();
        setSearchValue('');
    }, []);

    const handleLayoutChange = useCallback((newLayout: LayoutType) => {
        setLayout(newLayout);
    }, []);

    return (
        <main>
            {/* 3D Görselleştirme */}
            <PhotoViz />

            {/* Footer - Kontroller */}
            <footer>
                {/* Caption */}
                <Caption text={caption} />

                {/* Arama Input'u */}
                <SearchInput
                    value={searchValue}
                    onChange={handleSearchChange}
                    onSearch={handleSearch}
                    onClear={handleClear}
                    isLoading={isFetching}
                    hasResults={!!highlightNodes}
                />

                {/* Layout Kontrolleri */}
                <LayoutControls
                    activeLayout={layout}
                    onLayoutChange={handleLayoutChange}
                />
            </footer>
        </main>
    );
});

App.displayName = 'App';

export default App;
