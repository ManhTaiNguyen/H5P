document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.image-wrapper');
    const zoomStep = 0.2;
    const maxZoom = 3;
    const minZoom = 1;
    let currentZoom = 1;

    wrapper.addEventListener('wheel', (event) => {
        event.preventDefault();

        const rect = wrapper.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        const percentX = (offsetX / rect.width) * 100;
        const percentY = (offsetY / rect.height) * 100;

        // Zoom in
        if (event.deltaY < 0) {
            if (currentZoom < maxZoom) {
                currentZoom += zoomStep;
            }
        }
        // Zoom out
        else {
            if (currentZoom > minZoom) {
                currentZoom -= zoomStep;
            }
        }

        // Clamp zoom range
        currentZoom = Math.min(Math.max(currentZoom, minZoom), maxZoom);

        window.getCurrentZoom = () => currentZoom;

        // Apply transform
        if (currentZoom === 1) {
            wrapper.style.transform = 'scale(1)';
            wrapper.style.transformOrigin = 'center center';
            wrapper.style.cursor = 'zoom-in';
        } else {
            wrapper.style.transformOrigin = `${percentX}% ${percentY}%`;
            wrapper.style.transform = `scale(${currentZoom})`;
            wrapper.style.cursor = 'zoom-out';
        }

        wrapper.style.transition = 'transform 0.2s ease';
    }, { passive: false });
});
