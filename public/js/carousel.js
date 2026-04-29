// ── Carrousel de livres ───────────────────────────────────────────────────────
// Initialisé sur chaque élément .carousel-wrapper de la page.
// Déplacement par index : translate le .books-grid d'un multiple de la largeur d'un item.
document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
    const track     = wrapper.querySelector('.books-grid');
    const container = wrapper.querySelector('.carousel-track-container');
    const btnPrev   = wrapper.querySelector('.btn-prev');
    const btnNext   = wrapper.querySelector('.btn-next');

    let currentIndex = 0;

    // Largeur réelle d'un item (incluant le gap) pour calculer le déplacement
    function getItemWidth() {
        const item = track.querySelector('.book-item');
        if (!item) return 176; // 160px + 16px gap par défaut
        return item.offsetWidth + 16;
    }

    function visibleCount() {
        return Math.floor(container.offsetWidth / getItemWidth());
    }

    function totalItems() {
        return track.querySelectorAll('.book-item').length;
    }

    function maxIndex() {
        return Math.max(0, totalItems() - visibleCount());
    }

    function updateCarousel() {
        const offset = currentIndex * getItemWidth();
        track.style.transform = `translateX(-${offset}px)`;
        btnPrev.disabled = currentIndex === 0;
        btnNext.disabled = currentIndex >= maxIndex();
    }

    btnNext.addEventListener('click', () => {
        if (currentIndex < maxIndex()) {
            currentIndex++;
            updateCarousel();
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    // Recalcule les bornes si la fenêtre est redimensionnée
    window.addEventListener('resize', () => {
        currentIndex = Math.min(currentIndex, maxIndex());
        updateCarousel();
    });

    updateCarousel();
});