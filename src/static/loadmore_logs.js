document.addEventListener('DOMContentLoaded', () => {
    const itemsPerPage = 5;
    let currentPage = 1;

    const itemList = document.getElementById('logs-ul');
    const loadMoreBtn = document.getElementById('loadmore-btn');
    const items = Array.from(itemList.children);

    const loadItems = page => {
        const start = (page - 1) * itemsPerPage;
        const end = page * itemsPerPage;

        for (let i = start; i < end && i < items.length; i++) {
            items[i].style.display = 'list-item';
        }

        if (end >= items.length) {
            loadMoreBtn.style.display = 'none';
        }
    }

    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        loadItems(currentPage);
    });

    // Initialize the list by hiding all items and showing the first set
    items.forEach((item, index) => {
        item.style.display = index < itemsPerPage ? 'list-item' : 'none';
    });
});