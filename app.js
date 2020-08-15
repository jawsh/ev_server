const express = require("express");
const app = express();
const server = require("http").Server(app);
const cors = require("cors");

const { getOverview, getArticle, processData, checkCache } = require("./process-overview");

const port = 3001;

processData().then(() => {
    server.listen(port, (err) => {
        if (err) {
            throw err;
        }
        console.log(`Server listening on port ${port}`);
    });
});

app.use(cors());

app.get("/overview/", checkCache, getOverview);

app.get("/article/", checkCache, getArticle);
