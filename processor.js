const NodeCache = require("node-cache");

const TTL = 3600;

const cache = new NodeCache({ stdTTL: TTL });
const { readDir, readFiles } = require("./dataprep");

let data;

const processData = async () => {
    console.info("Starting Data Processing...");
    const filenames = await readDir();
    data = await readFiles(filenames);
    await manipulateData(data);
    console.info(cache.getStats(), "CACHE SET");
    console.info("Data Processing Complete");
};

const manipulateData = async (data) => {
    let overview = {};
    let countryData = {};
    let yearData = {};
    let sources = {};
    let countryYears = {};
    let wordCount = 0;
    let elonCount = 0;
    let documentCount = 0;
    try {
        data.forEach((d, i) => {
            const parsed = JSON.parse(d);
            cache.set(i, parsed);

            if (parsed.m_szGeo1 === "") {
                parsed.m_szGeo1 = "Unknown Geo";
            }
            if (!countryData[`${parsed.m_szGeo1}`]) {
                countryData[`${parsed.m_szGeo1}`] = 1;
            } else {
                countryData[`${parsed.m_szGeo1}`] = countryData[`${parsed.m_szGeo1}`] + 1;
            }

            if (!yearData[`${parsed.m_szYear}`]) {
                yearData[`${parsed.m_szYear}`] = 1;
            } else {
                yearData[`${parsed.m_szYear}`] = yearData[`${parsed.m_szYear}`] + 1;
            }

            if (!countryYears[`${parsed.m_szGeo1}`]) {
                countryYears[`${parsed.m_szGeo1}`] = [`${parsed.m_szYear}`];
            } else {
                if (!countryYears[`${parsed.m_szGeo1}`].includes(`${parsed.m_szYear}`)) {
                    countryYears[`${parsed.m_szGeo1}`].push(`${parsed.m_szYear}`);
                }
            }

            if (!sources[`${parsed.m_szSourceType}`]) {
                sources[`${parsed.m_szSourceType}`] = 1;
            } else {
                sources[`${parsed.m_szSourceType}`] = sources[`${parsed.m_szSourceType}`] + 1;
            }

            const words = parsed.m_iDocBodyWordCnt;
            wordCount += words;

            const elon = (parsed.m_szDocBody.match(/elon/g) || []).length;
            elonCount += elon;

            documentCount++;
        });
    } catch (err) {
        throw err;
    }
    overview = {
        yearData,
        countryData,
        countryYears,
        wordCount,
        elonCount,
        sources,
        documentCount,
    };
    cache.set("overview", overview);

    return overview;
};

const checkCache = (req, res, next) => {
    const { query } = req.query;
    const data = cache.get(query);
    if (data === undefined) {
        next();
    } else {
        console.info(`${query} found in cache!`);
        res.send(data);
        return;
    }
};

const getArticle = (req, res) => {
    const { query } = req.query;
    res.send(data[query]);
};

const getOverview = async (req, res) => {
    try {
        console.info("Processing Overview Data");
        const overview = await manipulateData(data);
        res.send(overview);
        return;
    } catch (err) {
        console.error(err);
        res.status(500);
        return;
    }
};

module.exports = {
    getArticle,
    checkCache,
    processData,
    getOverview,
};
