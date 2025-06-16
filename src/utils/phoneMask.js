export const formatPhoneNumber = (rawValue) => {
    let digits = rawValue.replace(/\D/g, '');
    if (!digits.startsWith('380')) {
        digits = '380' + digits;
    }
    if (digits.length > 12) {
        digits = digits.slice(0, 12);
    }

    let formatted = '+' + digits.slice(0, 3);
    if (digits.length > 3) {
        const area = digits.slice(3, Math.min(5, digits.length));
        formatted += ' (' + area;
        if (area.length === 2) {
            formatted += ')';
        }
    }
    if (digits.length > 5) {
        formatted += ' ' + digits.slice(5, Math.min(8, digits.length));
    }
    if (digits.length > 8) {
        formatted += '-' + digits.slice(8, Math.min(10, digits.length));
    }
    if (digits.length > 10) {
        formatted += '-' + digits.slice(10, Math.min(12, digits.length));
    }

    return formatted;
};
