import * as fs from "fs"

const data = JSON.parse(fs.readFileSync("./primeri/helloWorld.json"))

class HtmlParser {
    constructor(jsonData) {
        this.data = jsonData
        this.howDeep = 0
        this.keyTags = [[]]
        this.keyTagsCopy = [[]]
    }

    traverse(obj) {
        for (const key in obj) {
            const value = obj[key]

            this.keyTags.push([this.howDeep, `<${key}>`])
            this.keyTagsCopy.push([this.howDeep, `</${key}>`])


            if (typeof value === "object") {
                //now rekurzivni klic pomeni da gremo stopnjo globlje
                if (key === "meta") {this.handleMeta(key, value)}
                this.howDeep--
                this.traverse(value)

            } else {
                this.handleValue(key, value)
                this.deleteLeaf(key, obj)
            }
        }
        // Konec enega rekurzivnega klica pomeni, da se globina zmanjša
        this.howDeep++
    }

    handleValue(key, value) {

        const poppedKeyTag = this.keyTags.pop()
        const poppedKeyTagCopy = this.keyTagsCopy.pop()

        this.keyTags.push([this.howDeep, `${poppedKeyTag[1]}${value}${poppedKeyTagCopy[1]}`])
        this.keyTagsCopy.push("filler")
    }

    deleteLeaf(key, obj) {
        delete obj[key]
    }

    handleMeta(key, value) {
        this.howDeep--

        const lastTag = this.keyTags[this.keyTags.length -1][1]
        if (lastTag === "<meta>") {
            this.keyTags.pop()
        }

        for (const metaKey in value) {
            const metaValue = value[metaKey]
            console.log("metakey: ", metaKey, "metaValue: ", metaValue, "value: ", value)

            if (metaKey === "charset") {
                this.keyTags.push([this.howDeep, `<meta charset="${metaValue}>"`])
                this.deleteLeaf(metaKey, value)
            } else if (typeof metaValue === "object") {

                this.keyTags.push([this.howDeep, metaKey])
                this.howDeep++
                this.handleMeta("kmet", metaValue)


            } else {
                console.log(this.keyTags)
                //console.log(metaKey, value)

                console.log(metaKey, value)
                this.handleMetaValue(metaKey, value)
                this.deleteLeaf(metaKey, value)
            }

        }
        this.howDeep++
    }

    handleMetaValue(key, value) {
        this.keyTags.push(this.howDeep, `<meta name="${key}" content="${value[key]}"`)

    }

    handleArray(key, value) {

        value.forEach((element) => {
            let lineString = `<${key}`
            for (const elementKey in element) {
                lineString += ` ${elementKey}="${element[elementKey]}"`

            }
            lineString += ">"
            this.keyTags.push([this.howDeep, lineString])
        })

    }

    parse() {
        this.traverse(this.data)
    }
}

const parser = new HtmlParser(data)
parser.parse()
console.log(parser.keyTags)


/*
//globinomer
let howDeep = 1

// keyTags je glavni arr; keyTagsCopy shranjuje enake vrednosti katere nato
// uporabim za closing tage
let keyTags = []
let keyTagsCopy = []

function traverse(obj) {

    for (const key in obj) {
        const value = obj[key]


        if (obj.doctype === "html" && obj.hasOwnProperty("language")) {
            keyTags.pop()
            const doctype = "<!DOCTYPE> html"
            const htmlString = `<${obj.doctype} lang="${obj.language}">`

            keyTags.unshift([howDeep - 1, doctype])
            keyTags.push([howDeep - 1, htmlString])

            delete obj.doctype
            delete obj.language
            continue
        }

        if (obj.doctype === "html") {

            const doctype = "<!DOCTYPE> html"
            keyTags.unshift([howDeep - 1, doctype])
            keyTags.push([howDeep - 1, "<html>"])
            delete obj.doctype
            continue

        }

        keyTags.push([howDeep, `<${key}>`])
        keyTagsCopy.push([howDeep, `</${key}>`])

        if (value.hasOwnProperty("attributes")) {
            keyTags.pop()
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

            keyTags.push([howDeep, `<${key} ${attributeString}>`])
        }

        if (typeof value === "object") {

            if (value.hasOwnProperty("meta")) {
                howDeep++
                let attributeString = ``
                for (const metaKey in value.meta) {
                        console.log(metaKey)
                    if (metaKey=== "charset") {
                        keyTags.push([howDeep, `<meta charset="${value.meta.charset}>"`])

                    } else {
                        for (const nestedMetaKey in value.meta[metaKey]) {
                            //console.log(nestedMetaKey)
                            attributeString += `<meta name="${nestedMetaKey}" content="${value.meta[metaKey]}">`
                            keyTags.push([howDeep, attributeString])

                        }
                    }
                }
                howDeep--
            }



            if (Array.isArray(value)) {

                keyTags.pop()
                keyTagsCopy.pop()

                value.forEach((element) => {
                    let lineString = `<${key}`
                    for (const elementKey in element) {
                        lineString += ` ${elementKey}="${element[elementKey]}"`

                    }
                    lineString += ">"
                    keyTags.push([howDeep, lineString])
                })
                continue
            }

            howDeep++
            traverse(value)
        } else {
            const poppedKeyTag = keyTags.pop()
            const poppedKeyTagCopy = keyTagsCopy.pop()
            keyTags.push([howDeep, `${poppedKeyTag[1]}${value}${poppedKeyTagCopy[1]}`])
            keyTagsCopy.push("filler")
        }

        const nestedItem = keyTagsCopy.pop()
        keyTags.push(nestedItem)
    }
    howDeep--
}



traverse(data)

keyTags.push([0, "</html>"])

function arrayFilterCondition(element) {
    return element !== "filler"
}

const filteredArray = keyTags.filter(arrayFilterCondition)
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
*/
