import puppeteer from "puppeteer";
import base64Img from 'base64-img';
import crop from "crop-node";

const SITE_URL = "https://www.japeal.com/pkm";
const ASSETS_DIRECTORY = "./assets/";
const BIDOOF_ID = 403;
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

console.log("Starting")
for (var i = 1; i < 497; i ++) {
  console.log("Index " + i);
  await getRandomFusion("/Applications/Chromium.app/Contents/MacOS/Chromium", i).then((res) => {
    console.log(res.fusionName);
    console.log("Converting !");
    base64Img.img(res.fusionBase64, ASSETS_DIRECTORY, res.fusionName, async function(err, filepath){
        console.log("Cropping !");
        const cropped = await crop(filepath);
        base64Img.img(`data:image/png;base64,${cropped.toString('base64')}`, ASSETS_DIRECTORY, res.fusionName, async function(err, filepath){});
    });
  });
}

async function sleep(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000)
    })
}

async function getRandomFusion(browserPath, i) {
    let browser;
    try {
  
      browser = await puppeteer.launch({
        // Launch using specific browser path if set
        ...browserPath ? { executablePath: browserPath } : {},
        args: [
          '--disable-dev-shm-usage', // Used to prevent Chromium from crashing inside Docker
          '--window-size=1040,780', // Need a larger window to render the whole Pokédex entry
        ],
      })
      const page = await browser.newPage()
      console.log("[PokéFusion API] Launched browser through Puppeteer")

      var efc = `p1=${BIDOOF_ID}@p2=${i}@ss=0@c1=rgb(98,213,180)@c2=rgb(255,238,189)@c3=rgb(164,213,65)@c4=rgb(0,0,0)@c5=rgb(0,0,0)`;
      var param = Base64.encode(efc);
      var url = `${SITE_URL}?efc=${param}`
  
      console.log(`[PokéFusion API] Navigating to ${url}`);
      await page.goto(url)
  
      // Page fully loaded, you can execute scripts now
  
      // First, let that putrid PHP Wordpress third world piece of bullcrap load all of its shit
      await sleep(1)
  
      // Close the Patreon dialog and make the fusion happen
      await page.evaluate(`
        ShowUnlock();
        document.getElementById("fbutton").onclick();
      `)
  
      // Wait another 5 seconds for the fusion
      await sleep(10)
      console.log("[PokéFusion API] Getting fusion info!")
  
      // Grab info about final fusion
      const result = await page.evaluate(`
      function grabFusionInfo() {
        var fusionIndexes = document.getElementById('fbutton').onclick.toString()
          .replace('function onclick(event) {', '')
          .replace('}', '').replace('LoadNewFusionDelay(', '')
          .replace(')', '').trim().split(',');
        return JSON.stringify({
          leftPkmnIndex: parseInt(fusionIndexes[0]),
          rightPkmnIndex: parseInt(fusionIndexes[1]),
          fusionBase64: document.getElementById('combinedNEW').toDataURL(),
          fusionName: document.getElementById('fnametxt').innerHTML.trim(),
        })
      }
      grabFusionInfo()
      `)
      let fusionInfo = JSON.parse(result);

      const base64Fusion = await page.evaluate(`
        function getBase64Fusion() {
            return document.getElementById("image").src;
        }
        getBase64Fusion();
      `)
  
      // Grab Pokédex entry image from page
      await page.evaluate(`changeBG9()`) // Open Pokédex
  
      console.log("[PokéFusion API] Your fusion is ready!")
      return {
        ...fusionInfo,
        pokedexBase64: base64Fusion
      }
  
    } catch (err) {
      console.error("[PokéFusion API] Fatal Error!", err)
    } finally {
      if (browser) { await browser.close() }
    }
  }

/*
let divs = document.getElementsByClassName("fnone");
or (i of divs) {
  if(i.attributes.getNamedItem("value").value == 403) {
        if(i.offsetParent) var smth = i; // Si null, pas le bon car pas visible
  }
}
*/