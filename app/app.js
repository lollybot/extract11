const express = require("express");
const app = express();
const validator = require("./validator");
const mercury = require("@postlight/mercury-parser");
var { Readability } = require('@mozilla/readability');
let { JSDOM, ResourceLoader } = require("jsdom");

function decodeURL(encodedURL) {
    return Buffer.from(encodedURL, "base64").toString("utf-8");
}

function getParams(request) {
    const user = request.params.user;
    const signature = request.params.signature;
    const base64url = request.query.base64_url.replace(/ /g, '+');
    const url = decodeURL(base64url);
    return {user, signature, url}
}

app.get("/health_check", (request, response) => {
    response.send("200 OK");
});

app.get("/parser/:user/:signature", (request, response, next) => {
    try {
        const {user, signature, url} = getParams(request);
        new validator(user, url, signature).validate().then(result => {
            console.log("Parsing: " + url);
            mercury.parse(url).then(result => {
                const code = ("error" in result ? 400 : 200);
                response.status(code).send(result);
            }).catch(function(error) {
              response.status(400).json({ error: true, messages: "Cannot extract this URL." });
            });
        }).catch(function(error) {
            response.status(400).json({ error: true, messages: error });
        });
    } catch {
        response.status(400).json({ error: true, messages: "Invalid request. Missing base64_url parameter." });
    }
});

// Readability Firefox
app.get("/readability/:user/:signature", (request, response, next) => {
    try {
        const {user, signature, url} = getParams(request);
        new validator(user, url, signature).validate().then(result => {
            console.log("Parsing: " + url);
            JSDOM.fromURL(url, {
                    resources: new ResourceLoader(),
                })
                    .then((doc) => {
                        const reader = new Readability(doc.window.document);
                        response.status(200).json({
                            content: reader.parse().content,
                        });
                    })
                    .catch(function (error) {
                        console.log(error)
                        response.status(400).json({
                            error: true,
                            messages: error.message,
                        });
                    })
                    .then(Promise.resolve());
        }).catch(function(error) {
            response.status(400).json({ error: true, messages: error });
        });
    } catch {
        response.status(400).json({
            error: true,
            messages: "Invalid request. Missing base64_url parameter.",
        });
    }
});

module.exports = app