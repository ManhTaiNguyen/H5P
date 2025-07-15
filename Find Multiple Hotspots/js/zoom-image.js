// zoom-image.js
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.image-wrapper');
    let isZoomed = false;
    const zoomScale = 2.2;

    wrapper.addEventListener('dblclick', (event) => {
        if (!wrapper) return;

        if (!isZoomed) {
            const rect = wrapper.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;

            const percentX = offsetX / rect.width * 100;
            const percentY = offsetY / rect.height * 100;

            wrapper.style.transformOrigin = `${percentX}% ${percentY}%`;
            wrapper.style.transform = `scale(${zoomScale})`;
            wrapper.style.transition = 'transform 0.3s ease';
            wrapper.style.cursor = 'zoom-out';
        } else {
            wrapper.style.transform = 'scale(1)';
            wrapper.style.transformOrigin = 'center center';
            wrapper.style.transition = 'transform 0.3s ease';
            wrapper.style.cursor = 'zoom-in';
        }

        isZoomed = !isZoomed;
    });
});
