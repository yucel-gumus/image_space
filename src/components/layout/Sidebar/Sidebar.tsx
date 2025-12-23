import { memo } from 'react';
import clsx from 'clsx';
import useStore from '../../../store';
import { setSidebarOpen, setTargetImage } from '../../../store/actions';
import { truncateDescription } from '../../../utils/text.utils';
import { STORAGE } from '../../../utils/constants';

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
    };

    return (
        <aside className={clsx('sidebar', { open: isSidebarOpen })}>
            <button
                className="closeButton"
                onClick={handleClose}
                aria-label="Kenar çubuğunu kapat"
                type="button"
            >
                <span className="icon">close</span>
            </button>

            <ul>
                {images?.map((image) => (
                    <li key={image.id} onClick={handleImageClick(image.id)}>
                        <img
                            src={`${STORAGE.ROOT_URL}${image.id}`}
                            alt={truncateDescription(image.description, 3)}
                            className="thumbnail"
                            loading="lazy"
                        />
                        <p>{image.description}</p>
                    </li>
                ))}
                {(!images || images.length === 0) && <li>Kullanılabilir görsel yok.</li>}
            </ul>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
