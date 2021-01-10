// REQUIREMENTS

// native
const path = require('path');

// 3rd party
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require("node-fetch");
// var userAgent = require('user-agents');

// local
const app = express();
const port = process.env.PORT || 8000;

// MIDDLEWARE
app.use(express.static(path.join(__dirname, '../public')));
app.use('/css', express.static(__dirname + '../node_modules/bootstrap/dist/css'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// allow cors to access this backend
app.use( (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// INIT SERVER
app.listen(port, () => {
    console.log(`Started on port ${port}`);
});

// helper functions

function renInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

let wordCountObj = (arrStrs) => {
    let totalCount = 0;
    let arrObjs = [];
    let wordObj = {};
    arrStrs.forEach((word)=>{
        wordObj[word] ? wordObj[word]+=1 : wordObj[word]=1;
    });
    for (var pro in wordObj) {
        totalCount += wordObj[pro];
        arrObjs.push({'key': pro, 'count': wordObj[pro]});
    }
    arrObjs.sort((a,b)=>{
        // return (a.key > b.key ? 1 : -1);
        return (a.count < b.count ? 1 : -1);
    });
    arrObjs.forEach((obj)=>{
        obj.percentage = (obj.count / totalCount * 100).toFixed(2);
        obj.totalCount = totalCount;
    });
    return arrObjs;
};

// ROUTES
// root
app.get('/', function (req, res) {
    res.send('hello world');
});

////////////////////// I am trying another than document.body.innerText //////////////////// 

// // all nodes
// var allNodes = Array.prototype.slice.call(document.body.getElementsByTagName("*"), 0);

// var allNodes = Array.from(document.body.querySelectorAll("*"));

// // not all node
// var allNodes = Array.from(document.body.querySelectorAll('*:not(div):not(style):not(script):not(svg):not(form):not(img)'));

// // if don't have child node
// var leafNodes = allNodes.filter(elem => !elem.hasChildNodes());

// // innerText of nodes
// var texts = allNodes.map(elem => elem.innerText);

// var texts = allNodes.map((elem) => {
// if(!elem.hasChildNodes()){
// return elem.innerText;
// }else{
// return '';
// }
// });

// // remove empty string
// var filtered = texts.filter(el => el != "");
// var allNodes = Array.from(document.body.querySelectorAll('*:not(div):not(style):not(script):not(svg):not(form):not(img)'));

// var texts = allNodes.map(elem => elem.innerText);
//////////////////////////////////////////////////////////////////////////////// 

// scrape for all "a" tag's "href" content of given page
// standard the page
let scrape = async (targetPage) => {
    // const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'], ignoreHTTPSErrors: true, slowMo: 100}); // need for real server
    var browser = await puppeteer.launch({headless: false, ignoreHTTPSErrors: true, slowMo: 100});  // need to slow down to content load

    var page = await browser.newPage();
    // deal with navigation and page timeout, see the link
    // https://www.checklyhq.com/docs/browser-checks/timeouts/
    var navigationPromise =  page.waitForNavigation();

    // await page.setUserAgent(userAgent.random().toString());
    // await page.setDefaultNavigationTimeout(0);   // use when set your own timeout

    await page.goto(targetPage, { timeout: 10000, waitUntil: 'load' });
    await navigationPromise;

    await page.waitForTimeout(renInt(500, 600));
    let str = await page.evaluate((selector) => {
        let el = document.querySelector(selector);
        return el ? el.innerText : "innerText error";
    }, 'body');
    // console.log(str);
    // break word like "HelloWorld" to "Hello World"
    let formatedStr = str.replace(/([A-Z]\w)/g, ' $1').trim();
    // console.log(formatedStr);
    // split string to array by space
    let strArr = formatedStr.split(/\s/);
    // console.log(strArr);
    // filter out empty string from array
    var filteredStrArr = strArr.filter(el => el != '');
    // console.log(filteredStrArr);
    await page.waitForTimeout(renInt(500, 600));
    
    await page.close();
    await browser.close();
    console.log("done scraping");
    return filteredStrArr;
};

// post, get form data from frontend
app.post('/api', async function (req, res) {
    req.setTimeout(0);
    let targetPage = req.body.targetPage || "";
    await scrape(targetPage)
    .then((resultArr)=>{
        res.send(wordCountObj(resultArr));
    }).catch(() => {}); 
});