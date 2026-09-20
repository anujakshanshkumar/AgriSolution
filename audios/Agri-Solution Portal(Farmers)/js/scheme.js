
document.addEventListener('DOMContentLoaded', () => {
    const schemeCards = document.querySelectorAll('.schemes-card');
    if (schemeCards.length === 0) {
        console.warn("No elements with the class '.schemes-card' were found.");
        return;
    }
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    };
    const observerOptions = {
        threshold: 0.1
    };
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    schemeCards.forEach(card => {
        observer.observe(card);
    });
});

