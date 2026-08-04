import { memo, useState, useCallback, useEffect } from 'react';
import useStore from './store';
import { init, setLayout, sendQuery, clearQuery, setSidebarOpen } from './store/actions';
import PhotoViz from './components/three/PhotoViz';
import SearchInput from './components/ui/SearchInput';
import LayoutControls from './components/ui/LayoutControls';
import Caption from './components/ui/Caption';
import Sidebar from './components/layout/Sidebar';
import type { LayoutType } from './types';

// =============================================================================
// App Component
// =============================================================================

const App = memo(() => {
    useEffect(() => {
        init();
    }, []);

    const layout = useStore.use.layout();
    const isFetching = useStore.use.isFetching();
    const caption = useStore.use.caption();
    const highlightNodes = useStore.use.highlightNodes();
    const images = useStore.use.images();

    const [searchValue, setSearchValue] = useState('');

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

    const handleOpenLibrary = useCallback(() => {
        setSidebarOpen(true);
    }, []);

    const imageCount = images?.length ?? 0;

    return (
        <main>
            <PhotoViz />

            <header className="app-header">
                <div className="brand" aria-label="Resim Uzayı">
                    <div className="brand-mark" aria-hidden="true" />
                    <div className="brand-text">
                        <span className="brand-title">Resim Uzayı</span>
                        <span className="brand-subtitle">KensaI ile Semantik keşif</span>
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        type="button"
                        className="ghost-btn"
                        onClick={handleOpenLibrary}
                        aria-label="Görsel kütüphanesini aç"
                    >
                        <span className="icon" aria-hidden="true">
                            photo_library
                        </span>
                        <span>
                            Kütüphane
                            {imageCount > 0 ? ` · ${imageCount}` : ''}
                        </span>
                    </button>
                </div>
            </header>

            <Sidebar />

            <footer>
                <Caption text={caption} />

                <SearchInput
                    value={searchValue}
                    onChange={handleSearchChange}
                    onSearch={handleSearch}
                    onClear={handleClear}
                    isLoading={isFetching}
                    hasResults={!!highlightNodes}
                />

                <div className="text-xs opacity-75">
                    Geliştirici: <a href="https://www.yucelgumus.dev/" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:opacity-100">Yücel Gümüş</a>
                </div>
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
