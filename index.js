const puppeteer = require('puppeteer');
const fs = require('fs');

let outPath = 'export.csv';
fs.writeFileSync(outPath, '"Sorszám","Nem","Kor","Alapbetegségek"\n');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://koronavirus.gov.hu/elhunytak?page=0");

    const lastPageUrl = await page.evaluate(() => {
        let lastPageLi = document
            .documentElement
            .querySelector(".pager-last a")
            .getAttribute("href");
        return lastPageLi;
    });

    let pageCountStr = lastPageUrl.match(/page\=(\d+)/)[1];
    let pageCount = parseInt(pageCountStr);

    console.log(pageCount);

    for(let i=0; i<=pageCount; i++)
    {
        let targetUrl = `https://koronavirus.gov.hu/elhunytak?page=${i}`;
        console.log(targetUrl);

        await page.goto(targetUrl);
        await page.waitForSelector(".views-table", {
            visible: true
        });
        let entries = await page.evaluate(() => {
            let getDataOf = (el, selector) =>
                el.querySelector(selector)
                    .innerHTML
                    .replace('õ', 'ő')
                    .replace('Õ', 'Ő')
                    .replace('û', 'ű')
                    .replace('Û', 'Ű')
                    .trim();
                
            let tbodyNl = document.documentElement
                .querySelectorAll(".views-table tbody tr");
            let tbody = [... tbodyNl];
            let deceased = tbody.map((v, i) => {
                let id = getDataOf(v, ".views-field-field-elhunytak-sorszam");
                let sex = getDataOf(v, ".views-field-field-elhunytak-nem");
                let age = getDataOf(v, ".views-field-field-elhunytak-kor");
                let preCond = getDataOf(v, ".views-field-field-elhunytak-alapbetegsegek");
                return `"${id}","${sex}","${age}","${preCond}"`;
            });
            return deceased.join("\n") + "\n";
        });
        fs.appendFileSync(outPath, entries);

        console.log(`page ${i}:`);
        console.log(entries);
    }

    await browser.close();
})();