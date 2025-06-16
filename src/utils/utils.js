export const debounce = (func, delay) => {
    let timeoutId;
    const debounced = (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
    debounced.cancel = () => clearTimeout(timeoutId);
    return debounced;
};