import wikijs from "wikijs";
import urlencode from "urlencode";
import fs from "fs";

const getAnchors = async (url) => {
    const wiki = wikijs.default;

    const article_name = url.slice(url.indexOf("/wiki/") + 6);

    const article = urlencode.decode(article_name, "utf8").replaceAll("_", " ");

    const test = await wiki().page(article);

    const res = await test.links();

    const falsePositives = [
        "main page",
        "article",
        "read",
        "",
        "terms of use",
        "privacy policy",
        "",
        "song",
        "single",
        "game",
        "isbn",
        "issn",
        "title",
        "video game",
        "terms of use",
        "ISBN (identifier)",
    ];

    const clean_res = res.filter((e) => {
        return (
            !falsePositives.includes(e.toLowerCase()) &&
            e.length > 2 &&
            !e.includes("(s)")
        );
    });

    return {
        title: article,
        anchors: clean_res,
    };
};

async function throttlePromises(funcs) {
    const result = [];
    for (const promise of funcs) {
        const a = await promise;
        result.push(a);
    }
    return result;
}

const main = async () => {
    const categories = [
        "Agriculture, food, and drink",
        "Art and architecture",
        // "Engineering and technology",
        // "Geography and places",
        // "History",
        // "Language and literature",
        "Mathematics",
        // "Media and drama",
        // "Music",
        // "Natural sciences",
        // "Philosophy and religion",
        // "Social sciences and society",
        // "Sports and recreation",
        // "Video games",
        // "Warfare",
    ];

    categories.forEach((e, index) => {
        categories[index] = `${e}.json`;
    });

    //change which category here
    // const category = categories[1];

    for (const category of categories) {
        console.log("Starting ", category);
        const category_object = await import(`./aggregated_links/${category}`, {
            assert: { type: "json" },
        });

        const urls = category_object.default.links;

        const export_object = {};

        let recurseCount = 0;

        const wikijs_sucks = async (arr) => {
            let arrToRun = [];
            if (arr.length >= 100) {
                arrToRun = arr.slice(0, 100);

                const arrToPassOn = arr.slice(100);

                await wikijs_sucks(arrToPassOn);
                console.log("Recurse Count: ", recurseCount++);
            } else {
                arrToRun = arr;
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));
            // console.log(arrToRun);

            const resultPromises = arrToRun.map((elem) =>
                getAnchors(elem).catch((error) => {
                    console.error(elem, error);
                    return {
                        title: "error",
                        anchors: ["you shouldn't", "be seeing", "this"],
                    };
                })
            );

            // const results = await Promise.all(resultPromises);
            const results = await throttlePromises(resultPromises);

            for (const article_object of results) {
                export_object[article_object.title] = article_object;
            }
        };

        await wikijs_sucks(urls);

        const fileName = `./prescraped_articles/${category}`;

        // await fs.writeFile(
        //     fileName,
        //     JSON.stringify(export_object),
        //     "utf-8",
        //     function (err) {
        //         if (err) {
        //             console.log(`error occured with: ${fileName}`);
        //         }
        //     }
        // );
    }
};

await main();
