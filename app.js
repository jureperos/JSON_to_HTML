import * as fs from "fs"

const data = JSON.parse(fs.readFileSync("./primeri/helloWorld.json"))

let allThings = []
let howDeep = 0
let metaStringy = ""
let theKey = []

function traverse(obj) {

    if (obj.doctype === "html") {
        delete obj.doctype
    }

    if (obj.hasOwnProperty("language")) {
        delete obj.language
    }

    if (obj.hasOwnProperty("meta")) {

        for (const key in obj.meta) {
            if (key === "charset") {
                metaStringy += `<meta charset=${obj.meta.charset}>\n`
            } else {
                metaStringy += `<meta name=${key} content=${obj.meta[key]}>\n`
            }
        }
        delete obj.meta
    }
    for (const key in obj) {
        const value = obj[key]

        //console.log(howDeep, [key])
        allThings.push([howDeep, key])
        theKey.push(["keyed", key])

        if (typeof value === "object") {
            howDeep++
            traverse(value)
        } else if (Array.isArray(value)) {
            for (const element of value) {
                howDeep++
                traverse(element)
            }
        } else {

            allThings.push([howDeep, value])
        }
        const nestedItem = theKey.pop()
        allThings.push(nestedItem)

    }
    howDeep--
}

traverse(data)

console.log(allThings, "\n------------------")
console.log(theKey)
