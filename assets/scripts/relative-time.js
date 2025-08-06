/**
 * Returns a human-readable string representing the relative time between a target and a reference date.
 * @param target The target date in the future, past, or present.
 * @param excludedUnits An array of time units to exclude from the output (e.g. ["year", "month"]).
 * @param reference The reference date to compare against, usually the current date.
 * @param short If true, uses short forms for time units (e.g. "y" for years).
 * @param precision The level of precision for the output (if the desired precision level is reached and is not zero, the following units won't be included in the ouput).
 * @param hideTemporalIndicator If true, the "ago" or "from now" suffix is omitted.
 * @returns A string representing the relative time (e.g. "2 days ago", "3 weeks from now").
 * @throws Will throw an error if the target or reference date is invalid.
 */
function getRelativeTime(target, excludedUnits = ["ms"], reference = new Date(), short, precision = "second", hideTemporalIndicator = false) {
    if (!(target instanceof Date)) {
        try {
            target = new Date(target);
        }
        catch (e) {
            throw new Error("Invalid target date: " + e.message);
        }
    }

    if (!(reference instanceof Date)) {
        try {
            reference = new Date(reference);
        }
        catch (e) {
            throw new Error("Invalid reference date:" + e.message);
        }
    }



    let units = [
        { unit: "year", ms: 1000 * 60 * 60 * 24 * 365.5, short: "y" },
        { unit: "month", ms: 1000 * 60 * 60 * 24 * 30.458, short: "mo" },
        { unit: "week", ms: 1000 * 60 * 60 * 24 * 7, short: "w" },
        { unit: "day", ms: 1000 * 60 * 60 * 24, short: "d" },
        { unit: "hour", ms: 1000 * 60 * 60, short: "h" },
        { unit: "minute", ms: 1000 * 60, short: "m" },
        { unit: "second", ms: 1000, short: "s" },
        { unit: "millisecond", ms: 1, short: "ms" }
    ];



    let difference = Math.abs(reference.getTime() - target.getTime());

    // if (difference <= 1000 * 60) {
    //     return "just now";
    // }



    let parts = [];

    let remaining = difference;

    let iterationLimit = 100;

    while (remaining >= 0 && iterationLimit-- > 0) {
        let unit = units.shift();
        if (!unit) continue;

        if (remaining >= unit.ms && !(excludedUnits.includes(unit.unit) || excludedUnits.includes(unit?.short))) {
            let count = Math.floor(remaining / unit.ms);

            let suffix = short && unit?.short ? unit.short : unit.unit + (count > 1 ? "s" : "")

            parts.push(count + " " + suffix);

            remaining -= count * unit.ms;

            if ([unit.unit, unit?.short].includes(precision) && count != 0) {
                // If the desired precision level is reached, break out of the loop
                break;
            }
        }
    }


    // Assemble the relative time string
    // Attach the last two parts with "and"
    let relativeString = parts.slice(0, -1).join(", ");
    if (parts.length > 1) {
        relativeString += " and ";
    }
    relativeString += parts[parts.length - 1] || "";



    if (hideTemporalIndicator) {
        return relativeString;
    }



    if (reference.getTime() < target.getTime()) {
        relativeString += " from now";
    } else {
        relativeString += " ago";
    }

    return relativeString;
}



/**
 * Updates all relative time containers inside the specified element at regular intervals.
 * @param {HTMLElement} element The element to check for relative time containers inside of.
 * @param {number} intervalTime The interval time in milliseconds.
 * @returns {number} The interval ID for the relative time updates.
 */
function newRtjsInterval(element, intervalTime = 1000) {
    let interval = setInterval(() => {
        // Get all the elements with the `data-rtjs` attribute set to "on" and a `data-rtjs-dt` attribute
        let elements = element.querySelectorAll("[data-rtjs='on'][data-rtjs-dt]");

        // Loop through each element and update its content
        elements.forEach(el => {
            // Get the target date from the `data-rtjs-dt` attribute
            let targetDate = el.getAttribute("data-rtjs-dt");

            // Get the parameters for the relative time function
            let excludedUnits = el.getAttribute("data-rtjs-exclude")?.split(",") || [];
            let referenceDate = el.getAttribute("data-rtjs-reference") || new Date();
            let short = el.getAttribute("data-rtjs-short") === "true";
            let precision = el.getAttribute("data-rtjs-precision") || "second";
            let hideTemporalIndicator = el.getAttribute("data-rtjs-hide-temporal-indicator") === "true";

            // Get the relative time string
            let relativeTimeString = getRelativeTime(targetDate, excludedUnits, referenceDate, short, precision, hideTemporalIndicator);

            // Update the element's content with the relative time string
            el.textContent = relativeTimeString;
        })
    }, intervalTime);



    // Return the interval ID so it can be cleared later if needed
    return interval;
}