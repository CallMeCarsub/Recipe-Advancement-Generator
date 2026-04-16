const fs = require("fs");
const AdmZip = require("adm-zip");

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

const workFiles = fs.readdirSync("./work", {withFileTypes: true})
for(var i = 0; i < workFiles.length; i++){
    const file = workFiles[i];
    if(!file.isDirectory()) continue;
    
}
