const { fetchHTML, parser } = require("@philippdormann/mensamax-api");
const build = require("./openmensa_feed_builder.js");
const { readFileSync, writeFileSync, mkdirSync, existsSync } = require("fs");
const { join } = require("path");
const package_json = JSON.parse(readFileSync(join(__dirname, "package.json"), { encoding: "utf-8" }));
const MAX_WEEKS_FORWARD = 3;

async function processCanteen(p, e, provider) {
    const parsed = {};
    let html = {};
    let last_parse_had_data;
    let i = 0;
    do {
        i++;
        //console.debug(html.__EVENTVALIDATION && html.__VIEWSTATE && html.__VIEWSTATEGENERATOR);
        html = await fetchHTML({
            p,
            e,
            kw: html.kw ? +html.kw : undefined,
            provider,
            __EVENTVALIDATION: html.__EVENTVALIDATION,
            __VIEWSTATE: html.__VIEWSTATE,
            __VIEWSTATEGENERATOR: html.__VIEWSTATEGENERATOR,
            nextWeek: Object.getOwnPropertyNames(html).length > 0,
            auth: Boolean(html.__EVENTVALIDATION) && Boolean(html.__VIEWSTATE) && Boolean(html.__VIEWSTATEGENERATOR),
        });
        //console.debug(html)
        let parse_result = await parser(html.data);
        //console.debug(parse_result);
        if (parse_result.json && Object.getOwnPropertyNames(parse_result.json).length > 0) {
            Object.assign(parsed, parse_result.json);
            last_parse_had_data = true;
        } else {
            last_parse_had_data = false;
        }
    } while (last_parse_had_data && i <= MAX_WEEKS_FORWARD);
    /** @type {build.Day[]} */
    const result = [];
    for (let [date, days] of Object.entries(parsed)) {
        date = date.substring(Math.max(date.indexOf(",") + 1, 0));
        date = date.trim();
        const [d, m, y] = date.split(".", 3);
        const parsed_date = new Date(+y, +m - 1, +d);
        /**@type {build.Day}*/
        const day = {};
        day.date = parsed_date;
        /**@type {build.Category[]}*/
        const categories = [];
        for (const [category_name, meals] of Object.entries(days)) {
            /**@type {build.Category}*/
            const cat = {
                name: category_name,
                meals: [],
            };
            const meal_names = [];
            const allergies = [];
            for (const meal of meals) {
                /**@type {build.Meal}*/
                const m = {
                    name: meal.title,
                    notes: meal.additive_allergies,
                };
                meal_names.push(meal.title);
                if (meal.additives_allergies && meal.additives_allergies.length > 0) allergies.push(...meal.additives_allergies);
                //console.debug(category_name, Object.getOwnPropertyNames(meal));
            }
            cat.meals = [
                {
                    name: meal_names.join(", "),
                    notes: allergies.filter((v, i, a) => a.indexOf(v) === i),
                },
            ];
            categories.push(cat);
            //console.debug(category_name, Object.getOwnPropertyNames(meals));
        }
        day.categories = categories;
        //console.debug(parsed_date, Object.getOwnPropertyNames(meals));
        result.push(day);
    }
    //console.log(Object.getOwnPropertyNames(parsed.json), parsed.hinweis);
    const xml_doc = build(result, null, package_json.version);
    if (!existsSync(join(__dirname, "feeds", provider, p))) mkdirSync(join(__dirname, "feeds", provider, p), { recursive: true });
    writeFileSync(join(__dirname, "feeds", provider, p, e + ".xml"), xml_doc, { encoding: "utf-8" });
}

(async () => {
    /**@type {any[]} */
    let canteens = readFileSync(join(__dirname, "canteens.json"), { encoding: "utf-8" });
    canteens = JSON.parse(canteens);
    const promises = [];
    const feed_index = {};

    for (const canteen of canteens) {
        feed_index[`${canteen.provider}/${canteen.p}/${canteen.e}`] = `${process.env.BASE_URL}/${canteen.provider}/${canteen.p}/${canteen.e}.xml`;
        promises.push(
            (async () => {
                console.info("processing canteen", canteen.name ?? `${canteen.provider}/${canteen.p}/${canteen.e}`);
                try {
                    await processCanteen(canteen.p, canteen.e, canteen.provider);
                } catch (e) {
                    console.error("Error processing canteen", canteen.name ?? `${canteen.provider}/${canteen.p}/${canteen.e}`, e);
                }
                console.info("done processing canteen", canteen.name ?? `${canteen.provider}/${canteen.p}/${canteen.e}`);
            })()
        );
    }
    await Promise.all(promises);
    writeFileSync(join(__dirname, "feeds", "index.json"), JSON.stringify(feed_index, undefined, 2));
})();
