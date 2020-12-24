const puppeteer = require('puppeteer');
const axios = require('axios');

(async(player) => {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();
  await page.goto(`http://www.tibiaring.com/char.php?c=${player}`);
  let killed = await page.evaluate(async() => {
    return new Promise(async resolve => {
      resolve(await [...document.querySelectorAll("[data-th='Killed']")].map(e => e.textContent));
    });
  });

  let ring = await page.evaluate(async(player) => {
    return new Promise(async resolve => {
      let trs = [...document.querySelector("#gworld").querySelectorAll("tr")]
      for (let i = 0; i < trs.length; i++) {
        if (trs[i].textContent.includes(player)) {
          resolve(await trs[i].querySelectorAll("td")[2].textContent)
        }
      }
      resolve("Erro ao buscar o ring")
    })
  }, player)

  let result = {
    'Neutro': 0
  }
  let fails = 0
  let promises = []

  for (let i in killed) {
    if (killed[i].length && killed[i] != player) {
      promises.push(new Promise(resolve => {
        axios.get(`https://api.tibiadata.com/v2/characters/${killed[i]}.json`).then(r => {
          let guild = r.data.characters.data.guild
          if (guild != undefined)
            result[guild.name] ? result[guild.name] += 1 : result[guild.name] = 1
          else
            result['Neutro'] += 1
          resolve()
        }).catch(e => {
          fails += 1
          resolve()
        })
      }))
    }
  }
  await Promise.all(promises)

  return {
    ring: ring,
    result: result,
    fails: fails
  }

})();