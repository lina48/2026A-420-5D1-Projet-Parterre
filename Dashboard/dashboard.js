const refreshBtn = document.getElementById("refreshBtn");

refreshBtn.addEventListener("click", () => {

    refreshBtn.textContent = "↻ Actualisation...";

    setTimeout(() => {
        refreshBtn.textContent = "✓ Actualisé";

        setTimeout(() => {
            refreshBtn.textContent = "↻ Actualiser";
        }, 1000);

    }, 700);
});