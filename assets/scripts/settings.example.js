const SETTINGS = {
    app: {
        api: "https://quill.mia.kiwi/api/v1", // Root of the API
        web: window.location.origin, // Root of the web interface
        name: "QuillReader", // Appears in the <title> tag: `{post title} {title separator} {app name}`
        titleSeparator: " | ",
        description: "Description of your blog",
        footer: {
            links: [
                { label: "Get KiwiQuill", url: "https://mia.kiwi/projects/kiwi.mia.0033" },
                { label: "Get QuillReader", url: "https://mia.kiwi/projects/kiwi.mia.0038" }
            ],
            notice: `${new Date().getFullYear()} &COPY; LASTNAME Firstname`
        }
    }
}

// Add a `get` "method" to settings
SETTINGS.get = function (keyPath, defaultValue = null) {
    const keys = keyPath.split('.');
    let result = this;

    for (const key of keys) {
        if (result && Object.prototype.hasOwnProperty.call(result, key)) {
            result = result[key];
        } else {
            return defaultValue;
        }
    }

    return result;
};