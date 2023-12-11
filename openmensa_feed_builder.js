const { Builder } = require("xml2js");

/**
 * Build an XML string compatible with OpenMensa [Feed v2](https://docs.openmensa.org/feed/v2) Schema.
 * @param {CanteenMeta} [meta = undefined] Canteen Metadata
 * @param {Day[]} [days = undefined] Food information
 * @param {string} [parser_version = undefined] The top version tag is *optional*. It can be inserted to define the **version of the parser**. It has nothing to do with the canteen or its menu.
 *
 * Alternative the parser version can be return as `X-OpenMensa-ParserVersion` HTTP-Header. If both are provided, the value from the XML has precedence.
 *
 * The version itself is a normal string that must not exceed 63 characters. OpenMensa does only check whether two versions are the same. There is relation derived from the versions. You are free to choose your matching version format.
 */
function build(days = null, meta = null, parser_version = null) {
    let feed = {
        openmensa: {
            $: {
                version: "2.1",
                xmlns: "http://openmensa.org/open-mensa-v2",
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                "xsi:schemaLocation": "http://openmensa.org/open-mensa-v2 http://openmensa.org/open-mensa-v2.xsd",
            },
            version: undefined,
            canteen: {},
        },
    };
    if (meta) {
        feed.openmensa.canteen = Object.assign(feed.openmensa.canteen, parse_meta(meta));
    }
    if (days && days.length > 0) {
        feed.openmensa.canteen.day = parse_days(days);
    }
    if (parser_version) {
        feed.openmensa.version = parser_version;
    }
    const xml = new Builder();
    const xml_string = xml.buildObject(feed);
    //console.debug(xml_string);
    return xml_string;
}

/**
 * Parse meal days into XML structure.
 * @param {Day[]} data  data to parse
 * @returns {object[]} XML day tags + content
 */
function parse_days(data) {
    const result = [];
    for (const day of data) {
        const xml = {
            $: {
                date: day.date instanceof Date ? `${day.date.getFullYear()}-${day.date.getMonth() + 1}-${day.date.getDate()}` : day.date,
            },
        };
        if (day.closed) {
            xml.closed = "";
        } else {
            if (!day.categories || day.categories.length <= 0 || day.categories.every((c) => !c.meals || c.meals.length <= 0)) {
                continue;
            }
            xml.category = [];
            for (const cat of day.categories) {
                const xmlCategory = {
                    $: {
                        name: cat.name,
                    },
                    meal: [],
                };
                for (const meal of cat.meals) {
                    const xmlMeal = {
                        name: meal.name,
                    };
                    if (meal.notes && meal.notes.length > 0) {
                        xmlMeal.note = meal.notes;
                    }
                    if (meal.prices && meal.prices.length > 0) {
                        xmlMeal.price = [];
                        for (const price of meal.prices) {
                            const xmlPrice = {
                                $: {
                                    role: price.role,
                                },
                                _: price.amount,
                            };
                            xmlMeal.price.push(xmlPrice);
                        }
                    }
                    xmlCategory.meal.push(xmlMeal);
                }
                xml.category.push(xmlCategory);
            }
        }
        result.push(xml);
    }
    return result;
}

/**
 * Parse canteen Metadata into XML data structure.
 * @param {CanteenMeta} data the date to parse
 * @returns {object} XML object to merge into canteen XML object.
 */
function parse_meta(data) {
    const xml = {};
    if (data.name) {
        xml.name = data.name;
    }
    if (data.address) {
        xml.address = data.address;
    }
    if (data.city) {
        xml.city = data.city;
    }
    if (data.phone) {
        xml.phone = data.phone;
    }
    if (data.email) {
        xml.email = data.email;
    }
    if (data.location) {
        xml.location = {
            $: {
                latitude: data.location.latitude,
                longitude: data.location.longitude,
            },
        };
    }
    if (data.availability) {
        xml.availability = data.availability;
    }
    if (data.openingTimes) {
        const xmlTimes = {
            $: {
                type: "opening",
            },
        };
        for (const weekday of ["monday", "tuesady", "wednesday", "thursday", "friday", "saturday", "sunday"]) {
            if (typeof data.openingTimes[weekday] === "boolean" || data.openingTimes[weekday]) {
                if (typeof data.openingTimes[weekday] === "boolean") {
                    if (data.openingTimes[weekday]) {
                        xmlTimes[weekday] = {
                            $: {
                                open: "00:00-23:59",
                            },
                        };
                    } else {
                        xmlTimes[weekday] = {
                            $: {
                                closed: "true",
                            },
                        };
                    }
                } else {
                    xmlTimes[weekday] = {
                        $: {
                            open: data.openingTimes[weekday],
                        },
                    };
                }
            }
        }
        xml.times = xmlTimes;
    }
    if (data.additionalFeeds && data.additionalFeeds.length > 0) {
        xml.feed = [];
        for (const feed of data.additionalFeeds) {
            const xmlFeed = {
                $: {
                    name: feed.name,
                },
                url: feed.url,
            };
            if (feed.priority) {
                xmlFeed.$.priority = feed.priority;
            }
            if (feed.source) {
                xmlFeed.source = feed.source;
            }
            if (feed.schedule) {
                const feedSchedule = {
                    $: {
                        hour: feed.schedule.hour,
                    },
                };
                if (feed.schedule.dayOfMonth) {
                    feedSchedule.$.dayOfMonth = feed.schedule.dayOfMonth;
                }
                if (feed.schedule.dayOfWeek) {
                    feedSchedule.$.dayOfWeek = feed.schedule.dayOfWeek;
                }
                if (feed.schedule.month) {
                    feedSchedule.$.month = feed.schedule.month;
                }
                if (feed.schedule.minute) {
                    feedSchedule.$.minute = feed.schedule.minute;
                }
                if (feed.schedule.retry) {
                    feedSchedule.$.retry = feed.schedule.retry;
                }
                xmlFeed.schedule = feedSchedule;
            }
            xml.feed.push(xmlFeed);
        }
    }
}

/**
 * @typedef CanteenMeta
 * @property {string} [name = undefined] the canteen name
 * @property {string} [address = undefined] the (postal) address. We do not require any special format. But the form `street nr, zip city` is common. If no geo coordinate for the canteen is provided the address is mapped to a point.
 * @property {string} [city = undefined] the user relevant city of this canteen. This does not need to be the postal city. The value is e.g. used to search canteens or group them.
 * @property {string} [email = undefined] an email address to contact the canteen. We do not ensure a specific format: the main purpose is that is understandable for humans, but we highly recommend following the [E.123](http://en.wikipedia.org/wiki/E.123) standard.
 * @property {string} [phone = undefined] the phone number to contact the canteen. We do not ensure a specific format: the main purpose is that is understandable for humans, but we highly recommend following the [E.123](http://en.wikipedia.org/wiki/E.123) standard.
 * @property {Location} [location = undefined] the geo coordinates. Each attribute needs to be a float value.
 * @property {'public'|'restricted'} [availability = undefined] indicate whether the canteen can be used by everyone (**public**) or not (**restricted**)
 * @property {Times} [openingTimes = undefined] We may later support other time ranges like meal serving times.
 * @property {Feed[]} [additionalFeeds = undefined] It is possible to define multiple feeds, because there may be menus that change often (e.g. the menu for the current day) and other that not. In additional if it parsing of one aspect fails, the other data should be served normally.
 */

/**
 * @typedef Location
 * @property {number} latitude
 * @property {number} longitude
 */

/**
 * Times for a canteen.
 *
 * Specify a time range in format `HH:mm-HH:mm` to indicate the canteen is open in that time range,
 * Set to `true`/`false` to indicate the canteen is open/closed on that day (`true` being a shortcut for `00:00-23:59`),
 * or leave unset to indicate the time information could not be determined for that day.
 * @typedef Times
 * @property {string | boolean} [monday = undefined]
 * @property {string | boolean} [tuesday = undefined]
 * @property {string | boolean} [wednesday = undefined]
 * @property {string | boolean} [thursday = undefined]
 * @property {string | boolean} [friday = undefined]
 * @property {string | boolean} [saturday = undefined]
 * @property {string | boolean} [sunday = undefined]
 */

/**
 * A feed is basically only a URL. It is expected that OpenMensa gets a valid feed when requesting this URL.
 * @typedef Feed
 * @property {string} name It is required that each feed element contains one unique name attribute. This name is only used by OpenMensa to match the given feed to previously saved feed data. But we recommend to choose descriptive names.
 * @property {string} [priority='0'] The optional priority attribute defines override rules between different feeds for a canteen. All feeds have per default the priority 0. A feed can update/remove a meal if the priority is same or greater than the priority of the feed that created the menu. A example usage: use priority 0 for the full feed, but use 10 for the today feed - today data have priority and can not be overridden by the normal feed.
 * @property {string} url The url element defines which page OpenMensa should request.
 * @property {Schedule} [schedule=undefined] The feed has a schedule element, that specify when this URL should be fetched. If the schedule element is omitted, the feed can only be used for manual fetching. OpenMensa has no implicit scheduling for feeds.
 * @property {string} [source=undefined] You can provide a single URL, from that the data are (mostly) received. So in case of an error or a question, the user can be redirected to this page.
 */

/**
 * The attributes `dayOfMonth`, `dayOfWeek`, `month`, `hour` and `minute` each describe a pattern for the given unit. The feed is accessed if the current time matches **ALL** these patterns. It may take some minutes until the feed is fetched depending on the work load.
 *
 * The schedule behaviour and format is equal to `crontab`.
 *
 * Each pattern may be a comma-separated list of individual numbers or ranges like `1,3-5`. Ranges are inclusive.
 *
 * The special range `*` means all possible values. A range can be followed by a `/<number>` to specify to only match the `number`th value within the range. `0-23/2` matches `0,2,4,6,8,10,12,14,16,18,20,22`.
 *
 * Only the `hour` attribute is required, `dayOfMonth`, `dayOfWeek` and `month` default to `*`, `minute` to `0`.
 *
 * `dayOfMonth` starts with `1`, `dayOfWeek` with `0` meaning Sunday (`1` Monday …).
 *
 * The optional `retry` attribute defines how to handle errors. Without this attribute OpenMensa does not retry to fetch the feed on errors.
 *
 * The value must be a white-space separated list of positive numbers.
 *
 * The odd-positioned ones define an interval in minutes, the even-positioned the maximum number of retries for this interval. If the last retry limit is omitted, OpenMensa retries until the next regular time.
 *
 * An example: `30 3` means retry maximal 3 time every half hour. `45 5 1440` means first repeat maximum 5 times every 45 minutes. If the feed keeps failing retry only once a day.
 * @typedef Schedule
 * @property {string} [dayOfMonth = '*'] dayOfMonth starts with 1
 * @property {string} [dayOfWeek = '*'] dayOfWeek starts with 0 meaning Sunday (1 Monday &hellip;)
 * @property {string} [month = '*']
 * @property {string} hour
 * @property {string} [minute = '0']
 * @property {string} [retry = undefined]
 */

/**
 * Main part for the canteen are the day elements. They need to have a `date` attribute formatting the date of this day in the `YYYY-MM-DD` format.
 *
 * There must be only one day element per date. It is not required to provide tags for every day of a range. But be aware that OpenMensa does not process tags with past dates.
 * @typedef Day
 * @property {string | Date} date They need to have a `date` attribute formatting the date of this day in the `YYYY-MM-DD` format.
 * @property {boolean} [closed = undefined] It is possible to explicitly express that the canteen is (completely) closed on a given day.
 * @property {Category[]} [categories = undefined] For each day the meals needs to be grouped by category. A category is only allowed if no closed tag was provided - but then it is required to have at least one category.
 */

/**
 * For each day the meals need to be grouped by category. Common grouping is based on some product line or desk.
 * @typedef Category
 * @property {string} name Each category tag needs to have a name attribute. The name is (only) displayed to the user and should be descriptive. But the categories only group the individual meals.
 *
 * A name can only be used once a day, but it is normal to use the same or at least similar category names for each day.
 * @property {Meal[]} meals Each category needs to have at least one meal.
 */

/**
 * The meal element describes a meal or an individual purchasable entity that is available that given day. A individual purchasable entry may be a side order.
 * @typedef Meal
 * @property {string} name The important and the only required subelement is the name part. It should be a complete description of the meal. The name must not exceed 250 characters. The name of a meal, e.g. “Rinderhacksteak mit Kartoffeln”, shouldn’t be more than a couple of words or a sentence in maximum.
 * @property {string[]} [notes = undefined] Additional text may go into several notes: A note often resembles a property of the associated meal like the ingredients used or some important annotations.
 *
 * There are (currently) no restrictions on how the notes should look like or what are common notes. If you have a good proposal talk to us.
 * @property {Price[]} [prices = undefined] For the meal the price can be expressed via (optional) price elements. Please omit prices for roles that are not applicable or the same as others.
 */

/**
 * @typedef Price
 * @property {'pupils'|'students'|'employees'|'others'} role Because different prices may apply to different groups of people and we want to show, for which group we introduced several roles:
 *
 *  -  `pupils`
 *  -  `students`
 *  -  `employees` (of your organization)
 *  -  `others` (people that do not belong to your organization or to any other group not listed here).
 * @property {number} amount
 */

module.exports = build;
