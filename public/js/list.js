// Gestion de la suppression de livres depuis la collection
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
                // Recharge la page
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

// Statistiques (optionnel)
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

// Appelle displayStats au chargement
window.addEventListener('load', displayStats);
