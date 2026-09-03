const forms = document.querySelectorAll("form");

forms.forEach((form) => {
    const title = form.querySelector("#title");
    const description = form.querySelector("#description");
    const price = form.querySelector("#price");
    const country = form.querySelector("#country");
    const location = form.querySelector("#location");

    if (!title && !description && !price && !country && !location) {
        return;
    }

    form.addEventListener("submit", function (event) {
        const fields = [title, description, price, country, location];
        let hasError = false;

        fields.forEach((field) => {
            if (!field) return;
            field.classList.remove("invalid");
        });

        if (!title || title.value.trim() === "") {
            title && title.classList.add("invalid");
            hasError = true;
        }

        if (!description || description.value.trim().length < 10) {
            description && description.classList.add("invalid");
            hasError = true;
        }

        if (!price || price.value.trim() === "" || Number(price.value) <= 0) {
            price && price.classList.add("invalid");
            hasError = true;
        }

        if (!country || country.value.trim() === "") {
            country && country.classList.add("invalid");
            hasError = true;
        }

        if (!location || location.value.trim() === "") {
            location && location.classList.add("invalid");
            hasError = true;
        }

        if (hasError) {
            event.preventDefault();
        }
    });
});
