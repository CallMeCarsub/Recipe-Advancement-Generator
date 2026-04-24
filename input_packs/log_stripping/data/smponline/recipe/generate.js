const fs = require("fs");
var logs = `oak
spruce
birch
jungle
acacia
dark_oak
mangrove
cherry
pale_oak`.split("\n");

var additional = [
    "bamboo_block",
    "crimson_stem", "crimson_hyphae",
    "warped_stem", "warped_hyphae"
];

var blocksToStrip = [];
for(var i = 0; i < logs.length; i++){
    blocksToStrip.push(logs[i] + "_log");
    blocksToStrip.push(logs[i] + "_wood");
}
for(var i = 0; i < additional.length; i++){
    blocksToStrip.push(additional[i]);
}

try{
fs.rmSync("./log_stripping", {recursive: true, force: true})
}catch(e){}
fs.mkdirSync("./log_stripping")

for(var i = 0; i < blocksToStrip.length; i++){
    var toStrip = blocksToStrip[i].split(":");
    var namespace;
    var blockId;
    if(toStrip.length == 1){
        namespace = "minecraft";
        blockId = toStrip[0];
    }else{
        namespace = toStrip[0];
        blockId = toStrip[1];
    }
    var toStripId = namespace + ":" + blockId;
    var strippedId = namespace + ":stripped_" + blockId;
    
    var copperRecipe = {
        "type": "minecraft:crafting_shapeless",
        "group": "smponline:copper_stripping",
        "category": "building",
        "ingredients": [
            toStripId,
            toStripId,
            toStripId,
            toStripId,
            toStripId,
            toStripId,
            "copper_nugget"
        ],
        "result": {
            "id": strippedId,
            "count": 6
        }
    };
    var ironRecipe = {
        "type": "minecraft:crafting_shapeless",
        "group": "smponline:iron_stripping",
        "category": "building",
        "ingredients": [
            toStripId,
            toStripId,
            toStripId,
            toStripId,
            toStripId,
            toStripId,
            toStripId,
            toStripId,
            "iron_nugget"
        ],
        "result": {
            "id": strippedId,
            "count": 8
        }
    }
    
    fs.writeFileSync(
        "./log_stripping/copper_strip_" + namespace + "_" + blockId + ".json", 
        JSON.stringify(copperRecipe, null, "    "),
        {encoding: "utf8"}
    )
    fs.writeFileSync(
        "./log_stripping/iron_strip_" + namespace + "_" + blockId + ".json", 
        JSON.stringify(ironRecipe, null, "    "),
        {encoding: "utf8"}
    )
}



