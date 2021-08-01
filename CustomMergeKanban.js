// CustomMergeKanban
// ...

const fs = require('fs')
const { basename } = require('path')
const os = require('os')

try {
    if (process.argv.length < 3) throw 'Provide the path to a Notion Kanban board export directory'
    const path = process.argv[2]
    if (!fs.existsSync(path)) throw 'Path does not exist'
    if (!fs.statSync(path).isDirectory()) throw 'Path is not a directory'

    let parsedData = []

    fs.readdirSync(path).forEach(file => {
        if (!fs.statSync(`${path}/${file}`).isDirectory()) {
            const data = fs.readFileSync(`${path}/${file}`).toString()
            const dataLines = data.split('\n')
            if (dataLines.filter(line => line.includes('Status: ')).length === 1) {
                const dateFiltered = dataLines.filter(line => line.includes('Date: '))
                let date = null
                if (dateFiltered.length > 0) {
                    try {
                        date = new Date(dateFiltered[0].slice(6))
                    } catch (err) {

                    }
                }
                parsedData.push({
                    file,
                    data,
                    date
                })
            }
        }
    })

    parsedData = parsedData.sort((a, b) => (b.date || 0) - (a.date || 0))


    let result = `> ***This file contains individual items from a Notion kanban board, compacted into a single file and sorted by date.***\n\n---\n\n\n\n`

    parsedData.forEach((item, index) => {
        result += `${item.data}\n\n\n\n`
        if (index < parsedData.length - 1)
            if (item.date !== null && parsedData[index + 1].date === null) {
                result += `---\n> ***No dates available for items beyond this point. Ordering may be random.***\n---\n\n\n\n`
            }
    })
    console.log(`${parsedData.length} items saved to ${os.homedir()}/Downloads/${basename(path)}-compact.md.`)
    fs.writeFileSync(`${os.homedir()}/Downloads/${basename(path)}-compact.md`, result)
} catch (err) {
    console.error(err)
    process.exit(-1)
}