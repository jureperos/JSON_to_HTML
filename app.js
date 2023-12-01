import * as fs from "fs"

const data = JSON.parse(fs.readFileSync("./primeri/pageNotFound.json"))

//globinomer
let howDeep = 1

// allThings je glavni arr; theKey shranjuje enake vrednosti katere nato
// uporabim za closing tage
let allThings = []
let theKey = []

function traverse(obj) {


    for (const key in obj) {
        const value = obj[key]


        if (obj.doctype === "html" && obj.hasOwnProperty("language")) {
            allThings.pop()
            const doctype = "<!DOCTYPE> html"
            const htmlString = `<${obj.doctype} lang="${obj.language}">`

            allThings.unshift([howDeep - 1, doctype])
            allThings.push([howDeep - 1, htmlString])

            delete obj.doctype
            delete obj.language
            continue
        }

        if (obj.doctype === "html") {

            const doctype = "<!DOCTYPE> html"
            allThings.unshift([howDeep - 1, doctype])
            allThings.push([howDeep - 1, "<html>"])
            delete obj.doctype
            continue

        }

        allThings.push([howDeep, `<${key}>`])
        theKey.push([howDeep, `</${key}>`])

        if (value.hasOwnProperty("attributes")) {
            allThings.pop()
            let attributeString = ``

            for (const attributeKey in value.attributes) {
                if (attributeKey === "style")  {
                    for (const styleKey in value.attributes.style) {

                        attributeString += `${styleKey}="${value.attributes.style[styleKey]}" `
                    }

                    delete value.attributes
                }

                if (attributeKey != "style" && !value.attributes.hasOwnProperty("style")) {
                    attributeString = `${attributeKey}="${value.attributes[attributeKey]}" ${attributeString}`

                    delete value.attributes
                }

            }

            allThings.push([howDeep, `<${key} ${attributeString}>`])
        }

        if (typeof value === "object") {

            //if (value.hasOwnProperty("meta")) {
            //    howDeep++
            //    for (const key in value.meta) {
            //        if (key === "charset") {
            //            allThings.push([howDeep, `<meta charset="${value.meta.charset}>"`])

            //        }
            //        console.log(key)
            //        if (key === "keywords" || key === "author"){
            //            allThings.push([howDeep, `<meta name="${key}" content="${value.meta[key]}">`])
            //        }
            //    }
            //    delete value.meta
            //    howDeep--
            //}



            if (Array.isArray(value)) {

                allThings.pop()
                theKey.pop()

                value.forEach((element) => {
                    let lineString = `<${key}`
                    for (const elementKey in element) {
                        lineString += ` ${elementKey}="${element[elementKey]}"`

                    }
                    lineString += ">"
                    allThings.push([howDeep, lineString])
                })
                continue
            }

            howDeep++
            traverse(value)
        } else {
            const popedKey = allThings.pop()
            const poppedTheKey = theKey.pop()
            allThings.push([howDeep, `${popedKey[1]}${value}${poppedTheKey[1]}`])
            theKey.push("filler")
        }

        const nestedItem = theKey.pop()
        allThings.push(nestedItem)
    }
    howDeep--
}



traverse(data)

allThings.push([0, "</html>"])

function arrayFilterCondition(element) {
    return element !== "filler"
}

const filteredArray = allThings.filter(arrayFilterCondition)
console.log(filteredArray)

const finishedArray = filteredArray.map((element) => {
    let indent = ""
    const indentNum = parseInt(element[0])
    for (let i = 0; i < indentNum; i++) {
        indent += "    "
    }

    return indent + element[1]
})

console.log(finishedArray)

const arrayToString = finishedArray.join("\n")
fs.writeFileSync("./onej.html", arrayToString)

