// Top-level Curriculum Vitae actions and in-page PDF viewer
export class CVManager {
    updateCVSection(config) {
        const section = document.querySelector('.cv');
        const dialog = document.querySelector('.cv-dialog');
        const cv = config.cv;

        if (!section || !dialog || !cv?.file) return;

        const title = cv.title || 'Curriculum Vitae';
        const fileUrl = cv.file;
        const titleElement = section.querySelector('#cv-title');
        const description = section.querySelector('.cv-description');
        const downloadLink = section.querySelector('.cv-download');
        const openButton = section.querySelector('.cv-open');
        const closeButton = dialog.querySelector('.cv-dialog-close');
        const iframe = dialog.querySelector('iframe');
        const fallbackLink = dialog.querySelector('.cv-viewer-fallback a');

        titleElement.textContent = title;
        description.textContent = cv.description || '';
        downloadLink.href = fileUrl;
        downloadLink.setAttribute('aria-label', `${cv.download_label || 'Download CV'} as PDF`);
        downloadLink.querySelector('span:last-child').textContent = cv.download_label || 'Download CV';
        openButton.setAttribute('aria-label', `${cv.open_label || 'Preview CV'} in page`);
        openButton.querySelector('span:last-child').textContent = cv.open_label || 'Preview CV';
        iframe.src = fileUrl;
        fallbackLink.href = fileUrl;
        fallbackLink.target = '_blank';
        fallbackLink.rel = 'noopener noreferrer';

        openButton.addEventListener('click', () => {
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
                return;
            }

            window.open(fileUrl, '_blank', 'noopener,noreferrer');
        });
        closeButton.addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', event => {
            if (event.target === dialog) dialog.close();
        });
    }
}
