const { fetchHTML, parser } = require("@philippdormann/mensamax-api");
const build = require("./openmensa_feed_builder.js");
const { readFile, writeFile, mkdir } = require("fs/promises");
const { readFileSync, existsSync } = require("fs");
const { join } = require("path");
const JSON5 = JSON; //require("json5");
require("dotenv");
require("./gh_workflow_annotations.js");

const package_json = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), { encoding: "utf-8" }));
const MAX_WEEKS_FORWARD = 4;
const thisWeekOnly = !process.argv.includes("preview");
const weeksForward = thisWeekOnly ? 1 : MAX_WEEKS_FORWARD;

/**
 *
 * @param {string} p
 * @param {string} e
 * @param {string} provider
 * @param {string|undefined} name
 * @param {string|undefined} loc
 */
async function processCanteen(p, e, provider, name = undefined, loc = undefined) {
    const parsed = {};
    let html = {};
    let open_days = [];
    let i = 0;
    let next = true;
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
        open_days = parse_result.days.map((d) => d.substring(0, 2).toLowerCase()); //.sort((a,b)=>WEEKDAYS.indexOf(b)-WEEKDAYS.indexOf(a))
        next = parse_result.hasNext;
        //console.debug(parse_result);
        if (parse_result.json && Object.getOwnPropertyNames(parse_result.json).length > 0) Object.assign(parsed, parse_result.json);
        if (!parse_result.hasNext) console.log("No next after KW", html.kw, "for", p, e);
    } while (next && i <= weeksForward);
    /** @type {build.Day[]} */
    const result = [];
    const todayResult = [];
    for (let [date, days] of Object.entries(parsed)) {
        date = date.substring(Math.max(date.indexOf(",") + 1, 0));
        date = date.trim();
        const [d, m, y] = date.split(".", 3);
        const parsed_date = new Date(+y, +m - 1, +d, 0, 0, 0, 0);
        /**@type {build.Day}*/
        const day = {};
        day.date = parsed_date;
        /**@type {build.Category[]}*/
        const categories = [];
        for (const [category_name, meals] of Object.entries(days)) {
            /**@type {build.Category}*/
            const cat = {
                name: category_name,
            };
            const meal_names = [];
            const allergies = [];
            for (const meal of meals) {
                meal_names.push(meal.title);
                if (meal.additives_allergies && meal.additives_allergies.length > 0) allergies.push(...meal.additives_allergies);
                //console.debug(category_name, Object.getOwnPropertyNames(meal));
            }
            if (meal_names.length < 1) continue;
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
        if (isDateInThisWeek(parsed_date)) todayResult.push(day);
        else result.push(day);
    }
    /** @type {string|null} */
    let firstMealName = null;
    if (
        !result
            .map((r) => r.categories.map((c) => c.meals.map((m) => m.name)))
            .flat(2)
            .some((n) => {
                if (n && !firstMealName) firstMealName = n;
                return n && n != firstMealName;
            }) &&
        !todayResult
            .map((r) => r.categories.map((c) => c.meals.map((m) => m.name)))
            .flat(2)
            .some((n) => {
                if (n && !firstMealName) firstMealName = n;
                return n && n != firstMealName;
            }) &&
        firstMealName
    ) {
        console.warn("The plan of canteen", `${name ? name + " (" : ""}${p} ${e}${name ? ")" : ""}`, "contains the same text every day:", firstMealName);
    }
    if (todayResult.length == 0 && result.length == 0) {
        console.info("Canteen", `${name ? name + " (" : ""}${p} ${e}${name ? ")" : ""}`, "has no data.");
    }
    //console.log(Object.getOwnPropertyNames(parsed.json), parsed.hinweis);
    const xml_doc_today = build(todayResult, null, package_json.version);
    let xml_doc_preview;
    if (!thisWeekOnly) {
        xml_doc_preview = build(result, null, package_json.version);
    }
    /**@type {build.CanteenMeta} */
    let meta = {
        name,
        city: loc,
        additionalFeeds: [
            {
                name: "thisWeek",
                source: `https://${provider}/LOGINPLAN.ASPX?p=${encodeURIComponent(p)}&e=${encodeURIComponent(e)}`,
                url: encodeURI(`${process.env.BASE_URL}/feeds/${p} ${e}.today.xml`),
                schedule: {
                    hour: "7",
                },
            },
            {
                name: e,
                source: `https://${provider}/LOGINPLAN.ASPX?p=${encodeURIComponent(p)}&e=${encodeURIComponent(e)}`,
                url: encodeURI(`${process.env.BASE_URL}/feeds/${p} ${e}.xml`),
                schedule: {
                    hour: "7",
                    dayOfWeek: "1",
                },
            },
        ],
    };
    if (open_days.length < 7 && open_days.length > 0) {
        meta.openingTimes = {
            monday: !open_days.includes("mo") ? false : undefined,
            tuesday: !open_days.includes("di") ? false : undefined,
            wednesday: !open_days.includes("mi") ? false : undefined,
            thursday: !open_days.includes("do") ? false : undefined,
            friday: !open_days.includes("fr") ? false : undefined,
            saturday: !open_days.includes("sa") ? false : undefined,
            sunday: !open_days.includes("so") ? false : undefined,
        };
    }
    const meta_feed = build(null, meta, package_json.version);
    if (!existsSync(join(__dirname, "..", "pages", "feeds"))) await mkdir(join(__dirname, "..", "pages", "feeds"), { recursive: true });
    let tasks = [
        writeFile(join(__dirname, "..", "pages", "feeds", p + " " + e + ".today.xml"), xml_doc_today, { encoding: "utf-8" }),
        writeFile(join(__dirname, "..", "pages", "feeds", p + " " + e + ".meta.xml"), meta_feed, { encoding: "utf-8" }),
    ];
    if (!thisWeekOnly) {
        tasks.push(writeFile(join(__dirname, "..", "pages", "feeds", p + " " + e + ".xml"), xml_doc_preview, { encoding: "utf-8" }));
    }
    await Promise.all(tasks);
}

/**
 * Utility function that checks if a date is within the current week.
 * @param {Date} date The date to check
 * @returns true if the supplied date is in the current week, otherwise false.
 */
function isDateInThisWeek(date) {
    const todayObj = new Date();
    const todayDate = todayObj.getDate();
    const todayDay = todayObj.getDay();

    // get first date of week (remove the +1 if you want this to be sunday instead of monday)
    const firstDayOfWeek = new Date(todayObj.setDate(todayDate - todayDay + 1));
    firstDayOfWeek.setHours(0, 0, 0, 0);

    // get last date of week
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 7);

    // if date is equal or within the first and last dates of the week
    return date >= firstDayOfWeek && date < lastDayOfWeek;
}

(async () => {
    /**@type {any[]} */
    let canteens = await readFile(join(__dirname, "..", "pages", "_data", "canteens.json"), { encoding: "utf-8" });
    canteens = JSON5.parse(canteens);
    let canteen_groups = canteens.reduce((prev, current, i, a) => {
        if (!prev[current.provider]) prev[current.provider] = [];
        prev[current.provider].push(current);
        return prev;
    }, {});
    const promises = [];
    const feed_index = {};

    for (const group of Object.values(canteen_groups)) {
        promises.push(
            (async () => {
                for (const canteen of group) {
                    console.log("processing canteen", `${canteen.name ? canteen.name + " (" : ""}${canteen.p} ${canteen.e}${canteen.name ? ")" : ""}`);
                    try {
                        await processCanteen(canteen.p, canteen.e, canteen.provider, canteen.name, canteen.loc);
                        feed_index[`${canteen.p}_${canteen.e}`] = encodeURI(`${process.env.BASE_URL}/feeds/${canteen.p} ${canteen.e}.meta.xml`);
                    } catch (e) {
                        if (e instanceof AggregateError && e.errors[0]?.line) {
                            // XML validation errors
                            for (const error of e.errors)
                                console.log(`::error file=pages/feeds/${canteen.p}_${canteen.e}.xml,line=${error.line + 1},col=${error.column + 1},title=Malformed XML Feed::${error.message.trim()}`);
                        } else {
                            console.error("Error processing canteen", `${canteen.name ? canteen.name + " (" : ""}${canteen.p} ${canteen.e}${canteen.name ? ")" : ""}`, e);
                        }
                    }
                    console.log("done processing canteen", `${canteen.name ? canteen.name + " (" : ""}${canteen.p} ${canteen.e}${canteen.name ? ")" : ""}`);
                }
            })()
        );
    }
    await Promise.all(promises);
    await writeFile(join(__dirname, "..", "pages", "feeds", "index.json"), JSON.stringify(feed_index, undefined, 2));
})();
