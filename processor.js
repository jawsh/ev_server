const NodeCache = require("node-cache");

const TTL = 3600;

const cache = new NodeCache({ stdTTL: TTL });
const { readDir, readFiles } = require("./dataprep");

let data;

async function processData() {
    console.info("Starting Data Processing...");
    const filenames = await readDir();
    data = await readFiles(filenames);
    data.forEach((d, i) => {
        const parsed = JSON.parse(d);
        cache.set(i, parsed);
    });
    const documentCount = await countDocuments(data);
    const wordCount = await countWords(data);
    const yearData = await getSourcesFromYear(data);
    const countryData = await getCountries(data);
    const countryYears = await getCountryYears(data);
    const elonCount = await getElon(data);
    const sources = await getSources(data);
    const overview = {
        yearData,
        countryData,
        countryYears,
        wordCount,
        elonCount,
        sources,
        documentCount,
    };
    cache.set("overview", overview);
    cache.set("words", wordCount);
    console.info(cache.getStats());
    console.info("Data Processing Complete - Cache SET");
}

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
        const documentCount = await getDocuments(data);
        const wordCount = await countWords(data);
        const yearData = await getSourcesFromYear(data);
        const countryData = await getCountries(data);
        const countryYears = await getCountryYears(data);
        const elonCount = await getElon(data);
        const sources = await getSources(data);
        const overview = {
            yearData,
            countryData,
            countryYears,
            wordCount,
            elonCount,
            sources,
            documentCount,
        };
        res.send(overview);
        return;
    } catch (err) {
        console.error(err);
        res.status(500);
        return;
    }
};

async function getCountries(data) {
    let countries = {};
    data.forEach((d) => {
        const parsed = JSON.parse(d);
        if (parsed.m_szGeo1 === "") {
            parsed.m_szGeo1 = "Unknown Geo";
        }
        if (!countries[`${parsed.m_szGeo1}`]) {
            countries[`${parsed.m_szGeo1}`] = 1;
        } else {
            countries[`${parsed.m_szGeo1}`] = countries[`${parsed.m_szGeo1}`] + 1;
        }
    });
    cache.set("countries", countries);
    return countries;
}

async function getSourcesFromYear(data) {
    let years = {};
    data.forEach((d) => {
        const parsed = JSON.parse(d);
        if (!years[`${parsed.m_szYear}`]) {
            years[`${parsed.m_szYear}`] = 1;
        } else {
            years[`${parsed.m_szYear}`] = years[`${parsed.m_szYear}`] + 1;
        }
    });
    cache.set("years", years);
    return years;
}

const getCountryYears = async (data) => {
    let countryYear = {};
    data.forEach((d) => {
        const parsed = JSON.parse(d);
        const year = parsed.m_szYear;
        if (parsed.m_szGeo1 === "") {
            parsed.m_szGeo1 = "Unknown Geo";
        }

        if (!countryYear[`${parsed.m_szGeo1}`]) {
            countryYear[`${parsed.m_szGeo1}`] = [`${parsed.m_szYear}`];
        } else {
            if (!countryYear[`${parsed.m_szGeo1}`].includes(`${parsed.m_szYear}`)) {
                countryYear[`${parsed.m_szGeo1}`].push(`${parsed.m_szYear}`);
            }
        }
    });
    return countryYear;
};

const countWords = async (data) => {
    let wordCount = 0;
    data.forEach((d) => {
        const parsed = JSON.parse(d);
        const words = parsed.m_iDocBodyWordCnt;
        wordCount += words;
    });
    return wordCount;
};

const getElon = async (data) => {
    let elonCount = 0;
    data.forEach((d) => {
        const parsed = JSON.parse(d);
        const elon = (parsed.m_szDocBody.match(/elon/g) || []).length;
        elonCount += elon;
    });
    return elonCount;
};

const getSources = async (data) => {
    let sources = {};
    data.forEach((d) => {
        const parsed = JSON.parse(d);
        if (!sources[`${parsed.m_szSourceType}`]) {
            sources[`${parsed.m_szSourceType}`] = 1;
        } else {
            sources[`${parsed.m_szSourceType}`] = sources[`${parsed.m_szSourceType}`] + 1;
        }
    });
    return sources;
};

const countDocuments = async (data) => {
    let documents = 0;
    data.forEach(() => {
        documents = documents + 1;
    });
    return documents;
};

module.exports = {
    getArticle,
    checkCache,
    processData,
    getOverview,
    getCountries,
    getSourcesFromYear,
};
