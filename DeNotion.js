// DeNotion
// Remove IDs from Notion exports

const fs = require('fs')

// Recursively removes Notion IDs from file names and returns the list of removed IDs
const removeReturnIds = (path) => {
    // First find files with identical names (these will remain with their IDs intact as removing the IDs would cause naming conflicts)
    const filesHere = fs.readdirSync(path)
    let dupeTestArray = filesHere.map(file => {
        if (fs.statSync(`${path}/${file}`).isDirectory()) file = file.slice(0, -33)
        else if (file.endsWith('.md')) file = file.slice(0, -36) + '.md'
        else if (file.endsWith('.csv')) file = file.slice(0, -37) + '.csv'
        return file
    })
    let dupes = []
    dupeTestArray.forEach((file, index) => {
        if (dupeTestArray.filter(f => f === file).length > 1) dupes.push(filesHere[index])
    })
    // Next, recursively go through each directory, renaming to remove all IDs that can be removed, and saving those IDs to an array
    let ids = []
    filesHere.forEach(file => {
        const originalFile = file
        file = originalFile.split('тАФ').join('—')
        fs.renameSync(`${path}/${originalFile}`, `${path}/${file}`)
        if (fs.statSync(`${path}/${file}`).isDirectory()) {
            let newFile = file.slice(0, -33)
            if (!dupes.includes(originalFile)) {
                ids.push(file.slice(-33))
                fs.renameSync(`${path}/${file}`, `${path}/${newFile}`)
            } else newFile = file
            ids = ids.concat(removeReturnIds(`${path}/${newFile}`))
        } else if (file.toLowerCase().endsWith('.md')) {
            if (!dupes.includes(originalFile)) {
                const newFile = `${file.slice(0, -36)}.md`
                ids.push(file.slice(-36).slice(0, -3))
                fs.renameSync(`${path}/${file}`, `${path}/${newFile}`)
            }
        } else if (file.toLowerCase().endsWith('.csv')) {
            if (!dupes.includes(originalFile)) {
                const newFile = `${file.slice(0, -37)}.csv`
                ids.push(file.slice(-37).slice(0, -4))
                fs.renameSync(`${path}/${file}`, `${path}/${newFile}`)
            }
        }
    })
    // Make sure the IDs are actually IDs (not a comprehensive check but should catch basic errors)
    ids.forEach(id => {
        if (!id.startsWith(' ') || id.length !== 33) throw 'One or more Notion IDs are invalid - this may not be an untouched Notion export'
    })
    return ids
}

// Takes a list of ID strings and removes any instances of those strings in links in the Markdown files 
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
    ids = ids.map(id => encodeURIComponent(id)) // They would be URL encoded in links from Notion
    innerReplace(path, ids)
}

try {
    if (process.argv.length < 3) throw 'Provide the path to a Notion export directory'
    const path = process.argv[2]
    if (!fs.existsSync(path)) throw 'Path does not exist'
    if (!fs.statSync(path).isDirectory()) throw 'Path is not a directory'
    const ids = removeReturnIds(path)
    replaceNotionLinks(path, ids)
} catch (err) {
    console.error(err)
    process.exit(-1)
}