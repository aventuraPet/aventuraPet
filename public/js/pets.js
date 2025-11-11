document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('.pet-slider');

    sliders.forEach(slider => {
        const slides = slider.querySelectorAll('.pet-slide');
        const petId = slider.closest('.pet-card').dataset.pet;
        const prevBtn = document.querySelector(`.slider-btn.prev[data-pet="${petId}"]`);
        const nextBtn = document.querySelector(`.slider-btn.next[data-pet="${petId}"]`);
        const dotsContainer = slider.parentElement.querySelector('.slider-dots');
        let currentIndex = 0;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
            currentIndex = index;
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                let newIndex = currentIndex - 1;
                if (newIndex < 0) newIndex = slides.length - 1;
                showSlide(newIndex);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                let newIndex = currentIndex + 1;
                if (newIndex >= slides.length) newIndex = 0;
                showSlide(newIndex);
            });
        }

        if (dotsContainer) {
            dotsContainer.querySelectorAll('.dot').forEach((dot, i) => {
                dot.addEventListener('click', () => {
                    showSlide(i);
                });
            });
        }

        showSlide(0);
    });
});
