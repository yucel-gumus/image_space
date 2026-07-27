import React, { memo, useRef, useCallback } from 'react';
import { uploadAndProcessImages } from '../../../store/actions';

// =============================================================================
// UploadButton Component
// =============================================================================

const UploadButton = memo(() => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length > 0) {
            uploadAndProcessImages(files);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    return (
        <div className="uploadWrapper">
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload-input"
            />
            <button
                type="button"
                className="uploadButton"
                onClick={handleClick}
                aria-label="Fotoğraf yükle"
                title="Bir veya daha fazla görsel yükle (JPEG, PNG, WEBP)"
            >
                <span className="uploadIcon" aria-hidden="true">
                    +
                </span>
                Görsel Ekle
            </button>
        </div>
    );
});

UploadButton.displayName = 'UploadButton';

export default UploadButton;
