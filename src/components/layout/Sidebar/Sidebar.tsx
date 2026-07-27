import { memo } from 'react';
import clsx from 'clsx';
import useStore from '../../../store';
import { setSidebarOpen, setTargetImage } from '../../../store/actions';
import { truncateDescription } from '../../../utils/text.utils';
import { getImageUrl } from '../../../services/texture/texture.service';

// =============================================================================
// Sidebar Component
// =============================================================================

const Sidebar = memo(() => {
    const images = useStore.use.images();
    const isSidebarOpen = useStore.use.isSidebarOpen();

    const handleClose = () => {
        setSidebarOpen(false);
    };

    const handleImageClick = (imageId: string) => () => {
        setTargetImage(imageId);
        setSidebarOpen(false);
    };

    const count = images?.length ?? 0;

    return (
        <aside
            className={clsx('sidebar', { open: isSidebarOpen })}
            aria-hidden={!isSidebarOpen}
            aria-label="Görsel kütüphanesi"
        >
            <div className="sidebar-header">
                <div className="sidebar-heading">
                    <h2>Kütüphane</h2>
                    <span>{count > 0 ? `${count} görsel` : 'Henüz görsel yok'}</span>
                </div>
                <button
                    className="closeButton"
                    onClick={handleClose}
                    aria-label="Kenar çubuğunu kapat"
                    type="button"
                >
                    <span className="icon" aria-hidden="true">
                        close
                    </span>
                </button>
            </div>

            <ul>
                {images?.map((image) => (
                    <li key={image.id} onClick={handleImageClick(image.id)}>
                        <img
                            src={getImageUrl(image.id)}
                            alt={truncateDescription(image.description, 3)}
                            className="thumbnail"
                            loading="lazy"
                        />
                        <p>{image.description}</p>
                    </li>
                ))}
                {(!images || images.length === 0) && (
                    <li className="empty-state">Kütüphanede görsel bulunamadı.</li>
                )}
            </ul>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
