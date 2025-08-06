const API_ROOT = "https://quill.mia.kiwi/api/v1";
const WEB_ROOT = "";

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



        return parsedDOM.body.innerHTML;
    }



    getPostCard() {
        // Create the post card element
        let card = getCard(this.getPostCardBody(), this.getPostCardHeader(), this.getPostCardFooter());



        // Add the classes to the card
        card.classList.add("post-card");
        card.classList.add("block-center");
        card.classList.add("text-wrap");



        // Add the post ID to the card
        card.id = this.id || this.title || this.path;




        // Add the card to an article element
        let article = document.createElement("article");
        article.appendChild(card);

        return article;
    }



    showPostCard(container, htmlMeta = false) {
        let card = this.getPostCard();

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
            description = `<h2><a class="link link-uncolored" href="#${this.path}">${this.title}</a></h2>` + description;
        }



        let cardHeader = '';

        if (this.pinned) {
            cardHeader = `<span class="text-muted"><small><i class="fa-solid fa-thumbtack fa-rotate-by" style="--fa-rotate-angle: 45deg;"></i>&nbsp;Pinned</small></span>`;
        }

        if (this.image) {
            cardHeader += this.getPostCardImage();
        }



        // Create the post card element
        let card = getCard(description, cardHeader, `<div>${this.getPostCardTagsContainer(3)}</div><div><span class="text-muted"><small>${footerContent.join("&nbsp;&bull; ")}</small></span></div>`);



        // Add the classes to the card
        card.classList.add("post-preview-card");
        card.classList.add("block-center");
        card.classList.add("text-wrap");


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
        return this.tags?.includes("nsfw") || this.tags?.includes("nsfl") || this.tags?.includes("adult") || this.metadata.tags?.includes("18+") || this.metadata.tags?.includes("mature");
    }



    getPostCardHeader() {
        let header = '';

        if (this.pinned) {
            header += '<span class="text-muted"><small><i class="fa-solid fa-thumbtack fa-rotate-by" style="--fa-rotate-angle: 45deg;"></i>&nbsp;Pinned</small></span>'
        }

        if (this.getPostCardImage()) {
            header += this.getPostCardImage();
        }


        return header;
    }



    getPostCardBody() {
        let body = '';



        // Add the post tags
        body += this.getPostCardTagsContainer();



        // Add the post content
        body += this.parsed;



        return body;
    }



    getPostCardFooter() {
        let author = this.author;
        let datePublished = this.datePublished;
        let dateUpdated = this.dateUpdated;



        let footer = '';



        if (this.links && Object.keys(this.links).length > 0) {
            footer += this.getPostLinksContainer();
        }



        footer += `<div class="post-authoring"><p><span class="avatar avatar-primary"><i class="fa-solid fa-link"></i></span><a href="#${this.id}" class="link">Permalink</a></p>`;

        if (author) {
            footer += `
                <span title="Author"><span class="avatar avatar-fg"><i class="fa-solid fa-pen"></i></span><a class="link link-uncolored" href="#by/${author}">${author}</a></span>
            `
        }

        if (datePublished && datePublished instanceof Date) {
            footer += `
                <span title="Published"><span class="avatar avatar-fg"><i class="fa-solid fa-calendar-day"></i></span><time title="${datePublished.toLocaleDateString()}" data-rtjs="on" data-rtjs-precision="day" data-rtjs-exclude="millisecond,second,week,month" data-rtjs-dt="${datePublished.toISOString()}" datetime="${datePublished.toISOString()}">${datePublished.toLocaleDateString()}</time></span>
            `
        }

        if (dateUpdated && dateUpdated instanceof Date) {
            footer += `
                <span title="Updated"><span class="avatar avatar-fg"><i class="fa-solid fa-calendar-plus"></i></span><time title="${dateUpdated.toLocaleDateString()}" data-rtjs="on" data-rtjs-precision="day" data-rtjs-exclude="millisecond,second,minute,week,month" data-rtjs-dt="${dateUpdated.toISOString()}" datetime="${dateUpdated.toISOString()}">${dateUpdated.toLocaleDateString()}</time></span>
            `
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

        if (max < tags.length) container += `<span class="text-muted" title="${tags.length - max} hidden tag(s)"><small>&nbsp;+${tags.length - max}</small></span>`

        container += `</div>`;

        return container;
    }



    getPostLinksContainer() {
        let links = this.links;
        let keys = Object.keys(links);
        let container = `<div class="post-links">`;

        if (keys.length === 0) return container += "</div>"

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let uri = links[key];

            container += `<a class="link" href="${uri}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-link"></i>&nbsp;${key}</a>`;
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
        return this.metadata?.tags ?? [];
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

    get links() {
        return this.metadata?.links || {};
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

            return new Date(b.published || b.updated) - new Date(a.published || a.updated);
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
        let response = await api.fetch(`/posts/${path}`);

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