import webdriver from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
// eslint-disable-next-line
import fs from "fs";

const { By } = webdriver;

async function articleScrape(url) {
    const options = new chrome.Options();
    options.addArguments("--headless");
    options.addArguments("log-level=3");

    const driver = new webdriver.Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

    await driver.get(url);

    await driver.sleep(1000);

    const categoryName = await getCategoryName(driver);

    console.log(categoryName);

    const link_object = { name: categoryName, links: await getLinks(driver) };

    await driver.quit();

    const fileName = `./aggregated_links/${categoryName}.json`;

    console.log(link_object);

    await fs.writeFile(
        fileName,
        JSON.stringify(link_object),
        "utf-8",
        function (err) {
            if (err) {
                console.log(`error occured with: ${fileName}`);
            }
        }
    );

    return link_object;
}

const getCategoryName = async (driver) => {
    const categoryNode = await driver.findElement(
        By.className("ext-discussiontools-init-section")
    );
    const nameRaw = await categoryNode.getText();

    return nameRaw.slice(0, nameRaw.length - 6);
};

const getLinks = async (driver) => {
    const categoryNode = await driver.findElement(By.className("wp-ga-topic"));

    const subcategoryNodes = await categoryNode.findElements(
        By.className("mw-collapsible mw-made-collapsible")
    );

    const subsubNodePromises = subcategoryNodes.map((elem) =>
        elem
            .findElement(By.className("mw-collapsible-content"))
            .findElements(By.css("p"))
    );

    const subsubNodes = await Promise.all(subsubNodePromises);

    const anchors = [];
    for (const paragraphNodes of subsubNodes) {
        console.log(paragraphNodes.length);
        for (const paragraphNode of paragraphNodes) {
            const anchorNodes = await paragraphNode.findElements(By.css("a"));

            const anchorNodePromises = anchorNodes.map((elem) => {
                return elem.getAttribute("href");
            });

            const res = await Promise.all(anchorNodePromises);

            for (const x of res) {
                anchors.push(x);
            }
        }
    }

    return anchors;
};

const main = async () => {
    const urls = [
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Agriculture,_food_and_drink",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Art_and_architecture",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Engineering_and_technology",

        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Geography_and_places",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/History",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Language_and_literature",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Mathematics",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Media_and_drama",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Music",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Natural_sciences",

        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Philosophy_and_religion",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Social_sciences_and_society",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Sports_and_recreation",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Video_games",
        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Warfare",
    ];

    const resultPromises = urls.map((elem) => articleScrape(elem));

    const results = await Promise.all(resultPromises);
};

main();
