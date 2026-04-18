const fs = require("fs");
const AdmZip = require("adm-zip");

// clean output directory
try{
    fs.rmSync("./output_pack/*/", {recursive: true, force: true})
    fs.rmSync("./output_pack/pack.mcmeta", {recursive: true, force: true})
}catch(e){}

// refresh work dir
try{fs.rmSync("./work/", {recursive: true, force: true})}catch(e){}
fs.mkdirSync("./work")

const inputFiles = fs.readdirSync("./input_packs", {withFileTypes: true});
for(var i = 0; i < inputFiles.length; i++){
    const file = inputFiles[i]; 
    if(file.isDirectory()){
        // copy dir
        if(fs.existsSync("./input_packs/" + file.name + "/pack.mcmeta") && fs.existsSync("./input_packs/" + file.name + "/data/")){
            fs.cpSync("./input_packs/" + file.name, "./work/" + file.name, {recursive: true})
        }else{
            console.log("[!] Skipping \"" + file.name + "\" as it does not have a pack.mcmeta or data folder.")
        }
    }else if(file.name.toLowerCase().endsWith(".zip")){
        // extract to dir
        new AdmZip("./input_packs/" + file.name).extractAllTo("./work/" + file.name.toLowerCase().split(".zip")[0] + "/", true)
    }
}


function createCriteria(materialType){
    const typeSplit = materialType.split(":");
    const typeId = typeSplit[1];
    const namespace = typeSplit[0].replace("#","");
    return [
        "has_" + (materialType.startsWith("#")?"tag_":"") + namespace + "_" + typeId, 
        {
            "conditions": {
                "items": [
                    {
                        "items": materialType
                    }
                ]
            },
            "trigger": "minecraft:inventory_changed"
        }
    ]
}

function createAdvancement(recipeId, recipeData){
    var baseAdvancement = {
        "parent": "minecraft:recipes/root",
        "criteria": {
            "has_the_recipe": {
                "conditions": {
                    "recipe": recipeId
                },
                "trigger": "minecraft:recipe_unlocked"
            }
        },
        "requirements": [
            [
                "has_the_recipe"
            ]
        ],
        "rewards": {
            "recipes": [
                recipeId
            ]
        }
    };

    var materials = [];
    // get materials

    if(recipeData.hasOwnProperty("ingredient")){
        materials.push(recipeData.ingredient)
    }else if(recipeData.hasOwnProperty("ingredients")){
        for(var i = 0; i < recipeData.ingredients.length; i++){
            var ingredientInfo = recipeData.ingredients[i];
            if(typeof ingredientInfo === "string"){
                materials.push(ingredientInfo);
            }else if(ingredientInfo.hasOwnProperty("length")){
                for(var j = 0; j < ingredientInfo.length; j++){
                    materials.push(ingredientInfo[j]);
                }
            }else{
                throw "unsupported ingredient in " + recipeId + " / " + i;
            }
        }
    }else if(recipeData.hasOwnProperty("key")){
        for(var keyId in recipeData.key){
            var ingredientInfo = recipeData.key[keyId];
            if(typeof ingredientInfo === "string"){
                materials.push(ingredientInfo);
            }else if(ingredientInfo.hasOwnProperty("length")){
                for(var j = 0; j < ingredientInfo.length; j++){
                    materials.push(ingredientInfo[j]);
                }
            }else{
                throw "unsupported ingredient key thing in " + recipeId + " / " + keyId;
            }
        }
    }else{
        throw "unsupported recipe " + recipeId;
    }

    // run materials
    for(var i = 0; i < materials.length; i++){
        const materialType = materials[i];
        var criteriaInfo = createCriteria(materialType);
        baseAdvancement.requirements[0].push(criteriaInfo[0]);
        baseAdvancement.criteria[criteriaInfo[0]] = criteriaInfo[1];
    }

    return baseAdvancement;
}

var advancements = [];

const workFiles = fs.readdirSync("./work", {withFileTypes: true})
for(var i = 0; i < workFiles.length; i++){
    const file = workFiles[i];
    if(!file.isDirectory()) continue;
    const dataFiles = fs.readdirSync("./work/" + file.name + "/data/", {withFileTypes: true, recursive: true})
    for(var j = 0; j < dataFiles.length; j++){
        const dataFile = dataFiles[j];
        var fullPath = (dataFile.path.replace(/\\/g,"/") + "/" + dataFile.name).replace(/\/\//g, "/");
        if(!fullPath.startsWith("./")){
            fullPath = "./" + fullPath;
        }
        const pathParts = fullPath.split("/");
        if(pathParts.length < 7){
            continue;
        }
        const packName = pathParts[2];
        const namespace = pathParts[4];
        if(pathParts[5] !== "recipe" || dataFile.isDirectory() || !dataFile.name.endsWith(".json")){
            continue;
        }

        const resourceId = namespace + ":" + pathParts.slice(6).join("/").replace(".json","")
        console.log("recipe", resourceId, fullPath)

        const recipeData = JSON.parse(fs.readFileSync(fullPath, {encoding:"utf8"}));

        // generate advancement based on recipe details
        var advancement = createAdvancement(resourceId, recipeData);
        advancements.push([resourceId, advancement]);
    }
}

if(advancements.length == 0){
    console.log("No advancements generated, cancelling.")
    return;
}

fs.writeFileSync("./output_pack/pack.mcmeta", `{
  "pack": {
    "pack_format": 94,
    "description": "recipe advancements (made with Recipe-Advancement-Generator)"
  }
}`);
fs.mkdirSync("./output_pack/data/recipeadvgen/advancement/recipes/generated/", {recursive: true});
console.log("Writing " + advancements.length + " advancements");
for(var i = 0; i < advancements.length; i++){
    const advancementData = advancements[i];
    const recipeId = advancementData[0].split(":");
    const fullAdvancement = advancementData[1];

    const advancementName = ("generated_" + recipeId[0] + "_" + recipeId[1].replace(/\//g,"_")).replace(/\/\//g, "/");
    console.log("writing", advancementName)
    fs.writeFileSync(
        "./output_pack/data/recipeadvgen/advancement/recipes/generated/" + advancementName + ".json", 
        JSON.stringify(fullAdvancement, null, "    "),
        {encoding: "utf-8"}
    )
}
console.log("done");