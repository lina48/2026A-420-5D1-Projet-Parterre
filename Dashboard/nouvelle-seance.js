/* ==========================================
   ETAT
========================================== */

let currentStep = 1;

let rows = 10;
let seatsPerRow = 16;

let selectedType = "Cinéma";
let selectedZone = "standard";

let seatData = [];


/* ==========================================
   ELEMENTS
========================================== */

const titleInput = document.getElementById("title");
const subtitleInput = document.getElementById("subtitle");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const durationInput = document.getElementById("duration");
const locationInput = document.getElementById("location");

const seatMap = document.getElementById("seatMap");

const rowCount = document.getElementById("rowCount");
const seatCount = document.getElementById("seatCount");


/* ==========================================
   STEPPER
========================================== */

function showStep(number) {

    currentStep = number;

    document
        .querySelectorAll(".creation-step")
        .forEach(section => {
            section.classList.remove("active");
        });

    document
        .getElementById(`step${number}`)
        .classList.add("active");


    document
        .querySelectorAll(".step")
        .forEach(step => {

            const n = Number(step.dataset.step);

            step.classList.remove(
                "active",
                "completed"
            );

            if (n === number) {
                step.classList.add("active");
            }

            if (n < number) {
                step.classList.add("completed");
            }

        });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


document
    .getElementById("goStep2")
    .addEventListener("click", () => {

        if (!titleInput.value.trim()) {

            titleInput.focus();

            titleInput.style.borderColor =
                "var(--red)";

            return;
        }

        titleInput.style.borderColor = "";

        updatePreview();

        showStep(2);

    });


document
    .getElementById("backStep1")
    .addEventListener("click", () => {
        showStep(1);
    });


document
    .getElementById("goStep3")
    .addEventListener("click", () => {

        updateFinalSummary();

        showStep(3);

    });


document
    .getElementById("backStep2")
    .addEventListener("click", () => {
        showStep(2);
    });


/* ==========================================
   TYPE CINEMA / THEATRE
========================================== */

document
    .querySelectorAll(".type-btn")
    .forEach(button => {

        button.addEventListener("click", () => {

            document
                .querySelectorAll(".type-btn")
                .forEach(btn => {
                    btn.classList.remove("selected");
                });

            button.classList.add("selected");

            selectedType =
                button.dataset.type;

            updatePreview();

        });

    });


/* ==========================================
   PREVIEW
========================================== */

function updatePreview() {

    document.getElementById("previewTitle")
        .textContent =
        titleInput.value ||
        "Titre de la séance";

    document.getElementById("previewSubtitle")
        .textContent =
        subtitleInput.value ||
        "Sous-titre";

    document.getElementById("previewType")
        .textContent =
        selectedType.toUpperCase();

    document.getElementById("previewDate")
        .textContent =
        `▣ ${dateInput.value || "Date"} · ${timeInput.value || "Heure"}`;

    document.getElementById("previewLocation")
        .textContent =
        `◉ ${locationInput.value || "Lieu"}`;

    document.getElementById("previewDuration")
        .textContent =
        `◷ ${durationInput.value || "Durée"}`;
}


[
    titleInput,
    subtitleInput,
    dateInput,
    timeInput,
    durationInput,
    locationInput

].forEach(input => {

    input.addEventListener(
        "input",
        updatePreview
    );

});


/* ==========================================
   INITIALISER LES SIEGES
========================================== */

function initializeSeats() {

    const oldData = seatData;

    seatData = [];

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        seatData[row] = [];

        for (
            let seat = 0;
            seat < seatsPerRow;
            seat++
        ) {

            if (
                oldData[row] &&
                oldData[row][seat]
            ) {

                seatData[row][seat] =
                    oldData[row][seat];

            } else {

                seatData[row][seat] =
                    "standard";

            }

        }

    }

    renderSeats();
}


/* ==========================================
   AFFICHER LE PLAN
========================================== */

function renderSeats() {

    seatMap.innerHTML = "";

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        const rowElement =
            document.createElement("div");

        rowElement.className =
            "seat-row";


        const rowLabel =
            document.createElement("span");

        rowLabel.className =
            "row-label";

        rowLabel.textContent =
            String.fromCharCode(65 + row);


        rowLabel.addEventListener(
            "click",
            () => {

                for (
                    let seat = 0;
                    seat < seatsPerRow;
                    seat++
                ) {

                    seatData[row][seat] =
                        selectedZone;
                }

                renderSeats();

            }
        );


        rowElement.appendChild(rowLabel);


        for (
            let seat = 0;
            seat < seatsPerRow;
            seat++
        ) {

            const seatElement =
                document.createElement("button");

            seatElement.className =
                `seat ${seatData[row][seat]}`;

            seatElement.textContent =
                seat + 1;


            seatElement.addEventListener(
                "click",
                () => {

                    seatData[row][seat] =
                        selectedZone;

                    renderSeats();

                }
            );


            rowElement.appendChild(
                seatElement
            );

        }


        seatMap.appendChild(
            rowElement
        );

    }


    rowCount.textContent = rows;

    seatCount.textContent =
        seatsPerRow;

    updateStatistics();
}


/* ==========================================
   OUTIL PEINDRE
========================================== */

document
    .querySelectorAll(".paint")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".paint")
                    .forEach(btn =>
                        btn.classList.remove(
                            "selected"
                        )
                    );

                button.classList.add(
                    "selected"
                );

                selectedZone =
                    button.dataset.zone;

            }
        );

    });


/* ==========================================
   CHANGER DIMENSIONS
========================================== */

document
    .getElementById("addRow")
    .addEventListener("click", () => {

        if (rows < 20) {

            rows++;

            initializeSeats();
        }

    });


document
    .getElementById("removeRow")
    .addEventListener("click", () => {

        if (rows > 1) {

            rows--;

            initializeSeats();
        }

    });


document
    .getElementById("addSeat")
    .addEventListener("click", () => {

        if (seatsPerRow < 25) {

            seatsPerRow++;

            initializeSeats();
        }

    });


document
    .getElementById("removeSeat")
    .addEventListener("click", () => {

        if (seatsPerRow > 1) {

            seatsPerRow--;

            initializeSeats();
        }

    });


/* ==========================================
   STATISTIQUES
========================================== */

function updateStatistics() {

    let vip = 0;
    let standard = 0;
    let economy = 0;
    let blocked = 0;


    seatData.forEach(row => {

        row.forEach(zone => {

            if (zone === "vip") vip++;

            if (zone === "standard")
                standard++;

            if (zone === "economy")
                economy++;

            if (zone === "blocked")
                blocked++;

        });

    });


    const active =
        vip +
        standard +
        economy;


    const vipPrice =
        Number(
            document.getElementById(
                "vipPrice"
            ).value
        ) || 0;


    const standardPrice =
        Number(
            document.getElementById(
                "standardPrice"
            ).value
        ) || 0;


    const economyPrice =
        Number(
            document.getElementById(
                "economyPrice"
            ).value
        ) || 0;


    const revenue =
        vip * vipPrice +
        standard * standardPrice +
        economy * economyPrice;


    document.getElementById(
        "vipCount"
    ).textContent =
        `${vip} siège${vip !== 1 ? "s" : ""}`;


    document.getElementById(
        "standardCount"
    ).textContent =
        `${standard} siège${standard !== 1 ? "s" : ""}`;


    document.getElementById(
        "economyCount"
    ).textContent =
        `${economy} siège${economy !== 1 ? "s" : ""}`;


    document.getElementById(
        "blockedCount"
    ).textContent =
        `${blocked} siège${blocked !== 1 ? "s" : ""}`;


    document.getElementById(
        "activeCapacity"
    ).textContent =
        `${active} places actives`;


    document.getElementById(
        "totalCapacity"
    ).textContent =
        `${active} places`;


    document.getElementById(
        "maxRevenue"
    ).textContent =
        `${revenue.toLocaleString("fr-FR")} €`;


    return {
        vip,
        standard,
        economy,
        blocked,
        active,
        revenue,
        vipPrice,
        standardPrice,
        economyPrice
    };
}


/* ==========================================
   PRIX
========================================== */

[
    "vipPrice",
    "standardPrice",
    "economyPrice"

].forEach(id => {

    document
        .getElementById(id)
        .addEventListener(
            "input",
            updateStatistics
        );

});


/* ==========================================
   RECAP
========================================== */

function updateFinalSummary() {

    const stats =
        updateStatistics();


    document.getElementById(
        "summaryTitle"
    ).textContent =
        titleInput.value;


    document.getElementById(
        "summarySubtitle"
    ).textContent =
        subtitleInput.value;


    document.getElementById(
        "summaryType"
    ).textContent =
        selectedType.toUpperCase();


    document.getElementById(
        "summaryDate"
    ).textContent =
        `▣ ${dateInput.value} · ${timeInput.value}`;


    document.getElementById(
        "summaryDuration"
    ).textContent =
        `◷ ${durationInput.value}`;


    document.getElementById(
        "summaryLocation"
    ).textContent =
        `◉ ${locationInput.value}`;


    document.getElementById(
        "finalCapacity"
    ).textContent =
        stats.active;


    document.getElementById(
        "finalRevenue"
    ).textContent =
        `${stats.revenue.toLocaleString("fr-FR")} €`;


    document.getElementById(
        "finalVip"
    ).textContent =
        stats.vip;


    document.getElementById(
        "finalStandard"
    ).textContent =
        stats.standard;


    document.getElementById(
        "finalEconomy"
    ).textContent =
        stats.economy;
}


/* ==========================================
   PUBLIER
========================================== */

document
    .getElementById("publish")
    .addEventListener("click", () => {

        const stats =
            updateStatistics();


        const newSession = {

            title:
                titleInput.value,

            subtitle:
                subtitleInput.value,

            type:
                selectedType,

            genre:
                document.getElementById(
                    "genre"
                ).value,

            date:
                dateInput.value,

            time:
                timeInput.value,

            duration:
                durationInput.value,

            room:
                document.getElementById(
                    "room"
                ).value,

            location:
                locationInput.value,

            seats:
                stats.active,

            revenue:
                stats.revenue
        };


        const existing =
            JSON.parse(
                localStorage.getItem(
                    "siegevifSessions"
                )
            ) || [];


        existing.push(
            newSession
        );


        localStorage.setItem(
            "siegevifSessions",
            JSON.stringify(existing)
        );


        window.location.href =
            "index.html";

    });


/* ==========================================
   START
========================================== */

initializeSeats();
updatePreview();