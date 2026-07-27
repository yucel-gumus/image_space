import { memo, useCallback } from 'react';
import clsx from 'clsx';
import UploadButton from '../UploadButton';
import type { LayoutType } from '../../../types';

// =============================================================================
// Types
// =============================================================================

interface LayoutControlsProps {
    activeLayout: LayoutType;
    onLayoutChange: (layout: LayoutType) => void;
}

// =============================================================================
// Layout Button Config
// =============================================================================

const LAYOUT_BUTTONS: Array<{ type: LayoutType; label: string; icon: string }> = [
    { type: 'sphere', label: 'küre', icon: 'public' },
    { type: 'grid', label: 'ızgara', icon: 'grid_view' },
];

// =============================================================================
// LayoutControls Component
// =============================================================================

const LayoutControls = memo<LayoutControlsProps>(({ activeLayout, onLayoutChange }) => {
    const handleClick = useCallback(
        (layout: LayoutType) => () => {
            onLayoutChange(layout);
        },
        [onLayoutChange]
    );

    return (
        <div className="controls">
            <div>
                <UploadButton />
            </div>
            <div className="layout-toggle" role="group" aria-label="Yerleşim düzeni">
                {LAYOUT_BUTTONS.map(({ type, label, icon }) => (
                    <button
                        key={type}
                        onClick={handleClick(type)}
                        className={clsx({ active: activeLayout === type })}
                        type="button"
                        aria-pressed={activeLayout === type}
                    >
                        <span className="icon" aria-hidden="true">
                            {icon}
                        </span>
                        <span className="label-full">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
});

LayoutControls.displayName = 'LayoutControls';

export default LayoutControls;
