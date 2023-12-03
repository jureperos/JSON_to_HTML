import * as fs from "fs"

//const data = JSON.parse(fs.readFileSync("./primeri/helloWorld.json"))
//const data = JSON.parse(fs.readFileSync("./primeri/pageNotFound.json"))
const data = JSON.parse(fs.readFileSync("./primeri/pageNotFoundV2.json"))

class HtmlParser {
    constructor(jsonData) {
        this.data = jsonData
        this.htmlLang = jsonData?.language
        this.howDeep = 1
        this.keyTags = [[]]
        this.keyTagsCopy = [[]]
        this.metaValueCallCount = 0
        this.metaString = ""
    }
    get lastTag() {
        return this.keyTags[this.keyTags.length -1]
    }

    traverse(obj) {
        for (const key in obj) {
            const value = obj[key]

            this.keyTags.push([this.howDeep, `<${key}>`])
            this.keyTagsCopy.push([this.howDeep, `</${key}>`])



            if (typeof value === "object") {

                if (key === "meta") {
                    this.handleMeta(value)
                    continue
                }

                if (Array.isArray(value)) {
                    this.handleArray(key, value)
                    continue
                }
                if (key === "attributes") {
                    this.handleAttributes(value)
                    continue
                }
                this.howDeep++
                this.traverse(value)

            } else {
                this.handleValue(value)
            }
            const nestedItem = this.keyTagsCopy.pop()
            this.keyTags.push(nestedItem)
        }
        this.howDeep--
    }

    handleAttributes(value) {
        this.keyTags.pop()
        this.keyTagsCopy.pop()
        const prevTag = this.keyTags.pop()
        let styleString = ``
        let attributeString = ``
        const styleKeyString = "style="

        for (const attributeKey in value) {

            if (attributeKey === "style")  {
                for (const styleKey in value.style) {
                    //console.log("styleKey: ", styleKey, "value.style: ", value.style)
                    styleString += `${styleKey}:${value.style[styleKey]};`
                }
                continue
            }

            if (attributeKey != "style" && !value.hasOwnProperty("style")) {
                styleString = `${attributeKey}="${value[attributeKey]}" ${styleString}`
                continue
            }

            attributeString += `${attributeKey}="${value[attributeKey]}"`



        }
        this.keyTags.push([prevTag[0], `${prevTag[1].slice(0, -1)} ${attributeString} ${styleKeyString}"${styleString.slice(0, -1)}">`])
    }

    handleValue(value) {

        const poppedKeyTag = this.keyTags.pop()
        const poppedKeyTagCopy = this.keyTagsCopy.pop()

        this.keyTags.push([this.howDeep, `${poppedKeyTag[1]}${value}${poppedKeyTagCopy[1]}`])
        this.keyTagsCopy.push([])
    }

    handleMeta(value) {

        if (this.lastTag[1] === "<meta>") {
            this.keyTags.pop()
            this.keyTagsCopy.pop()
        }

        for (const metaKey in value) {
            const metaValue = value[metaKey]

            if (metaKey === "charset") {
                this.keyTags.push([this.howDeep, `<meta charset="${metaValue}>"`])

            } else if (typeof metaValue === "object") {
                this.metaValueCallCount++
                this.metaString = `<meta name="${metaKey}" content="`
                this.handleMeta(metaValue)

            } else {
                this.handleMetaValue(metaKey, metaValue)
            }
        }

    }

    handleMetaValue(key, value) {
        if (this.metaString) {
            let punctuation = ""

            if (this.metaValueCallCount === 1) {
                punctuation = ", "
                this.metaString += `${key}=${value}` + punctuation
                this.metaValueCallCount++
            } else if (this.metaValueCallCount > 1){
                punctuation = "\">"
                this.metaString += `${key}=${value}` + punctuation
                this.keyTags.push([this.howDeep, this.metaString])
            }
            return
        }
        this.keyTags.push([this.howDeep, `<meta name="${key}" content="${value}"`])

    }

    handleArray(key, value) {

        this.keyTags.pop()
        this.keyTagsCopy.pop()

        value.forEach((element) => {
            let lineString = `<${key}`
            for (const elementKey in element) {
                lineString += ` ${elementKey}="${element[elementKey]}"`
            }
            lineString += ">"
            this.keyTags.push([this.howDeep, lineString])
        })
    }

    formatter() {
        let setHtml = ""
        let setLangHtml = this.htmlLang
        function fillerFilter(element) {
            return element !== "filler" && element.length
        }

        function doctypeFilter(element) {
            const docTest = element[1].includes("doctype")
            const langTest = element[1].includes("<language>")

            if (docTest) {
                setHtml = "html"
                return false

            } else if (langTest && element[0] <= 1) {
                setLangHtml = `<html lang="${setLangHtml}">`
                return false

            } else return true
        }

        let filteredArray = this.keyTags.filter(fillerFilter)
        filteredArray = filteredArray.filter(doctypeFilter)

        if (setLangHtml) {
            filteredArray.unshift([0, setLangHtml])
            filteredArray.unshift([0, "<!DOCTYPE> html"])
            filteredArray.push([0, "</html>"])
        } else {
            filteredArray.unshift([0, "<html>"])
            filteredArray.unshift([0, "<!DOCTYPE> html"])
            filteredArray.push([0, "</html>"])
        }

        const formattedArray = filteredArray.map((element) => {
            let indent = ""
            const indentNum = parseInt(element[0])
            for (let i = 0; i < indentNum; i++) {
                indent += "    "
            }

            return indent + element[1]
        })

        return formattedArray
    }

    parse() {
        this.traverse(this.data)
        const formatted = this.formatter()
        console.log(formatted)
        return formatted
    }
}

const parser = new HtmlParser(data)
const parsedJSON = parser.parse()


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
