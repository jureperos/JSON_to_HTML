import * as fs from "fs"

//const data = JSON.parse(fs.readFileSync("./primeri/helloWorld.json"))
//const data = JSON.parse(fs.readFileSync("./primeri/pageNotFound.json"))
const data = JSON.parse(fs.readFileSync("./primeri/pageNotFoundV2.json"))

class HtmlParser {
    constructor(jsonData) {
        this.data = jsonData
        this.htmlLang = jsonData.language
        this.keyTags = [[]]
        this.closeTagRef = [[]]
    }

    get lastTag() {
        return this.keyTags[this.keyTags.length -1]
    }
    // Glavna rekurzivna funkcija
    traverse(obj, nodeDepth) {

        for (const key in obj) {
            const value = obj[key]

            // Polja kjer se shranjujejo HTML oznake in odnosi med njimi
            // Kopija hrani končne oznake
            this.keyTags.push([nodeDepth, `<${key}>`])
            this.closeTagRef.push([nodeDepth, `</${key}>`])

            if (key === "doctype") {
                this.handleDoctype(key, obj)
            }

            if (typeof value === "object") {

                // Stavki obravnavajo posebne oznake (npr. samozapiralne)
                if (key === "meta") {
                    this.handleMeta(value, nodeDepth)
                    continue
                }
                if (Array.isArray(value)) {
                    this.handleArray(key, value, nodeDepth)
                    continue
                }
                if (key === "attributes") {
                    this.handleAttributes(value)
                    continue
                }

                // Števec globine objektov/oznak
                nodeDepth++
                this.traverse(value, nodeDepth)

            } else {
                // Metoda za obravnavo listov podatkovnega drevesa
                this.handleValue(value, nodeDepth)
            }
            // Dodajanje zapiralnih oznak
            const nestedItem = this.closeTagRef.pop()
            this.keyTags.push(nestedItem)
        }
        nodeDepth--

    }

    filterData() {
        const filterFillerData = this.filterFiller()
        const filterDoctypeData = this.filterDoctype(filterFillerData)
        const filteredDoctypeData = this.handleHtmlTags(filterDoctypeData)
        return filteredDoctypeData
    }

    formatArray() {
        const filteredData = this.filterData()
        const formattedData = this.formatData(filteredData)
        return formattedData
    }

    parse() {
        this.traverse(this.data, 1)
        const formattedArray = this.formatArray()
        return formattedArray.join("\n")
    }

    HTMLwrite(path, stringData) {
        fs.writeFileSync(`${path}`, stringData)
    }

    handleDoctype(key, obj) {
        if (obj[key] !== "html") {
            console.warn(
                `Nepričakovan doctype format!\nPričakovan: html\tNajden: ${obj[key]}`
            )
        }

    }


    handleValue(value, leafDepth) {

        const poppedKeyTag = this.keyTags.pop()
        const poppedCloseTagRef = this.closeTagRef.pop()

        this.keyTags.push(
            [leafDepth, `${poppedKeyTag[1]}${value}${poppedCloseTagRef[1]}`]
        )
        this.closeTagRef.push([])
    }

    handleMeta(value, metaDepth, metaValueCallCount = 0, metaString = "") {

        if (this.lastTag[1] === "<meta>") {
            this.keyTags.pop()
            this.closeTagRef.pop()
        }

        for (const metaKey in value) {
            const metaValue = value[metaKey]

            if (metaKey === "charset") {
                this.keyTags.push(
                    [metaDepth, `<meta charset="${metaValue}">`]
                )

            } else if (typeof metaValue === "object") {
                metaValueCallCount++
                metaString = `<meta name="${metaKey}" content="`
                this.handleMeta(metaValue, metaDepth, metaValueCallCount, metaString)

            } else {
                const [returnedMetaCallCount, returnedMetaString] = this.handleMetaValue(
                    metaKey,
                    metaValue,
                    metaDepth,
                    metaValueCallCount,
                    metaString
                )

                metaValueCallCount = returnedMetaCallCount
                metaString = returnedMetaString
            }
        }
    }

    handleMetaValue(key, value, metaDepth, metaCallCount, metaString) {
        if (metaString) {
            let punctuation = ""

            if (metaCallCount === 1) {
                punctuation = ", "
                metaString += `${key}=${value}` + punctuation
                metaCallCount++
            } else if (metaCallCount > 1){
                punctuation = "\">"
                metaString += `${key}=${value}` + punctuation
                this.keyTags.push([metaDepth, metaString])
            }

            return [metaCallCount, metaString]
        }

        this.keyTags.push(
            [metaDepth, `<meta name="${key}" content="${value}">`]
        )

        if (metaCallCount) {
            return metaCallCount, metaString
        } else return [0, ""]

    }

    handleArray(key, value, arrayDepth) {

        this.keyTags.pop()
        this.closeTagRef.pop()

        value.forEach((element) => {
            let lineString = `<${key}`
            for (const elementKey in element) {
                lineString += ` ${elementKey}="${element[elementKey]}"`
            }
            lineString += ">"
            this.keyTags.push([arrayDepth, lineString])
        })
    }

    handleAttributes(value) {
        this.keyTags.pop()
        this.closeTagRef.pop()
        const prevTag = this.keyTags.pop()
        let styleString = ``
        let attributeString = ``
        const styleKeyString = "style="

        for (const attributeKey in value) {

            if (attributeKey === "style")  {
                for (const styleKey in value.style) {
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
        this.keyTags.push(
            [prevTag[0], `${prevTag[1].slice(0, -1)} ${attributeString} ${styleKeyString}"${styleString.slice(0, -1)}">`]
        )
    }

    handleHtmlTags(filteredData) {
        if (this.htmlLang) {
            filteredData.unshift([0, `<html lang="${this.htmlLang}">`])
            filteredData.unshift([0, "<!DOCTYPE html>"])
            filteredData.push([0, "</html>"])
        } else {
            filteredData.unshift([0, "<html>"])
            filteredData.unshift([0, "<!DOCTYPE html>"])
            filteredData.push([0, "</html>"])
        }
        return filteredData
    }

    formatData(filteredData) {
        const formattedData = filteredData.map((element) => {
            let indent = ""
            const indentNum = parseInt(element[0])
            for (let i = 0; i < indentNum; i++) {
                indent += "    "
            }
            return indent + element[1]
        })
        return formattedData
    }

    filterFiller() {
        const filterFillerData = this.keyTags.filter((element) => {
            return element !== "filler" && element.length
        })

        return filterFillerData
    }

    filterDoctype(filterFillerData) {
        const filterDoctypeData = filterFillerData.filter((element) => {
            const docTest = element[1].includes("doctype")
            const langTest = element[1].includes("<language>")

            if (docTest) {
                return false
            } else if (langTest && element[0] <= 1) {
                return false
            } else return true
        })

        return filterDoctypeData
    }
}


const parser = new HtmlParser(data)
const parsedJSON = parser.parse()
console.log(parsedJSON)
parser.HTMLwrite("./dajMarkup.html", parsedJSON)

