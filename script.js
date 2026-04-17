document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const monthlySaveInput = document.getElementById('monthly-save');
    const yearsInput = document.getElementById('years');
    const interestInput = document.getElementById('interest');
    const resultAmount = document.getElementById('result-amount');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Calculator Logic
    const calculateSavings = () => {
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
        input.addEventListener('input', calculateSavings);
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

    document.querySelectorAll('.stat-card, .calc-card, .calc-info').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
});
