const NodeCache = require("node-cache");

const TTL = 1200;

const cache = new NodeCache({ stdTTL: TTL });
const { readDir, readFiles } = require("./dataprep");

let data;

async function processData() {
    console.info("Starting Data Processing...");
    const filenames = await readDir();
    data = await readFiles(filenames);
    let wordcount = 0;
    data.forEach((d, i) => {
        const parsed = JSON.parse(d);
        wordcount += parsed.m_iDocBodyWordCnt;
        cache.set(i, parsed);
    });
    const yearData = await getSourcesFromYear(data);
    const countryData = await getCountries(data);
    const countryYear = await getCountryYears(data);
    const overview = {
        yearData,
        countryData,
    };
    cache.set("overview", overview);
    cache.set("words", wordcount);
    console.info(cache.getStats());
    console.info("Data Processing Complete - Cache SET");
}

const getArticle = (req, res) => {
    const { query } = req.query;
    res.send(data[query]);
};

const getOverview = async (req, res) => {
    try {
        const yearData = await getSourcesFromYear(data);
        const countryData = await getCountries(data);
        const overview = {
            yearData,
            countryData,
        };
        res.send(overview);
        return;
    } catch (err) {
        console.error(err);
        res.status(500);
        return;
    }
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

const getCountryYears = async () => {
    let countryYear = {};
    data.forEach((d, i) => {
        if (i < 3) {
            const parsed = JSON.parse(d);
            const year = parsed.m_szYear;
            if (parsed.m_szGeo1 === "") {
                parsed.m_szGeo1 = "Unknown Geo";
            }
            if (!countryYear[`${parsed.m_szGeo1}`]) {
                countryYear[`${parsed.m_szGeo1}`] = 1;
            }
        }
    });
    return countryYear;
};

module.exports = {
    getArticle,
    checkCache,
    processData,
    getOverview,
    getCountries,
    getSourcesFromYear,
};
