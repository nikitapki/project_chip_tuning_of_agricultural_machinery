/* ===========================================
            HERO ANIMATION
=========================================== */

window.addEventListener("load", () => {

    document.body.classList.add("loaded");

});

/* ===========================================
            PARALLAX
=========================================== */

const planet = document.querySelector(".planet");
const visual = document.querySelector(".hero-visual");

if (planet && visual) {

    visual.addEventListener("mousemove", (e) => {

        const rect = visual.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rotateY = ((x / rect.width) - 0.5) * 14;
        const rotateX = ((y / rect.height) - 0.5) * -14;

        planet.style.transform =
            `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

    });

    visual.addEventListener("mouseleave", () => {

        planet.style.transform =
            "rotateX(0deg) rotateY(0deg)";

    });

}

/* ===========================================
        FLOATING CARDS
=========================================== */

document.querySelectorAll(".tech-card").forEach((card, index) => {

    card.animate(

        [

            {

                transform: "translateY(0px)"

            },

            {

                transform: "translateY(-12px)"

            },

            {

                transform: "translateY(0px)"

            }

        ],

        {

            duration: 4500 + index * 700,

            iterations: Infinity,

            easing: "ease-in-out"

        }

    );

});

/* ===========================================
        FADE IN ON SCROLL
=========================================== */

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("show");

        }

    });

}, {

    threshold: .2

});

document.querySelectorAll(".fade-up").forEach(el => {

    observer.observe(el);

});

/* ===========================================
        BUTTON RIPPLE
=========================================== */

document.querySelectorAll(".btn").forEach(button => {

    button.addEventListener("mouseenter", () => {

        button.style.transition = ".35s";

    });

});

/* ===========================================
        SMOOTH APPEAR
=========================================== */

window.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".hero-text > *").forEach((el, i) => {

        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";

        setTimeout(() => {

            el.style.transition = ".8s";

            el.style.opacity = "1";
            el.style.transform = "translateY(0)";

        }, i * 180);

    });

});