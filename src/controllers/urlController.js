
const shortid = require('shortid');
const Validator = require('../Validator/valid');
const urlModels = require("../models/urlModels");
const redis = require("redis");
const { promisify } = require("util")

//1. connect to the server and Connection setup for redis
const redisClient = redis.createClient(
    15007,
    "redis-15007.c1.asia-northeast1-1.gce.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("yOhluNiC8w026iPNjrrbQ6mgM421WMCU", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//2. use the commands :
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const createUrl = async function (req, res) {
    try {
        let data = req.body
        const longUrl = data.longUrl;
        const base = "http://localhost:3000"     //our server base code
        const urlCode = shortid.generate(); // generate the unique code
        // check the data are present or not 
        if (!Validator.isValidReqBody(data)) { return res.status(400).send({ status: false, msg: "Please provide data" }) }
        // required the url in body
        if (!Validator.isValid(longUrl)) return res.status(400).send({ status: false, msg: "Please provide long Url Link" })
        // validation  of url link
        if (Validator.validUrl(longUrl)) {
            const checkCache = await GET_ASYNC(`${longUrl}`) // find the data in cache memory
            if (checkCache) {
                let obj = JSON.parse(checkCache) //to convert JSON object
                return res.status(200).send({ status: "true", data: { longUrl: obj.longUrl, shortUrl: obj.shortUrl, urlCode: obj.urlCode } })
            }
            const saveUrl = await urlModels.findOne({ longUrl: longUrl }) // check the data are present or not
            if (saveUrl) {
                return res.status(200).send({ status: true, data: { longUrl: saveUrl.longUrl, shortUrl: saveUrl.shortUrl, urlCode: saveUrl.urlCode } })
            }
            else {
                const shortUrl = `${base}/${urlCode}`; // merage the base url and url code in store in short url
                //taking the key and value in url object
                const url = {
                    longUrl,
                    shortUrl,
                    urlCode
                };
                const saveData = await urlModels.create(url); // create the data in url model
                // set the data in cache memory 
                await SET_ASYNC(`${longUrl}`, JSON.stringify(saveData))

                return res.status(201).send({ status: true, data: { longUrl: saveData.longUrl, shortUrl: saveData.shortUrl, urlCode: saveData.urlCode } })
            }
        }
        else {
            return res.status(400).send({ status: false, msg: "Invalid Url!!" });
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

const getUrlcode = async function (req, res) {
    try {
        let urlCode = req.params.urlCode
        //validation of the url code
        if(!shortid.isValid(urlCode)) return res.status(400).send({ status: false, message: "Url code  is not valid !!" });


        const checkCache = await GET_ASYNC(`${urlCode}`) // find the data in cache memory
        if (checkCache) {
            let obj = JSON.parse(checkCache) //convert to JSON string in JSON object
            return res.status(302).redirect(JSON.parse(obj)) // redirect the url
        }

        let getUrl = await urlModels.findOne({urlCode}) // find the url data in db by urlcode
        if (!getUrl) return res.status(404).send({ status: false, msg: "This urlcode no data exists" })

        let seturl = getUrl.longUrl
        await SET_ASYNC(`${seturl}`, JSON.stringify(getUrl)) // // set the data in cache memory 
        return res.status(302).redirect(seturl)
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports = { createUrl, getUrlcode }
