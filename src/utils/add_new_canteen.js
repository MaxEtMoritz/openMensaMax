const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");
const MIN_ARGUMENTS = 3;
const MAX_ARGUMENTS = 4;

if (process.argv.length < MIN_ARGUMENTS + 2 || process.argv.length > MAX_ARGUMENTS + 2) {
    console.error(`::error:: Invalid argument length. expected ${MIN_ARGUMENTS} to ${MAX_ARGUMENTS}, got ${process.argv.length - 2}.`);
    process.exit(-1);
}

const new_canteen = {
    provider: process.argv[2],
    p: process.argv[3],
    e: process.argv[4],
};
if (process.argv.length >= 5) {
    new_canteen.name = process.argv[5];
}

// read json file
/**@type {Array} */
let canteens_json = JSON.parse(readFileSync(join(__dirname, '..', 'pages', '_data', 'canteens.json'), {encoding: 'utf-8'}))

let existing_canteen = canteens_json.find(c=>c.provider.toUpperCase() == new_canteen.provider.toUpperCase() && c.p.toUpperCase() == new_canteen.p.toUpperCase() && c.e.toUpperCase() == new_canteen.e.toUpperCase() )
if(existing_canteen){
    if(new_canteen.name && existing_canteen.name != new_canteen.name){
        existing_canteen.name = new_canteen.name
        console.warn('::warning::Canteen was already included. Only the canteen name has been updated.')
        console.info('updated canteen', existing_canteen)
        writeFileSync(join(__dirname, '..', 'pages', '_data', 'canteens.json'), JSON.stringify(canteens_json, undefined, 4), {encoding: 'utf-8'})
    } else{
        console.error('::error::The canteen to add is already present!')
        process.exit(-2)
    }
} else {
    canteens_json.push(new_canteen)
    console.info('added canteen', new_canteen)
    writeFileSync(join(__dirname, '..', 'pages', '_data', 'canteens.json'), JSON.stringify(canteens_json, undefined, 4), {encoding: 'utf-8'})
}