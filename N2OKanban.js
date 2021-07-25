// N2OKanban
// Generate an Obsidian Kanban board from an exported Notion Kanban board directory
// IMPORTANT: Run from inside whatever directory the final board .md file is meant to be, and provide a relative path name

const fs = require('fs')
const { basename } = require('path')

try {
    if (process.argv.length < 3) throw 'Provide the path to a Notion Kanban board export directory'
    if (process.argv.length < 4) throw 'Provide the name of the attribute to group by'
    const path = process.argv[2]
    let groupString = process.argv[3]
    if (!fs.existsSync(path)) throw 'Path does not exist'
    if (!fs.statSync(path).isDirectory()) throw 'Path is not a directory'

    groupString = groupString.trim()
    let parsedResults = {
        path: path,
        groupString: groupString,
        groups: new Set(),
        files: []
    }
    fs.readdirSync(path).forEach(file => {
        if (file.toLowerCase().endsWith('.md')) {
            const matchStrings = fs.readFileSync(`${path}/${file}`).toString()
                .split('\n').filter(line => line.includes(`${groupString}: `))
                .map(line => line.trim().slice(groupString.length + 2)).filter(line => line.length > 0)
            if (matchStrings.length === 0) throw `Couldn't find the group string '${groupString}' in ${file}`
            parsedResults.groups.add(matchStrings[0])
            parsedResults.files.push({ file, group: matchStrings[0] })
        }
    })
    parsedResults.groups = Array.from(parsedResults.groups)

    let result = '---\n\nkanban-plugin: basic\n\n---\n\n'
    parsedResults.groups.forEach(group => {
        result += `## ${group}\n\n`
        parsedResults.files.forEach(file => {
            encodedPath = path.split('/').map(file => encodeURIComponent(file)).join('/')
            if (file.group === group) {
                result += `- [ ] [${file.file.slice(0, -3)}](${encodedPath}/${encodeURIComponent(file.file)})\n`
            }
        })
        result += '\n\n'
    })

    fs.writeFileSync(`${basename(path)}.md`, result)
} catch (err) {
    console.error(err)
    process.exit(-1)
}