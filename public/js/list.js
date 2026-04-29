// ── Suppression de livres depuis la collection ────────────────────────────────
// Le bookKey (ex: "/works/OL123W") est stocké dans data-book-key sur chaque bouton
document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', async function() {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce livre de votre collection ?')) {
            return;
        }

        const bookKey = this.dataset.bookKey;

        try {
            const response = await fetch('/books/status/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_book_id: bookKey
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Livre supprimé de votre collection');
                window.location.reload();
            } else {
                alert('Erreur: ' + (data.error || 'Impossible de supprimer le livre'));
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la suppression');
        }
    });
});


// ── Comptage total des livres (affiché en console au chargement) ──────────────
// Extrait les chiffres des titres de section (ex: "Favoris (3)") pour faire le total
function displayStats() {
    const categories = document.querySelectorAll('.category-section');
    let totalBooks = 0;

    categories.forEach(cat => {
        const count = cat.querySelector('h2').textContent.match(/\d+/);
        if (count) {
            totalBooks += parseInt(count[0]);
        }
    });

    console.log(`📚 Total de livres dans votre collection: ${totalBooks}`);
}

// ── Carrousels de la page list ────────────────────────────────────────────────
// Utilise scrollBy (scroll natif) contrairement à carousel.js qui utilise translateX
document.querySelectorAll('.carousel-wrapper, .trending-carousel-wrapper').forEach(wrapper => {
    const btnNext = wrapper.querySelector('.btn-next');
    const btnPrev = wrapper.querySelector('.btn-prev');
    const track = wrapper.querySelector('.carousel-track-container');

    if (btnNext && btnPrev && track) {
        btnNext.addEventListener('click', () => {
            const scrollAmount = track.clientWidth * 0.8; 
            track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        btnPrev.addEventListener('click', () => {
            const scrollAmount = track.clientWidth * 0.8;
            track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
    }
});

window.addEventListener('load', displayStats);
