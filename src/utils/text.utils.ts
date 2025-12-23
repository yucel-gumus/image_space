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
export const getFirstSentence = (description: string): string => {
    const firstPeriod = description.indexOf('.');

    if (firstPeriod === -1) {
        return description;
    }

    return description.slice(0, firstPeriod + 1);
};
export const safeJsonParse = <T>(jsonString: string): T | null => {
    try {
        const cleanedString = jsonString
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        return JSON.parse(cleanedString) as T;
    } catch {
        return null;
    }
};
