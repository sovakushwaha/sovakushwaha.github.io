// Shared full-screen lightbox for project chart galleries.
class ProjectLightbox {
    constructor() {
        this.dialog = document.querySelector('.project-lightbox');
        if (!this.dialog) return;

        this.title = this.dialog.querySelector('#project-lightbox-title');
        this.image = this.dialog.querySelector('.project-lightbox-image');
        this.caption = this.dialog.querySelector('.project-lightbox-caption');
        this.counter = this.dialog.querySelector('.project-lightbox-counter');
        this.prevButton = this.dialog.querySelector('.project-lightbox-prev');
        this.nextButton = this.dialog.querySelector('.project-lightbox-next');
        this.closeButton = this.dialog.querySelector('.project-lightbox-close');
        this.stage = this.dialog.querySelector('.project-lightbox-stage');

        this.images = [];
        this.index = 0;
        this.projectName = 'Project';
        this.pointerStart = null;
        this.boundKeydown = event => this.handleKeydown(event);
        this.boundResize = () => this.fitImageToStage();

        this.closeButton?.addEventListener('click', () => this.close());
        this.prevButton?.addEventListener('click', event => {
            event.stopPropagation();
            this.goTo(this.index - 1);
        });
        this.nextButton?.addEventListener('click', event => {
            event.stopPropagation();
            this.goTo(this.index + 1);
        });

        this.dialog.addEventListener('click', event => {
            if (event.target === this.dialog) this.close();
        });

        this.dialog.addEventListener('close', () => {
            document.removeEventListener('keydown', this.boundKeydown);
            window.removeEventListener('resize', this.boundResize);
            document.body.classList.remove('lightbox-open');
            if (this.image) {
                this.image.style.width = '';
                this.image.style.height = '';
            }
        });

        this.stage?.addEventListener('pointerdown', event => this.handlePointerDown(event));
        this.stage?.addEventListener('pointerup', event => this.handlePointerUp(event));
        this.stage?.addEventListener('pointercancel', () => {
            this.pointerStart = null;
        });
    }

    open({ images = [], index = 0, projectName = 'Project' } = {}) {
        if (!this.dialog || !Array.isArray(images) || images.length === 0) return;

        this.images = images;
        this.index = Math.max(0, Math.min(index, images.length - 1));
        this.projectName = projectName;

        const multi = this.images.length > 1;
        if (this.prevButton) this.prevButton.hidden = !multi;
        if (this.nextButton) this.nextButton.hidden = !multi;

        this.update();
        document.body.classList.add('lightbox-open');
        document.addEventListener('keydown', this.boundKeydown);
        window.addEventListener('resize', this.boundResize);

        if (typeof this.dialog.showModal === 'function') {
            this.dialog.showModal();
        } else {
            this.dialog.setAttribute('open', '');
        }

        this.closeButton?.focus();
        requestAnimationFrame(() => this.fitImageToStage());
    }

    close() {
        if (!this.dialog) return;
        if (typeof this.dialog.close === 'function') {
            this.dialog.close();
        } else {
            this.dialog.removeAttribute('open');
            document.removeEventListener('keydown', this.boundKeydown);
            document.body.classList.remove('lightbox-open');
        }
    }

    goTo(index) {
        if (this.images.length < 2) return;
        this.index = (index + this.images.length) % this.images.length;
        this.update();
    }

    update() {
        const current = this.images[this.index];
        if (!current || !this.image) return;

        if (this.title) {
            this.title.textContent = this.projectName;
        }

        this.image.src = current.src;
        this.image.alt = current.alt || `${this.projectName} chart`;

        if (this.caption) {
            this.caption.textContent = current.caption || '';
            this.caption.hidden = !current.caption;
        }

        if (this.counter) {
            this.counter.textContent = `${this.index + 1} / ${this.images.length}`;
            this.counter.setAttribute(
                'aria-label',
                `Chart ${this.index + 1} of ${this.images.length}${current.caption ? `: ${current.caption}` : ''}`
            );
        }

        if (this.stage) {
            this.stage.scrollTop = 0;
            this.stage.scrollLeft = 0;
        }

        // Ensure the chart always fits the available lightbox stage.
        requestAnimationFrame(() => this.fitImageToStage());
    }

    fitImageToStage() {
        if (!this.image || !this.stage) return;

        const applyFit = () => {
            const styles = getComputedStyle(this.image);
            const padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
            const padY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
            const maxWidth = Math.max(0, this.stage.clientWidth - padX);
            const maxHeight = Math.max(0, this.stage.clientHeight - padY);
            const naturalWidth = this.image.naturalWidth || maxWidth;
            const naturalHeight = this.image.naturalHeight || maxHeight;

            if (!maxWidth || !maxHeight || !naturalWidth || !naturalHeight) return;

            const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
            this.image.style.width = `${Math.floor(naturalWidth * scale)}px`;
            this.image.style.height = `${Math.floor(naturalHeight * scale)}px`;
        };

        if (this.image.complete && this.image.naturalWidth) {
            applyFit();
            return;
        }

        this.image.addEventListener('load', applyFit, { once: true });
    }

    handleKeydown(event) {
        if (!this.dialog?.open) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.goTo(this.index - 1);
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.goTo(this.index + 1);
        }
    }

    handlePointerDown(event) {
        if (!event.isPrimary || event.pointerType === 'mouse') return;
        this.pointerStart = { x: event.clientX, y: event.clientY };
    }

    handlePointerUp(event) {
        if (!this.pointerStart || !event.isPrimary) return;

        const deltaX = event.clientX - this.pointerStart.x;
        const deltaY = event.clientY - this.pointerStart.y;
        this.pointerStart = null;

        if (Math.abs(deltaX) < 56 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
        this.goTo(this.index + (deltaX < 0 ? 1 : -1));
    }
}

let lightboxInstance = null;

export function getProjectLightbox() {
    if (!lightboxInstance) {
        lightboxInstance = new ProjectLightbox();
    }
    return lightboxInstance;
}
