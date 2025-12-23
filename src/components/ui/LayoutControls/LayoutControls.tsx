import { memo, useCallback } from 'react';
import clsx from 'clsx';
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

const LAYOUT_BUTTONS: Array<{ type: LayoutType; label: string }> = [
    { type: 'sphere', label: 'küre' },
    { type: 'grid', label: 'ızgara' },
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
            <div></div>
            <div>
                {LAYOUT_BUTTONS.map(({ type, label }) => (
                    <button
                        key={type}
                        onClick={handleClick(type)}
                        className={clsx({ active: activeLayout === type })}
                        type="button"
                    >
                        {label}
                    </button>
                ))}
            </div>
            <div></div>
        </div>
    );
});

LayoutControls.displayName = 'LayoutControls';

export default LayoutControls;
