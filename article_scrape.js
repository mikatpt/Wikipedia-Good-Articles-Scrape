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

    const categoryNames = await getCategoryNames(driver);

    console.log(categoryNames);

    const result = await getLinks(driver, categoryNames);

    await driver.quit();

    const fileName = `./allCategories.json`;

    await fs.writeFile(
        fileName,
        JSON.stringify(result),
        "utf-8",
        function (err) {
            if (err) {
                console.log(`error occured with: ${fileName}`);
            }
        }
    );

    return result;
}

const getCategoryNames = async (driver) => {
    const categoryNodes = await driver.findElements(
        By.className("ext-discussiontools-init-section")
    );
    const namePromises = categoryNodes.map((elem) => elem.getText());

    return Promise.all(namePromises);
};

const getLinks = async (driver, categoryNames) => {
    const result = {};
    let index = 0;

    const categoryNodes = await driver.findElements(
        By.className("wp-ga-topic")
    );

    categoryNodes.shift();

    for (const categoryNode of categoryNodes) {
        console.log(categoryNames[index]);
        const anchors = [];

        const subcategoryNodes = await categoryNode.findElements(
            By.className("mw-collapsible mw-made-collapsible")
        );

        const subsubNodePromises = subcategoryNodes.map((elem) =>
            elem
                .findElement(By.className("mw-collapsible-content"))
                .findElements(By.css("p"))
        );

        const subsubNodes = await Promise.all(subsubNodePromises);

        for (const paragraphNodes of subsubNodes) {
            for (const paragraphNode of paragraphNodes) {
                const anchorNodes = await paragraphNode.findElements(
                    By.css("a")
                );

                const anchorNodePromises = anchorNodes.map((elem) => {
                    return elem.getAttribute("href");
                });

                const res = await Promise.all(anchorNodePromises);

                for (const x of res) {
                    anchors.push(x);
                }
            }
        }

        result[categoryNames[index]] = anchors;
        index++;
    }

    return result;
};

const main = async () => {
    const urls = [
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/all",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Agriculture,_food_and_drink",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Art_and_architecture",

        "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Engineering_and_technology",
        //fix ^

        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Geography_and_places",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/History",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Language_and_literature",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Mathematics",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Media_and_drama",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Music",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Natural_sciences",
        //fix ^
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Philosophy_and_religion",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Social_sciences_and_society",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Sports_and_recreation",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Video_games",
        // "https://en.wikipedia.org/wiki/Wikipedia:Good_articles/Warfare",
        //fix ^
    ];

    const resultPromises = urls.map((elem) => articleScrape(elem));

    const results = await Promise.all(resultPromises);
};

main();
