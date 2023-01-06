const cron = require("node-cron");
const https = require("https");
const axios = require("axios");
const cheerio = require("cheerio");
const { sendData } = require("./index.js");
const token = "5730954289:AAGDPIDwIyhae6aQwb7Y4T7_Gf6PrhyPd30";
const chatId = "404000198";
const host = "https://drama.nontondrama.lol/";


sendMessage('server is on')

async function ekstrak(url) {
 const query = url
  .match(
   /^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/
  )[5]
  .replaceAll("/", "");
 //console.log(query)
 const config = {
  headers: {
   "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
   "Accept-Encoding": "application/json",
  },
 };

 let result = await axios.get(url, config).then((res) => {
  let html = res.data;
  let $ = cheerio.load(html);
  let server_list = {};

  let data = {};

  // this for find server embed
  let list = $("section").find("ul#loadProviders");
  list.children().each(function () {
   const server = $(this).find("a").text();
   const link = $(this).find("a").attr("href");

   server_list[server] = {};

   server_list[server]["link"] = link;
   server_list[server]["quality"] = [];

   $(this)
    .find("span")
    .each(function (v, i) {
     server_list[server]["quality"].push($(this).text());
    });
  });
  return {
   server_embed: server_list,
  };
 });

 const cookie = await getCookie(query);
 let get_download = await axios({
  method: "post",
  url: "https://dl.indexmovies.xyz/verifying.php",
  data: {
   slug: query,
  },
  headers: {
   "user-agent":
    "Mozilla/5.0 (Linux; Android 12; CPH2043) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36",
   "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
   "Accept-Encoding": "application/json",
   cookie: cookie,
  },
 }).then((res) => {
  let data = res.data;
  const $ = cheerio.load(data);
  let list = $("tbody > tr");
  let index = {
   link_download: [],
  };
  list.each(function (v, i) {
   let item = $(this).find("strong").text();
   let link = $(this).find("a").attr("href");
   let quality = $(this).find("a").attr("class").substring(9, 13);
   index["link_download"].push({
    item,
    link,
    quality,
   });
  });
  //console.log(index)
  return index;
 });
 let final = {
  ...result,
  ...get_download,
 };

 //  console.log(final)
 return final;
}

async function getCookie(id) {
 // Logger.info('from cookie')
 // console.log('2')

 const config = {
  headers: {
   "user-agent":
    "Mozilla/5.0 (Linux; Android 12; CPH2043) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36",

   "content-type": "application/x-www-form-urlencoded; charset=UTF-8",

   "Accept-Encoding": "application/json",
  },
 };

 let result = await axios
  .get("https://dl.indexmovies.xyz/get/" + id, config)
  .then((res) => {
   let data = res.data;
   const search = "setCookie('validate'";
   let idx = data.indexOf(search);
   let hasil = data.substring(idx + 23, idx + 63);
   //console.log("");
   //Logger.warning(data)
   return "validate=" + hasil;
  });
 // console.log(result);
 return result;
}

async function meta(url) {
 //const self = this;
 //console.log(url)
 const result = await axios(url).then(({ data: html }) => {
  //console.log(html)
  const $ = cheerio.load(html);
  const serial = $(".serial-wrapper");

  const h4 = serial.find("h4");
  const episodeList = serial.find(".episode-list ");
  const index = { id: "id", seasons: [] };

  //for id
  const id = url
   .match(
    /^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/
   )[5]
   .replaceAll("/", "");
  index.id = id;
  //console.log(id);

  h4.each(function () {
   const season = $(this)
    .text()
    .match(/Season (\d+)/)[1];
   index.seasons.push({ season: parseInt(season), episodes: [] });
  });

  Promise.all(
   episodeList.each(async function (i, v) {
    const episode = $(this).find("a");

    const list = [];

    Promise.all(
     episode.each(async function () {
      const episodeList = $(this).text();
      const link = $(this).attr("href");
      if ($(this).text() !== "Info") {
       list.push({ episode: episodeList, link, download: [], embed: [] });
      }
     })
    );
    // console.log(list);

    index.seasons[i].episodes = index.seasons[i].episodes.concat(list);
   })
  );
  index.seasons.sort((a, b) => a.season - b.season);

  for (const movie of index.seasons) {
   movie.episodes.sort((a, b) => a.episode - b.episode);
  }

  return index;
 });

 // console.log("mencari data :" + result.id);

 for (const [index, movie] of result.seasons.entries()) {
  //console.log(`Movie ${index + 1}: ${movie.season}`);
  for (const [episodeIndex, episode] of movie.episodes.entries()) {
   /*
   console.log(
    `Episode ${episodeIndex + 1}: ${episode.episode} dari season ${index + 1}`
   );
   */
   const data = await ekstrak(episode.link);
   const embed = data.server_embed;
   const download = data.link_download;
   result.seasons[index].episodes[episodeIndex].embed = embed;
   result.seasons[index].episodes[episodeIndex].download = download;
  }
 }

 //console.log(JSON.stringify(result, null, 1));
 return result;
}

async function latestPage() {
 const { data: html } = await axios("https://drama.nontondrama.lol/latest");
 const $ = cheerio.load(html);

 const pageData = [];
 const data = [];
 // Ambil data yang diinginkan dari halaman web
 const list = $("#grid-wrapper > div");
 const index = [];
 const TMDB = [];

 list.find("figure > a").each(async function () {
  let title = $(this).find("img").attr("alt");
  let link = $(this).attr("href");
  index.push({ link });
 });
 for (const link of index) {
  const oke = await meta(link.link);
  data.push(oke);
 }

 return data;
 //console.log(data)
}

async function scrapingData() {
 let retryCount = 0;

 async function attemptFetch() {
  try {
   return await latestPage();
  } catch (error) {
   if (retryCount >= 3) {
    sendMessage(
     `Fetch data failed after 3 retries \n date = ${new Date().toDateString()}`
    );
    //console.error('Fetch data failed after 3 retries');
    return;
   }

   retryCount += 1;
   sendMessage(
    `Fetch data failed. Retrying in 5 seconds... (attempt ${retryCount}) \n date =${new Date().toDateString()}`
   );
   //console.log(`Fetch data failed. Retrying in 5 seconds... (attempt ${retryCount})`);
   setTimeout(attemptFetch, 5000);
  }
 }

 return await attemptFetch();
}

async function sendMessage(messages) {
 const message = encodeURIComponent(messages);
 const options = {
  hostname: "api.telegram.org",
  port: 443,
  path: `/bot${token}/sendMessage?chat_id=${chatId}&text=${message}`,
  method: "POST",
 };
 const req = https.request(options, (res) => {
  //console.log(`statusCode: ${res.statusCode}`);

  res.on("data", (d) => {
   process.stdout.write(d);
  });
 });

 req.on("error", (error) => {
  console.error(error);
 });

 req.end();
}

function duration(duration) {
 const hours = Math.floor(duration / (1000 * 60 * 60));
 const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
 const seconds = Math.floor((duration % (1000 * 60)) / 1000);
 return `${hours}:${minutes}:${seconds}`;
}

cron.schedule("40 11 * * *", async () => {
 sendMessage("Running a job for scraping and upload database");
 //console.log('start')
 const start = performance.now();
 const data = await latestPage();
 //const data = require("../drakor/serialData-page-44.json")
 const end = performance.now();
 //console.log("end");
 const waktu = duration(end - start / 1000);
 const firebase = await sendData(data);
 //const firebase = await sendData(require("../drakor/serialData-page-44.json"));
 
 sendMessage(
  `Message = success\nTotal = ${data.length} \nDuration = ${waktu} \n Date = ${new Date().toDateString()} \n\n UPLOAD DATABASE \n Updated = ${
   firebase.updated
  } \n Added = ${firebase.added}`
 );
 
 
});
