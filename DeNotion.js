// DeNotion
// Remove IDs from Notion exports

const fs = require('fs')

const getNotionIds = (path) => {
    let ids = []
    fs.readdirSync(path).forEach(file => {
        if (fs.statSync(`${path}/${file}`).isDirectory()) {
            ids.push(file.slice(-33))
            ids = ids.concat(getNotionIds(`${path}/${file}`))
        } else if (file.toLowerCase().endsWith('.md')) {
            ids.push(file.slice(-36).slice(0, -3))
        } else if (file.toLowerCase().endsWith('.csv')) {
            ids.push(file.slice(-37).slice(0, -4))
        }
    })
    ids.forEach(id => {
        if (!id.startsWith(' ') || id.length !== 33) throw 'One or more Notion IDs are invalid - this may not be an untouched Notion export'
    })
    return ids
}

const renameNotionFiles = (path) => {
    fs.readdirSync(path).forEach(file => {
        const originalFile = file
        file = originalFile.split('тАФ').join('—')
        fs.renameSync(`${path}/${originalFile}`, `${path}/${file}`)
        if (fs.statSync(`${path}/${file}`).isDirectory()) {
            const newFile = file.slice(0, -33)
            fs.renameSync(`${path}/${file}`, `${path}/${newFile}`)
            renameNotionFiles(`${path}/${newFile}`)
        } else if (file.toLowerCase().endsWith('.md')) {
            const newFile = `${file.slice(0, -36)}.md`
            fs.renameSync(`${path}/${file}`, `${path}/${newFile}`)
        } else if (file.toLowerCase().endsWith('.csv')) {
            const newFile = `${file.slice(0, -37)}.csv`
            fs.renameSync(`${path}/${file}`, `${path}/${newFile}`)
        }
        
    })
}

const replaceNotionLinks = (path, ids) => {
    const innerReplace = (path, ids) => {
        fs.readdirSync(path).forEach(file => {
            if (fs.statSync(`${path}/${file}`).isDirectory()) {
                innerReplace(`${path}/${file}`, ids)
            } else if (file.toLowerCase().endsWith('.md')) {
                let data = fs.readFileSync(`${path}/${file}`).toString()
                ids.forEach(id => data = data.split(id).join(''))
                fs.writeFileSync(`${path}/${file}`, data)
            }
        })
    }
    ids = ids.map(id => encodeURIComponent(id))
    innerReplace(path, ids)
}

try {
    if (process.argv.length < 3) throw 'Provide the path to a Notion export directory'
    const path = process.argv[2]
    if (!fs.existsSync(path)) throw 'Path does not exist'
    if (!fs.statSync(path).isDirectory()) throw 'Path is not a directory'
    const ids = getNotionIds(path)
    renameNotionFiles(path)
    replaceNotionLinks(path, ids)
} catch (err) {
    console.error(err)
    process.exit(-1)
}