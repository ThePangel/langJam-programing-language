import fs from 'fs'

import  {EaselError} from './stdlib.js'

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

export const TOKENS = {
    LeftParen: 'LeftParen',
    RightParen: 'RightParen',
    LeftBrace: 'LeftBrace',
    RightBrace: 'RightBrace',
    LeftBracket: 'LeftBracket',
    RightBracket: 'RightBracket',
    Period: 'Period',
    Comma: 'Comma',
    Keyword: 'Keyword',
    Identifier: 'Identifier',
    String: 'String',
    Number: 'Number',
    Or: 'Or',
    Not: 'Not',
    And: 'And',
    Equiv: 'Equiv',
    NotEquiv: 'NotEquiv',
    Gt: 'Gt',
    Gte: 'Gte',
    Lt: 'Lt',
    Lte: 'Lte',
    Plus: 'Plus',
    Minus: 'Minus',
    Asterisk: 'Asterisk',
    Slash: 'Slash',
    EOF: 'EOF',

}

export class Token {
    constructor(type, value, content, line, column) {
        this.type = type
        this.value = value
        this.content = content
        this.line = line
        this.column = column
    }
    toString() { return this.value }
}

export class Lexer {
    constructor(program) {
        this.program = program
        this.tokens = []
        this.current = 0
        this.line = 1
        this.column = 0
    }

    error(msg ) {throw new EaselError('Error on ${this.line}:${this.column}: ${msg}')}
}