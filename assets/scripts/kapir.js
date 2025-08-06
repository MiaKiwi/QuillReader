class KapirApi {
    constructor(base) {
        this.base = base === '/' ? base : base.replace(/\/$/, "");
    }



    getEndpointURL(endpoint) {
        if (endpoint.startsWith("/")) {
            return this.base + endpoint;
        } else {
            return endpoint;
        }
    }



    async fetch(endpoint, options = {}) {
        let resp = await fetch(this.getEndpointURL(endpoint), options).then((r) => { return r.json() })

        let parsedResp = this.parseResponse(resp);

        if (!this.responses) {
            this.responses = [];
        }

        this.responses.push(parsedResp);

        return parsedResp;

    }



    parseResponse(raw, version = null) {
        version = version ?? raw?.version ?? null;

        switch (true) {
            case version.startsWith("25.1.0"):
                return new KapirResponse25_1_0(raw);

                break;

            default:
                throw new Error(`KAPIR version ${version} not supported`);
        }
    }



    getLastResponse() {
        if (!this.responses || this.responses.length === 0) {
            return null;
        }

        return this.responses[this.responses.length - 1];
    }
}



class KapirResponse {
    constructor(raw, formatVersion) {
        this.formatVersion = formatVersion;
        this.raw = raw;
        this.response = this.isValid() ? this.raw : this.getFallback();
    }



    isValid() {
        throw new Error("Method 'isValid()' must be implemented.");
    }



    getFallback() {
        throw new Error("Method 'getFallback()' must be implemented");
    }



    isSuccess() {
        return this.status === 'success';
    }



    isError() {
        return this.status === 'error';
    }



    hasFeature(flag) {
        return this.response.version.toLowerCase().split('-').includes(flag.toLowerCase());
    }



    get status() {
        return this.response.status;
    }



    get version() {
        return this.response.version.split('-')[0];
    }



    get data() {
        return this.response.data;
    }



    get message() {
        return this.response.message;
    }



    get error() {
        return this.response.error;
    }



    get metadata() {
        return this.response.meta;
    }
}

class KapirResponse25_1_0 extends KapirResponse {
    constructor(raw) {
        super(raw, "25.1.0");
    }



    isValid() {
        let raw = this.raw;

        console.debug("raw is object");
        if (typeof raw !== 'object' || Array.isArray(raw) || raw === null) return false;

        console.debug("raw has required keys");
        if (["status", "version", "data", "message", "error", "meta"].some((member) => { return !raw.hasOwnProperty(member) })) return false;

        // Status
        console.debug("status is valid");
        if (!["success", "error"].includes(raw.status)) return false;



        // Version
        console.debug("version is valid");
        if (!raw.version.startsWith(this.formatVersion)) return false;



        // Message
        console.debug("message is valid");
        if (raw.message !== null && typeof raw.message !== "string") return false;



        // Error
        let error = raw.error;
        console.debug("error is valid");
        if (raw.status === "error") {
            console.debug("error is object");
            if (typeof error !== 'object' || Array.isArray(error) || error === null) return false;

            console.debug("error has required keys");
            if (["code", "message", "errors"].some((member) => { return !error.hasOwnProperty(member) })) return false;

            // Code
            console.debug("error.code is valid");
            if (typeof error.code !== "string") return false;



            // Message
            console.debug("error.message is valid");
            if (typeof error.message !== "string" && error.message !== null) return false;



            // Errors
            console.debug("error.errors is array");
            if (!Array.isArray(error.errors)) return false;

            console.debug("error.errors are valid");
            if (error.errors.some((err) => {
                console.debug("error.errors[i] has required keys");
                if (["code", "message"].some((member) => { return !err.hasOwnProperty(member) })) return true;

                // Code
                console.debug("error.errors[i].code is valid");
                if (typeof err.code !== "string") return true;



                // Message
                console.debug("error.errors[i].message is valid");
                if (typeof err.message !== "string" && err.message !== null) return false;

                return false;
            })) return false;
        } else {
            if (error !== null) return false;
        }



        // Metadata
        console.debug("meta is valid");
        if (raw.meta !== null && (typeof raw !== 'object' || Array.isArray(raw.meta))) return false;

        return true;
    }



    getFallback() {
        return {
            "status": "error",
            "version": this.formatVersion,
            "data": null,
            "message": null,
            "error": {
                "code": "malformed_response",
                "message": "Received a malformed Response",
                "errors": []
            },
            "meta": null
        }
    }
}