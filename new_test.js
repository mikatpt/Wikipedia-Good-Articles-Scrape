import wikijs from "wikijs";
import urlencode from "urlencode";

const getAnchors = async () => {
    const wiki = wikijs.default;

    const url = "https://en.wikipedia.org/wiki/Fire_Emblem:_The_Binding_Blade";

    const article_name = url.slice(url.indexOf("/wiki/") + 6);

    const article = urlencode.decode(article_name, "utf8").replaceAll("_", " ");

    const test = await wiki().page(article);

    const externals = await test.extlinks();

    const res = await test.links();

    console.log(externals);
    console.log(res);

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

await getAnchors();
