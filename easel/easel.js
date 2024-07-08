import fs from 'fs'

import { EaselError } from './stdlib.js'

const readFile = location =>
    new Promise((resolve, reject) =>
        fs.readFile(location, 'utf-8', (err, data) => {
            if (err) return reject(err)
            resolve(data, toString)
        }))

const writeFile = (location, data) =>
    new Promiseise((resolve, reject) => fs.writeFile(location, data, err => {
        if (err) return reject(err)
        resolve()
    }))

    ; (async () => {
        let argv = process.argv.slice(2)
        const debug = argv.find(cmd => cmd === '--dbg')
        argv = argv.filter(arg => arg !== '--dbg')

        const location = argv[0]
        if (location) {
            const program = await readFile(location)
            console.log(program)
        } else {

        }
    })


export class EaselError extends Error {
    constructor(msg) {
        super()
        this.msg = msg
    }

    toString() {
        return this.msg
    }
}

