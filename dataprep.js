const fs = require("graceful-fs");
const util = require("util");
const readDirAsync = util.promisify(fs.readdir);

const readDir = async (directory = "./JSON") => {
    return readDirAsync(directory);
};

const readFiles = async (files) => {
    return await Promise.all(
        files.map((f) => {
            return fs.readFileSync(`./JSON/${f}`);
        })
    );
};

module.exports = {
    readDir,
    readFiles,
};
