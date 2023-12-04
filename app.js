import * as fs from "fs"

const data = JSON.parse(fs.readFileSync("./primeri/helloWorld.json"))
//const data = JSON.parse(fs.readFileSync("./primeri/pageNotFound.json"))
//const data = JSON.parse(fs.readFileSync("./primeri/pageNotFoundV2.json"))

class HtmlParser {
    constructor(jsonData) {
        this.data = jsonData
        this.htmlLang = jsonData.language
        this.howDeep = 1
        this.keyTags = [[]]
        this.keyTagsCopy = [[]]
        this.metaValueCallCount = 0
        this.metaString = ""
        this.filteredData = []
        this.formattedData = []
    }

    get lastTag() {
        return this.keyTags[this.keyTags.length -1]
    }
    // Glavna rekurzivna funkcija
    traverse(obj) {
        for (const key in obj) {
            const value = obj[key]

            // Polja kjer se shranjujejo HTML oznake in odnosi med njimi
            // Kopija hrani končne oznake
            this.keyTags.push([this.howDeep, `<${key}>`])
            this.keyTagsCopy.push([this.howDeep, `</${key}>`])

            if (typeof value === "object") {

                // Stavki obravnavajo posebne oznake (npr. samozapiralne)
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

                // Števec globine objektov/oznak
                this.howDeep++
                this.traverse(value)

            } else {
                // Metoda za obravnavo listov podatkovnega drevesa
                this.handleValue(value)
            }
            // Dodajanje zapiralnih oznak
            const nestedItem = this.keyTagsCopy.pop()
            this.keyTags.push(nestedItem)
        }
        this.howDeep--
    }

    formatArray() {
        this.filterData()
        this.formatData()
    }

    filterData() {
        this.filterFiller()
        this.filterDoctype()
        this.handleDoctype()
    }

    parse() {
        this.traverse(this.data)
        this.formatArray()
        return this.formattedData.join("\n")
    }

    write(path, stringData) {
        fs.writeFileSync(`${path}`, stringData)
    }


    handleValue(value) {

        const poppedKeyTag = this.keyTags.pop()
        const poppedKeyTagCopy = this.keyTagsCopy.pop()

        this.keyTags.push(
            [this.howDeep, `${poppedKeyTag[1]}${value}${poppedKeyTagCopy[1]}`]
        )
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
                this.keyTags.push(
                    [this.howDeep, `<meta charset="${metaValue}">`]
                )

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
        this.keyTags.push(
            [this.howDeep, `<meta name="${key}" content="${value}"`]
        )
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

    formatData() {
        this.formattedData = this.filteredData.map((element) => {
            let indent = ""
            const indentNum = parseInt(element[0])
            for (let i = 0; i < indentNum; i++) {
                indent += "    "
            }
            return indent + element[1]
        })
    }

    handleDoctype() {
        if (this.htmlLang) {
            this.filteredData.unshift([0, `<html lang="${this.htmlLang}">`])
            this.filteredData.unshift([0, "<!DOCTYPE html>"])
            this.filteredData.push([0, "</html>"])
        } else {
            this.filteredData.unshift([0, "<html>"])
            this.filteredData.unshift([0, "<!DOCTYPE html>"])
            this.filteredData.push([0, "</html>"])
        }
    }

    filterFiller() {
        this.filteredData = this.keyTags.filter((element) => {
            return element !== "filler" && element.length
        })
    }

    filterDoctype() {
        this.filteredData = this.filteredData.filter((element) => {
            const docTest = element[1].includes("doctype")
            const langTest = element[1].includes("<language>")

            if (docTest) {
                return false
            } else if (langTest && element[0] <= 1) {
                return false
            } else return true
        })
    }
}

const parser = new HtmlParser(data)
const parsedJSON = parser.parse()
parser.write("./dajMarkup.html", parsedJSON)
