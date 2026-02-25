const statusSelect = document.getElementById('bookStatus');

if (statusSelect) {
    statusSelect.addEventListener('change', async function() {
        if (!this.value) return;
        
        try {
            const response = await fetch('/books/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_book_id: statusSelect.dataset.bookId,
                    status: this.value
                })
            });
            
            const data = await response.json();
            if (response.ok) {
                alert(data.message || 'État enregistré !');
            } else {
                console.error('Erreur:', data.error);
                alert('Erreur lors de l\'enregistrement du statut');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'enregistrement du statut');
        }
    });
}
