if (!SETTINGS) {
    throw "Must load settings first"
}

const API_ROOT = SETTINGS?.get("app.api", "https://quill.mia.kiwi/api/v1");
const WEB_ROOT = SETTINGS?.get("app.web", "https://quill.mia.kiwi/");

const API = new KapirApi(API_ROOT);



class Post {
    /**
     * Create a new Post instance.
     * @param {object} raw The raw post data.
     * @param {object} metadata The metadata of the post.
     * @param {KapirApi} api The API instance to use for fetching data.
     */
    constructor(raw, metadata = {}, api = API) {
        this.raw = raw;
        this.parsed = Post.parse(raw);
        this.metadata = metadata;
        this.api = api;

        // If the post is marked as NSFW, move the tag at the start of the array
        if (this.tags.includes("nsfw")) {
            this.metadata.tags = ["nsfw", ...this.tags.filter(tag => tag !== "nsfw")];
        }
    }



    static parse(raw) {
        // Parse the Markdown content to HTML
        let parsed = marked.parse(raw);



        // Convert the parsed HTML to a DOM element
        let parser = new DOMParser();
        let parsedDOM = parser.parseFromString(parsed, "text/html");



        // Add the correct classes to anchor elements
        parsedDOM.querySelectorAll("a[href]").forEach(a => {
            a.classList.add("link");
        });



        // Format the tables correctly
        parsedDOM.querySelectorAll("table").forEach(table => {
            // Get the sibling to append the wrapper after
            let sibling = table.nextElementSibling ?? parsedDOM.body;

            // Add the table class
            table.classList.add("table");
            table.classList.add("table-primary");

            // Create a wrapper for the table
            let wrapper = document.createElement("div");
            wrapper.classList.add("table-wrapper");
            wrapper.appendChild(table);

            // Append the wrapper after the sibling
            sibling.parentNode.insertBefore(wrapper, sibling);
        });



        // Make all images open in a new window when clicked
        parsedDOM.querySelectorAll("img").forEach(img => {
            img.setAttribute("onclick", `window.open(this.src, '_blank')`);
        });



        return parsedDOM.body.innerHTML;
    }



    async getPostCard() {
        // Create the post card element
        let card = getCard(await this.getPostCardBody(), this.getPostCardHeader(), this.getPostCardFooter());



        // Add the classes to the card
        card.classList.add("post-card");
        card.classList.add("block-center");
        card.classList.add("text-wrap");

        // Add the post ID to the card
        card.id = this.id || this.title || this.path;




        // Add the card to an article element
        let article = document.createElement("article");
        article.appendChild(card);



        // If the post is NSFW, add the post-nsfw class to the card and show a disclaimer
        if (this.isNSFW()) {
            card.classList.add("post-nsfw");

            let modalId = "modal-post-nsfw-disclaimer";

            let modal = getModal(
                '<p>This post may contain NSFW content.</p><p>Do you wish to proceed?</p>',
                '<p><span class="avatar avatar-negative"><i class="fa-solid fa-radiation"></i></span>Mature Content Ahead</p>',
                `<a href="#" class="btn btn-negative"><i class="fa-solid fa-xmark"></i><span>&nbsp;No, send me back</span></a><button class="btn btn-fg btn-empty" onclick="document.getElementById('${modalId}').remove()">Yes, proceed to NSFW content</button>`,
                false
            );

            modal.id = modalId;

            // Increase the modal backdrop blur
            modal.style.backdropFilter = "blur(15px)";

            article.appendChild(modal);
        }

        return article;
    }



    async showPostCard(container, htmlMeta = false) {
        let card = await this.getPostCard();

        // Add the post card to the container
        container.appendChild(card);
    }



    getPostPreviewCard() {
        // Get a description for the post, from the metadata or the first 200 characters of the raw content
        let description = this.description

        if (!description) {
            let tempDiv = document.createElement("div");

            tempDiv.innerHTML = this.parsed;

            description = tempDiv.textContent.substring(0, 200) + "...";
        }



        let footerContent = [];

        if (this.author) footerContent.push(`By <a class="link link-uncolored" href="#by/${this.author}">${this.author}</a>`)

        if (this.dateUpdated || this.datePublished) footerContent.push(
            `<time title="${this.dateUpdated?.toLocaleDateString() || this.datePublished?.toLocaleDateString()}" data-rtjs="on" data-rtjs-precision="day" data-rtjs-exclude="millisecond,second,week,month" data-rtjs-dt="${this.dateUpdated?.toISOString() || this.datePublished?.toISOString()}" datetime="${this.dateUpdated?.toISOString() || this.datePublished?.toISOString()}">${this.dateUpdated?.toLocaleDateString() || this.datePublished?.toLocaleDateString()}</time>`
        );



        // If the post has a title, prepend it to the description
        if (this.title) {
            description = `<h2><a class="link link-uncolored" href="#${this.path}">${this.title}</a></h2><span>${description}</span>`;
        }



        let cardHeader = '';

        if (this.pinned) {
            cardHeader = `<span class="text-muted"><small><i class="fa-solid fa-thumbtack fa-rotate-by" style="--fa-rotate-angle: 45deg;"></i>&nbsp;Pinned</small></span>`;
        }

        if (this.image) {
            cardHeader += this.getPostCardImage();
        }



        // Create the post card element
        let card = getCard(description, cardHeader || null, `<div>${this.getPostCardTagsContainer(3)}</div><div><span class="text-muted"><small>${footerContent.join("&nbsp;&bull; ")}</small></span></div>`);



        // Add the classes to the card
        card.classList.add("post-preview-card");
        card.classList.add("block-center");
        card.classList.add("text-wrap");

        // If the post is NSFW, add the post-nsfw class to the preview card
        if (this.isNSFW()) {
            card.classList.add("post-nsfw");
        }

        // Add the post ID to the card
        card.id = this.id || this.title || this.path



        // Add the card to an article element
        let article = document.createElement("article");
        article.appendChild(card);

        return article;
    }



    showPostPreviewCard(container, htmlMeta = false) {
        let card = this.getPostPreviewCard();

        // Add the post card to the container
        container.appendChild(card);
    }



    isNSFW() {
        return this.tags?.includes("nsfw");
    }



    getPostCardHeader() {
        let header = '';

        if (this.pinned) {
            header += '<span class="text-muted text-small"><small><i class="fa-solid fa-thumbtack fa-rotate-by" style="--fa-rotate-angle: 45deg;"></i>&nbsp;Pinned</small></span>'
        }

        if (this.unlisted) {
            header += '<span class="text-muted text-small"><small><i class="fa-solid fa-eye-slash"></i>&nbsp;Unlisted &mdash; Only people with the link can view this post</small></span>'
        }

        if (this.getPostCardImage()) {
            header += this.getPostCardImage();
        }


        return header;
    }



    async getPostCardBody() {
        let body = '';



        // Add the post tags
        body += this.getPostCardTagsContainer();



        if (this.links && Object.keys(this.links).length > 0) {
            body += this.getPostLinksContainer();
        }



        // Add the post content
        body += this.parsed;



        // Add the related posts container
        if (this.relatedPosts?.length > 0) {
            body += await this.getRelatedPostsContainer();
        }

        return body;
    }



    getPostCardFooter() {
        let author = this.author;
        let datePublished = this.datePublished;
        let dateUpdated = this.dateUpdated;



        let footer = '';



        // Add the permalink to the post on the QuillReader instance
        footer += `<div class="post-authoring"><p><span class="avatar avatar-primary"><i class="fa-solid fa-link"></i></span><a href="#${this.id}" class="link">Permalink</a></p>`;

        // Add the author
        if (author) {
            footer += `
                <span title="Author"><span class="avatar avatar-fg"><i class="fa-solid fa-pen"></i></span><a class="link link-uncolored" href="#by/${author}">${author}</a></span>
            `
        }

        // Add the published date
        if (datePublished && datePublished instanceof Date) {
            footer += `
                <span title="Published"><span class="avatar avatar-fg"><i class="fa-solid fa-calendar-day"></i></span><time title="${datePublished.toLocaleDateString()}" data-rtjs="on" data-rtjs-precision="day" data-rtjs-exclude="millisecond,second,week,month" data-rtjs-dt="${datePublished.toISOString()}" datetime="${datePublished.toISOString()}">${datePublished.toLocaleDateString()}</time></span>
            `
        }

        // Add the updated date
        if (dateUpdated && dateUpdated instanceof Date) {
            footer += `
                <span title="Updated"><span class="avatar avatar-fg"><i class="fa-solid fa-calendar-plus"></i></span><time title="${dateUpdated.toLocaleDateString()}" data-rtjs="on" data-rtjs-precision="day" data-rtjs-exclude="millisecond,second,minute,week,month" data-rtjs-dt="${dateUpdated.toISOString()}" datetime="${dateUpdated.toISOString()}">${dateUpdated.toLocaleDateString()}</time></span>
            `
        }

        // Add the source of the post (KiwiQuill instance) if the domain is different
        let apiRootDomain = new URL(API_ROOT).hostname;

        if (apiRootDomain !== window.location.hostname) {
            footer += `<span title="Source"><span class="avatar avatar-fg"><i class="fa-brands fa-sourcetree"></i></span><a class="link link-uncolored" href="//${apiRootDomain}">${apiRootDomain}</a></span>`;
        }

        footer += '</div>';



        return footer;
    }



    getPostCardImage() {
        let image = this.image;

        if (!image) {
            return null;
        }

        return `<div class="post-image">
                    <img src="${image}" alt="${this.title}">
                </div>`;
    }



    getPostCardBreadcrumbs() {
        let home = `<a class="link" href="#"><i class="fa-solid fa-house"></i>&nbsp;Home</a>`;

        let crumbs = [home, ...this.metadata.path.split("/")];

        let breadcrumbs = getBreadcrumbs(crumbs);

        breadcrumbs.classList.add("post-breadcrumbs");

        breadcrumbs.querySelectorAll("li:not(:first-child):not(:last-child)").forEach(li => {
            li.classList.add("text-muted");
        });

        return breadcrumbs.outerHTML;
    }



    static getTag(text, theme = null, closable = false) {
        if (!theme) {
            // Apply special styling for certain tags
            theme = "bg";

            switch (text.toLowerCase()) {
                case "nsfw":
                    theme = "negative";
                    break;

                case "blog":
                    theme = "primary";
                    break;

                default:
                    // Otherwise, pick a random color based on the length of the tag
                    let colors = ["primary", "accent", "info", "positive", "warning", "secondary", "negative"];

                    // Convert all the characters in the tag to their numeric values and sum them up
                    let numericValue = Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);

                    let index = numericValue % colors.length;

                    theme = colors[index];
                    break;
            }
        }



        let tag = getChip(`<a class="link link-uncolored" href="#tag/${text}">${text}</a>`, '<i class="fa-solid fa-tag"></i>', theme, closable);



        return tag;
    }



    getPostCardTagsContainer(max = null) {
        let tags = this.tags;
        let container = `<div class="post-tags chips-container">`;

        if (tags.length === 0) return container += "</div>";

        max = max ? max : tags.length;

        let j = max

        for (let tag of tags) {
            if (j === 0) break;

            let chip = Post.getTag(tag);

            chip.classList.add("post-tag");

            container += chip.outerHTML;

            j--
        }

        if (max < tags.length) {
            // container += `<span class="text-muted" title="${tags.length - max} hidden tag(s)"><small>&nbsp;+${tags.length - max}</small></span>`
            container += `
            <span class="post-tags-overflow-indicator" class="text-muted" title="${tags.length - max} other tag(s)"><small>&nbsp;+${tags.length - max}</small></span>
            <div class="post-tags-overflow chips-container">
                ${tags.slice(max).map(tag => {
                let chip = Post.getTag(tag);
                chip.classList.add("post-tag");
                return chip.outerHTML;
            }).join("")}
            </div>
            `;
        }

        container += `</div>`;

        return container;
    }



    async getRelatedPostsContainer(api = API) {
        let relatedPosts = await this.fetchRelatedPosts(api);



        // Get the preview cards for the related posts
        let previewCards = relatedPosts.map(post => post.getPostPreviewCard().outerHTML).join("");

        return `<h3 class="text-secondary" style="text-align: center; margin: 2em 0 0.25em 0;">Related Posts</h3><div class="related-posts">${previewCards}</div>`;
    }



    async fetchRelatedPosts(api = API) {
        let relatedPosts = await Promise.all(this.relatedPosts.map(async post => {
            // If the value is a URL, assume the post is hosted elsewhere
            let postURL = null;

            try {
                postURL = new URL(post);
            } catch {
            }

            if (postURL) {
                // Only support local posts for now
                console.warn("External posts are not supported yet", postURL);

                // TODO: Support posts hosted on other KiwiQuill instances
            } else {
                // Check if the value given is an ID
                if (await Post.idExists(post, api)) {
                    return await Post.getById(post, api);
                } else if (await Post.pathExists(post, api)) {
                    return await Post.get(post, api);
                }
            }
        }))



        relatedPosts = relatedPosts.filter(post => post !== null && post !== undefined);



        return relatedPosts;
    }



    getPostLinksContainer() {
        let links = this.links;
        let keys = Object.keys(links);
        let container = `<div class="post-links">`;

        if (keys.length === 0) return container += "</div>"

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let uri = links[key];

            let linkCard = getCard(`<a class="link link-uncolored" href="${uri}" target="_blank" rel="noopener noreferrer">${key}</a>`, null, `<span class="text-muted text-small"><small>${uri}</small></span>`);

            linkCard.classList.add("post-link");

            container += linkCard.outerHTML;
        }

        container += `</div>`;

        return container;
    }



    get id() {
        return this.metadata?.id;
    }

    get title() {
        return this.metadata?.title;
    }

    get description() {
        return this.metadata?.description;
    }

    get author() {
        return this.metadata?.author;
    }

    get image() {
        return this.metadata?.image;
    }

    get tags() {
        let tags = this.metadata?.tags || [];

        // Make tags lowercase
        tags = tags.map(tag => tag.toLowerCase());

        return tags;
    }

    get published() {
        return this.datePublished;
    }

    get datePublished() {
        return this.metadata?.date_published ? new Date(this.metadata.date_published) : null;
    }

    get updated() {
        return this.dateUpdated;
    }

    get dateUpdated() {
        return this.metadata?.date_updated ? new Date(this.metadata.date_updated) : null;
    }

    get path() {
        return this.metadata?.path || this.id;
    }

    get pinned() {
        return this.metadata?.pinned || false;
    }

    get unlisted() {
        return this.metadata?.visibility === "unlisted";
    }

    get links() {
        return this.metadata?.links || {};
    }

    get relatedPosts() {
        return this.metadata?.related_posts || [];
    }



    static async all(api = API, pagination = { limit: 100, offset: 0 }) {
        let path = "/posts";

        if (pagination) {
            path += `?limit=${pagination.limit}&offset=${pagination.offset}`;
        }

        let response = await api.fetch(path);

        if (response.isError()) {
            showToast(response.message, "error");
            return [];
        }

        let posts = response.data.map(post => new Post(post.raw, post.metadata, api));



        // Put the pinned posts first and order the rest by date published or updated
        posts.sort((a, b) => {
            if (a.pinned && !b.pinned) {
                return -1;
            }
            if (!a.pinned && b.pinned) {
                return 1;
            }

            return new Date(b.updated || b.published) - new Date(a.updated || a.published);
        });



        return posts;
    }



    static async search({
        tags = null,
        title = null,
        author = null,
        path = null,
        pagination = { limit: 100, offset: 0 }
    }, api = API) {
        let query = new URLSearchParams();

        tags ? query.set("tags", tags.join(",")) : null;
        title ? query.set("title", title) : null;
        author ? query.set("author", author) : null;

        if (pagination) {
            query.set("limit", pagination.limit);
            query.set("offset", pagination.offset);
        }

        let response = await api.fetch(`/posts/search${path ? `/${path}` : ''}?${query.toString()}`);

        if (response.isError()) {
            showToast(response.message, "error");
            return [];
        }

        let posts = response.data.map(post => new Post(post.raw, post.metadata, api));



        // Put the pinned posts first and order the rest by date published or updated
        posts.sort((a, b) => {
            if (a.pinned && !b.pinned) {
                return -1;
            }
            if (!a.pinned && b.pinned) {
                return 1;
            }

            return new Date(b.published || b.updated) - new Date(a.published || a.updated);
        });



        return posts;
    }


    /**
     * Create a new Post instance from a given path.
     * @param {string} path The path to the post.
     * @param {KapirApi} api The API instance to use for fetching data.
     * @returns {Promise<Post|null>} A promise that resolves to a Post instance or null if an error occurs.
     */
    static async get(path, api = API, silent = false, pagination = { limit: 100, offset: 0 }) {
        if (pagination) {
            path += `?limit=${pagination.limit}&offset=${pagination.offset}`;
        }

        let response = await api.fetch(`/posts/${path}`);

        if (response.isError()) {
            if (!silent) showToast(response.message, "error");
            return null;
        }

        let post = new Post(response.data.raw, response.data.metadata, this.api);

        post.response = response;

        return post;
    }



    /**
     * Create a new Post instance by its ID.
     * @param {string} id The ID of the post to fetch.
     * @param {KapirApi} api The API instance to use for fetching data.
     * @returns {Promise<Post|null>} A promise that resolves to a Post instance or null if an error occurs.
     */
    static async getById(id, api = API, silent = false) {
        let response = await api.fetch(`/posts/id/${id}`);

        if (response.isError()) {
            if (!silent) showToast(response.message, "error");
            return null;
        }

        let post = new Post(response.data.raw, response.data.metadata, this.api);

        post.response = response;

        return post;
    }



    static async idExists(id, api = API) {
        let response = await api.fetch(`/posts/id/${id}`);

        return !response.isError();
    }



    static async pathExists(path, api = API) {
        // Only fetch the post metadata to check if the path exists
        let response = await api.fetch(`/posts/${path}/metadata`);

        return !response.isError();
    }



    static async getTags(api = API, silent = false) {
        let response = await api.fetch("/tags");

        if (response.isError()) {
            if (!silent) showToast(response.message, "error");
            return [];
        }

        return response.data;
    }



    static getPostsPreviewContainer(posts) {
        let container = "<div class='posts-container'>";

        if (!Array.isArray(posts) || posts.length === 0) {
            container += "<p class='text-muted'>No posts found.</p>";
        } else {
            posts.forEach(post => {
                container += post.getPostPreviewCard().outerHTML;
            });
        }

        container += "</div>";

        return container;
    }
}



function buildAppBreadcrumbs(parts) {
    if (!Array.isArray(parts)) {
        parts = [''];
    }

    let segments = [
        '<a class="link" href="#"><i class="fa-solid fa-house"></i>&nbsp;Home</a>',
        ...parts.map((part, index, array) => {
            let pastParts = array.slice(0, index);

            if (index === array.length - 1) {
                return `<span class="breadcrumb">${part}</span>`;
            }
            return `<a class="link link-uncolored" href="#${[...pastParts, part].join("/")}">${part}</a>`
        })
    ]

    let breadcrumbs = '<ol style="margin: 0;" class="breadcrumbs breadcrumbs-transparent">';

    segments.forEach((segment, index) => {
        breadcrumbs += `<li class="breadcrumb">${segment}</li>`;
    });

    breadcrumbs += '</ol>';

    return breadcrumbs;
}



function errorNoMatchingPosts(criteria = []) {
    let message = `<p class="text-muted text-center"><small><span class="avatar avatar-fg"><i class="fa-solid fa-magnifying-glass"></i></span>No posts to show</small></p>`;

    return message;
}



function getPageTitle({
    sections = [],
    separator = SETTINGS?.get("app.titleSeparator", " | "),
    appName = SETTINGS?.get("app.name", "QuillReader")
}) {
    if (sections.length > 0) {
        return `${sections.join(separator)}${separator}${appName}`;
    }

    return appName;
}



function setMetadata({
    title = null,
    metadata = []
}) {
    if (title) {
        document.title = title;

        metadata.push({ name: "title", property: "og:title", content: title });
    }

    metadata.forEach(({ name, property, content }) => {
        // Find the meta tags with matching name or property
        let tags = document.querySelectorAll(`meta[name="${name}"], meta[property="${property}"]`);

        if (tags.length === 0) {
            // Create a new meta tag if it doesn't exist
            let tag = document.createElement("meta");

            name ? tag.setAttribute("name", name) : null;
            property ? tag.setAttribute("property", property) : null;

            document.head.appendChild(tag);

            tags = [tag];
        }

        // Set the content for the meta tags
        tags.forEach(tag => {
            tag.setAttribute("content", content);
        });
    });
}



function resetMetadata() {
    let appName = SETTINGS?.get("app.name", "QuillReader");
    let defaultMetadata = [
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        { property: "og:url", content: window.location.href },
        { property: "og:site_name", content: appName },
        { name: "description", property: "og:description", content: SETTINGS?.get("app.description", "Description of your blog") }
    ];

    // Remove all existing meta tags
    defaultMetadata.forEach(({ name, property }) => {
        let tags = document.querySelectorAll(`meta[name="${name}"], meta[property="${property}"]`);
        tags.forEach(tag => tag.remove());
    });

    setMetadata({
        title: appName,
        metadata: defaultMetadata
    });
}