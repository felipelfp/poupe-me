document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const monthlySaveInput = document.getElementById('monthly-save');
    const yearsInput = document.getElementById('years');
    const interestInput = document.getElementById('interest');
    const resultAmount = document.getElementById('result-amount');

    // Navbar scroll effect
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Calculator Logic
    const calculateSavings = () => {
        if (!monthlySaveInput || !yearsInput || !interestInput || !resultAmount) return;

        const P = parseFloat(monthlySaveInput.value) || 0;
        const t = parseFloat(yearsInput.value) || 0;
        const annualRate = (parseFloat(interestInput.value) || 0) / 100;

        if (P <= 0 || t <= 0) {
            resultAmount.textContent = 'R$ 0,00';
            return;
        }

        const n = 12; // Monthly compounding
        const r = annualRate / n;
        const nt = n * t;

        // Formula for Future Value of an Ordinary Annuity:
        // FV = P * [((1 + r)^nt - 1) / r]
        const fv = P * ((Math.pow(1 + r, nt) - 1) / r);

        const formatter = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });

        resultAmount.textContent = formatter.format(fv);

        // Add a small scale animation to the result
        resultAmount.style.transform = 'scale(1.1)';
        setTimeout(() => {
            resultAmount.style.transform = 'scale(1)';
        }, 200);
    };

    // Event Listeners for Real-time calculation
    [monthlySaveInput, yearsInput, interestInput].forEach(input => {
        if (input) input.addEventListener('input', calculateSavings);
    });

    // Initial calculation
    calculateSavings();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for Reveal Animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Registration Modal Logic
    const modal = document.getElementById('register-modal');
    const registerForm = document.getElementById('register-form');

    if (modal && registerForm) {
        const isRegistered = localStorage.getItem('poupe_me_registered');

        if (!isRegistered) {
            // Show modal after 1.5s delay
            setTimeout(() => {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }, 1500);
        }

        const closeModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };

        // Close on click outside - REMOVED for mandatory registration
        /*
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        */

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const phone = document.getElementById('reg-phone').value;

            console.log('Registration Attempt:', { name, phone });

            // Save to localStorage
            localStorage.setItem('poupe_me_registered', 'true');

            // Show success state
            const header = modal.querySelector('.modal-header');
            if (header) {
                header.innerHTML = `
                    <h2>Sucesso!</h2>
                    <p>Obrigado, ${name.split(' ')[0]}. Agora você faz parte da Poupe-me.</p>
                `;
            }
            registerForm.style.display = 'none';

            // Close ONLY after success, with a small delay to see the message
            setTimeout(closeModal, 2000);
        });
    }

    document.querySelectorAll('.stat-card, .calc-card, .calc-info').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
});
