document.addEventListener("DOMContentLoaded", () => {

    const decorations = document.querySelector(".decorations");

    if (!decorations) return;


    const patternHeight = 900;

    const pageHeight =
        Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
        );


    const count =
        Math.ceil(pageHeight / patternHeight) + 1;


    for (let i = 0; i < count; i++) {

        const pattern =
            document.createElement("div");

        pattern.className =
            "decoration-pattern";


        pattern.style.top =
            `${i * patternHeight}px`;


        pattern.innerHTML = `

            <div class="decoration-circle"></div>

            <div class="decoration-circle-right"></div>

            <div class="decoration-glow"></div>


            <div class="decoration-gear gear-right"></div>

            <div class="decoration-gear gear-left"></div>


            <div class="decoration-orbits">

                <div class="decoration-orbit"></div>

                <div class="decoration-orbit"></div>

                <div class="decoration-orbit"></div>

                <div class="decoration-orbit-glow"></div>

            </div>

        `;


        decorations.appendChild(pattern);

    }

});