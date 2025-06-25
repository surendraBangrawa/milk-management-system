function showOverlay() {
    loadingSpinner.style.display = 'block';
    overlay.style.display = 'block';
}

function hideOverlay() {
    loadingSpinner.style.display = 'none';
    overlay.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    $(".tokenLink").click(function() {
        showOverlay();
    });
});