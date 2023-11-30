import * as fs from "fs"

const data = JSON.parse(fs.readFileSync("./primeri/helloWorld.json"))

let metaStringy = ""

//globinomer
let howDeep = 0

// allThings je glavni arr; theKey shranjuje enake vrednosti katere nato
// uporabim za closing tage
let allThings = []
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

        if (Array.isArray(value)) {
            value.forEach((element) => {
                metaStringy += `\n<${key}`
                for (const elementKey in element) {
                    metaStringy += ` ${elementKey}="${element[elementKey]}"`

                }
                metaStringy += ">\n"
            })
        return
        }

       // console.log(howDeep, [key])

        allThings.push([howDeep, key])
        theKey.push(["keyed", key])


        if (typeof value === "object") {
            howDeep++
            traverse(value)
        } else {
            const popedKey = allThings.pop()

            if (popedKey[1] != "href" && popedKey[1] != "rel" && popedKey[1] != "type") {
                allThings.push([howDeep, `<${popedKey[1]}>${value}</${popedKey[1]}>`])

            } else allThings.push([howDeep, `${popedKey[1]}="${value}"`])

        }
        const nestedItem = theKey.pop()

        //console.log(nestedItem[1])
        //allThings.push(nestedItem)
        if (nestedItem[1] != "href" && nestedItem[1] != "rel" && nestedItem[1] != "type") {
            allThings.push(nestedItem)
        }


    }
    howDeep--
}

traverse(data)
console.log(metaStringy)
console.log(allThings, "\n------------------")
//console.log(theKey)

allThings.forEach((element) => {
    //console.log(element[1])
    //fs.writeFileSync()
})


