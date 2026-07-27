export const truncateDescription = (
    description: string | undefined | null,
    wordLimit: number = 7
): string => {
    if (!description) {
        return '';
    }

    const words = description.split(' ');

    if (words.length <= wordLimit) {
        return description;
    }

    return words.slice(0, wordLimit).join(' ') + ' ...';
};

export const safeJsonParse = <T>(jsonString: string): T | null => {
    if (!jsonString) return null;
    try {
        const cleanedString = jsonString
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

        // 1. Direct parse attempt
        try {
            return JSON.parse(cleanedString) as T;
        } catch {
            // Ignore failure, fall through to regex extraction
        }

        // 2. Extract JSON object from text using regex matching outer braces
        const match = cleanedString.match(/\{[\s\S]*\}/);
        if (match) {
            const extracted = match[0].trim();
            try {
                return JSON.parse(extracted) as T;
            } catch {
                // If standard JSON.parse fails, try replacing trailing commas or unquoted keys
                const sanitized = extracted
                    .replace(/,\s*([\}\]])/g, '$1') // remove trailing commas
                    .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); // quote unquoted keys
                return JSON.parse(sanitized) as T;
            }
        }

        return null;
    } catch (err) {
        console.warn('safeJsonParse error:', err, 'Raw string:', jsonString);
        return null;
    }
};
