const { getMensaPlanHTML, parser } = require("@philippdormann/mensamax-api");
const build = require("./openmensa_feed_builder.js");
const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");
const package_json = JSON.parse(readFileSync(join(__dirname, "package.json"), {encoding: 'utf-8'}));

(async () => {
    try {
        const html = await getMensaPlanHTML({
            p: "N111",
            e: "Mensa",
            provider: "mensaservice.de",
        });
        const parsed = await parser(html);
        /** @type {build.Day[]} */
        const result = [];
        for (let [date, days] of Object.entries(parsed.json)) {
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
                    meals: []
                };
                const meal_names = []
                const allergies = []
                for(const meal of meals){
                    /**@type {build.Meal}*/
                    const m = {
                        name: meal.title,
                        notes: meal.additive_allergies
                    }
                    meal_names.push(meal.title)
                    if(meal.additives_allergies && meal.additives_allergies.length > 0)
                    allergies.push(...(meal.additives_allergies))
                    //console.debug(category_name, Object.getOwnPropertyNames(meal));
                }
                cat.meals = [
                    {
                        name: meal_names.join(', '),
                        notes: allergies.filter((v,i,a)=>a.indexOf(v) === i)
                    }
                ]
                categories.push(cat);
                //console.debug(category_name, Object.getOwnPropertyNames(meals));
            }
            day.categories = categories
            //console.debug(parsed_date, Object.getOwnPropertyNames(meals));
            result.push(day);
        }
        //console.log(Object.getOwnPropertyNames(parsed.json), parsed.hinweis);
        const xml_doc = build(result, null, package_json.version);
        writeFileSync('test.xml', xml_doc, {encoding: 'utf-8'})
    } catch (e) {
        console.error(e);
    }
})();
