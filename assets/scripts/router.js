var StoredHash = null; // Store the initial hash



window.setInterval(async function () {



    // The hash has changed
    if (window.location.hash != StoredHash) {

        await loadApp();

    }



}, 100); // Google uses 100ms intervals I think, might be lower



async function loadApp() {



    MAIN.innerHTML = '';
    POSTS_NAV.style.display = "none";
    HEADER_LINKS.innerHTML = '';



    // Get the new hash
    let hash = window.location.hash;

    // Set the new stored hash
    StoredHash = hash;


    // Show a loading indicator
    let loader = getModal("<p class=\"text-center\"><i class=\"fa-solid fa-spinner fa-spin-pulse\"></i></p>", null, null, false);
    let loaderId = "posts-loader";
    loader.id = loaderId;

    let modal = loader.querySelector(".modal");

    modal.style.backgroundColor = "transparent";
    modal.style.border = "none";
    modal.style.boxShadow = "none";

    MAIN.appendChild(loader);



    // Get the route (i.e. the hash without the leading # or trailing slash)
    let route = hash.substring(1).toLocaleLowerCase();

    if (route.endsWith("/")) {
        route = route.substring(0, route.length - 1);
    }



    let posts = [];

    let breadcrumbs = [];

    resetMetadata();



    if (["tags", "tag", "tags/", "tag/"].includes(route)) {
        console.debug("Loading route: tags");

        setMetadata({
            title: getPageTitle({
                sections: ["Tags"]
            })
        });



        // Get all the tags
        let tags = await Post.getTags();

        // Sort the tags alphabetically
        tags.sort((a, b) => a.localeCompare(b));



        let tagsContainer = '<div class="chips-container">'

        tags.forEach(tag => {
            tagsContainer += (Post.getTag(tag)).outerHTML;
        });

        tagsContainer += '</div>';



        // Render the tags
        MAIN.innerHTML += tagsContainer;



        breadcrumbs = ["tags"];



    }
    else if (route.startsWith("tag/")) {
        console.debug("Loading route: tag");



        // Get all the posts with the given tag
        let tag = route.substring(4);
        tag = decodeURIComponent(tag);



        setMetadata({
            title: getPageTitle({
                sections: [`'${tag}'`, "Tags"]
            })
        });


        posts = await Post.search({ tags: [tag], pagination: PAGINATION });

        if (API.getLastResponse().isError() || posts.length === 0) {
            MAIN.innerHTML += errorNoMatchingPosts(["tag"]);
        } else {
            // Render the posts
            let container = Post.getPostsPreviewContainer(posts);

            MAIN.innerHTML += container;
        }



        breadcrumbs = ["tag", tag];



    } else if (route === "") {
        console.debug("Loading route: index");

        setMetadata({
            title: getPageTitle({
                sections: ["Home"]
            })
        });



        // Get all the posts
        posts = await Post.all(API, PAGINATION);

        if (API.getLastResponse().isError() || posts.length === 0) {
            MAIN.innerHTML += '<p class="text-muted text-center"><small><span class="avatar avatar-fg"><i class="fa-solid fa-magnifying-glass"></i></span>No posts to show</small></p>';
        } else {
            let container = Post.getPostsPreviewContainer(posts);

            MAIN.innerHTML += container;
        }



        HEADER_LINKS.innerHTML = `
        <a class="link" href="#random"><i class="fa-solid fa-dice"></i>&nbsp;Random</a>
        <a class="link" href="#tags"><i class="fa-solid fa-tags"></i>&nbsp;Tags</a>
        `;



        breadcrumbs = [''];



    } else if (route.startsWith("by/")) {
        console.debug("Loading route: posts by author");



        let author = route.substring(3);

        author = decodeURIComponent(author);



        setMetadata({
            title: getPageTitle({
                sections: [`Posts by ${author}`]
            })
        });



        // Get all the posts by the author
        posts = await Post.search({ author: author, pagination: PAGINATION });

        if (API.getLastResponse().isError() || posts.length === 0) {
            MAIN.innerHTML += errorNoMatchingPosts(["path"]);
        } else {
            // Render the posts
            let container = Post.getPostsPreviewContainer(posts);

            MAIN.innerHTML += container;
        }



        breadcrumbs = [`by ${author}`];



    } else if (route === "random") {
        console.debug("Loading route: random");



        // Get a random post
        let posts = await Post.all(API, PAGINATION);

        if (API.getLastResponse().isError() || posts.length === 0) {
            MAIN.innerHTML += '<p class="text-muted text-center"><small><span class="avatar avatar-fg"><i class="fa-solid fa-magnifying-glass"></i></span>No posts to show</small></p>';
        } else {
            let post = posts[Math.floor(Math.random() * posts.length)];

            window.location.hash = `#${post.path}`; // Redirect to the post
        }



    } else {
        console.debug("Loading route: search");

        let post = null;



        // Check if the route is a post ID
        if (await Post.idExists(route)) {
            console.debug("Loading route: post by id");

            post = await Post.getById(route);
        } else if (await Post.pathExists(route)) {
            console.debug("Loading route: post by path");

            post = await Post.get(route);
        } else {
            console.debug("Loading route: search by path");

            let segments = route.split("/").reverse().map(s => { s = s.trim(); return s.charAt(0).toUpperCase() + s.slice(1); });

            setMetadata({
                title: getPageTitle({
                    sections: segments
                })
            });

            posts = await Post.search({ path: route, pagination: PAGINATION });

            if (API.getLastResponse().isError() || posts.length === 0) {
                MAIN.innerHTML += errorNoMatchingPosts(["path"]);
            } else {
                // Render the posts
                let container = Post.getPostsPreviewContainer(posts);

                MAIN.innerHTML += container;
            }

            breadcrumbs = route.split("/");
        }



        if (post) {
            MAIN.appendChild(await post.getPostCard());



            breadcrumbs = post.path.split("/");



            let postMetadata = [
                { name: "og:type", content: "article" }
            ];



            post?.description ? postMetadata.push({ name: "description", property: "og:description", content: post.description }) : null;

            if (post?.author) {
                postMetadata.push({ name: "author", property: "og:author", content: post.author })
                postMetadata.push({ property: "article:author", content: SETTINGS?.get("app.web") + `#by/${post.author}` })
            }

            if (post?.datePublished) {
                postMetadata.push({ property: "og:published_time", content: post.datePublished.toISOString() })
                postMetadata.push({ property: "article:published_time", content: post.datePublished.toISOString() })
            }

            if (post?.dateUpdated) {
                postMetadata.push({ property: "og:updated_time", content: post.dateUpdated.toISOString() })
                postMetadata.push({ property: "article:modified_time", content: post.dateUpdated.toISOString() })
            }

            post?.image ? postMetadata.push({ name: "image", property: "og:image", content: post.image }) : null;

            await post.fetchRelatedPosts();




            setMetadata({
                title: getPageTitle({
                    sections: [post.title || "Untitled post"]
                }),
                metadata: postMetadata
            });
        }
    }



    // Update the app breadcrumbs
    BREADCRUMBS.innerHTML = '';
    BREADCRUMBS.innerHTML = buildAppBreadcrumbs(breadcrumbs);



    // Adjust the posts navigation
    let pm = API?.getLastResponse()?.metadata?.pagination ?? {
        previous_offset: null,
        next_offset: null,
        total: 0
    }; // Pagination metadata

    POSTS_NAV_PREV.dataset.offset = pm?.previous_offset;
    POSTS_NAV_PREV.disabled = pm?.previous_offset === null;

    POSTS_NAV_NEXT.dataset.offset = pm?.next_offset;
    POSTS_NAV_NEXT.disabled = pm?.next_offset === null;

    POSTS_NAV_COUNTER.innerHTML = `${pm?.offset + 1}&ndash;${pm?.offset + posts?.length} of ${pm?.total}`;

    // Toggle the posts navigation
    POSTS_NAV.style.display = (posts.length > 0 && pm?.total > PAGINATION.limit) ? "flex" : "none";



    // Remove the loader
    MAIN.querySelector(`#${loaderId}`).remove();



}