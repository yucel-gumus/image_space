import { memo } from 'react';

// =============================================================================
// Types
// =============================================================================

interface CaptionProps {
    text: string | null;
}

// =============================================================================
// Caption Component
// =============================================================================

const Caption = memo<CaptionProps>(({ text }) => {
    if (!text) {
        return null;
    }

    return (
        <div className="caption">
            <div />
            {text}
        </div>
    );
});

Caption.displayName = 'Caption';

export default Caption;
