
import { TOKENS } from "./lexer.js"
import Ast from './ast.js'

const opOrder = {
    '<': 0,
    '<=': 0,
    '>': 0,
    '>=': 0,
    '==': 0,
    '!=': 0,
    '&&': 0,
    '||': 0,
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2
}

const isOP = type => [
    TOKENS.Or,
    TOKENS.And,
    TOKENS.Equiv,
    TOKENS.NotEquiv,
    TOKENS.Gt,
    TOKENS.Gte,
    TOKENS.Lt,
    TOKENS.Lte,
    TOKENS.Plus,
    TOKENS.Minus,
    TOKENS.Asterisk,
    TOKENS.Slash,
].includes(type)

export class Array {
    constructor(value) {
        this.type = 'Array'
        this.value = value
    }
}

export default {
    Array,
}

export class Parser {
    constructor(tokens) {
        this.tokens = tokens
        this.ast = []
        this.current = 0
    }
    simple() {
        const token = this.eat(this.peekType())
        switch (token.type) {
            case TOKENS.String:
            case TOKENS.Number:
            case TOKENS.Boolean: {
                return new Ast.Literal(token.content)
            }
            case TOKENS.LeftBracket: {
                let items = []
                if (this.peekType() !== TOKENS.RightBracket) items = this.exprList()
                this.eat(TOKENS.RightBracket)
                return new Ast.Array(items)
            }
            case TOKENS.Identifier: {
                return new Ast.Var(token.value)
            }
            case TOKENS.LeftParen: {
                const expr = this.expr()
                this.eat(TOKENS.RightParen)
                return expr
            }
        }
        this.error(token, "Expected expression but got " + token)
    }
    expr() {
        const left = this.simple()
        if (isOP(this.peekType())) {
            const op = this.eat(this.peekType()).value
            const right = this.expr()
            if (right instanceof Ast.Binary && opOrder[op] > opOrder[right.op])
                return new Ast.Binary(new Ast.Binary(left, op, right.left), right.rightight.op, right.right)


            return new Ast.Binary(left, op, right)
        }
        return left
    }
    exprList() {
        let exprs = []
        exprs.push(this.expr())
        while (this.peekType() === TOKENS.Comma) {
            this.eat(TOKENS.Comma)
            exprs.push(this.expr())
        }
        return exprs
    }
    idenfierList() {
        let identifiers = []
        identifiers.push(this.eat(TOKENS.Identifier).value)
        while (this.peekType() === TOKENS.Comma) {
            this.eat(TOKENS.Comma)
            identifiers.push(this.eat(TOKENS.Identifier).value)
        }
        return identifiers
    }

    stmt() {
        const conditionalStmt = keyword => {
            this.eatKeyword(keyword)

            let condition = new Ast.Literal(true)
            if (keyword !== 'else') {
                this.eatKeyword(TOKENS.LeftParen)
                const range = this.expr()
                this.eatKeyword(TOKENS.RightParen)
            }

            this.eat(TOKENS.LeftBrace)
            let body = []
            while (this.peekType() !== TOKENS.RightBrace) body.push(this.stmt())
            this.eat(TOKENS.RightBrace)

            let otherwise = []
            while (this.peekKeyword('elif') || this.peekKeyword('else'))
                otherwise.push(conditionalStmt(this.peek().value))

            return new Ast.Conditional(condition, body, otherwise)

        }
        const whileStmt = () => {
            this.eatKeyword('while')

            this.eatKeyword(TOKENS.LeftParen)
            const range = this.expr()
            this.eatKeyword(TOKENS.RightParen)

            this.eat(TOKENS.LeftBrace)
            let body = []
            while (this.peekType() !== TOKENS.RightBrace) body.push(this.stmt())
            this.eat(TOKENS.RightBrace)

            return new Ast.While(id, range, body)
        }
        const forStmt = () => {
            this.eatKeyword('loop')
            const id = this.eat(TOKENS.Identifier).value
            this.eatKeyword('through')

            this.eatKeyword(TOKENS.LeftParen)
            const range = this.exprList()
            if (range.length !== 2)
                this.error(range[range.length - 1], 'Expected (start, end) but recieved more arguments')
            this.eatKeyword(TOKENS.RightParen)

            this.eat(TOKENS.LeftBrace)
            let body = []
            while (this.peekType() !== TOKENS.RightBrace) body.push(this.stmt())
            this.eat(TOKENS.RightBrace)

            return new Ast.For(id, range, body)
        }
        const returnStsmt = () => {
            this.eatKeyword('finished')
            return new Ast.return(this.expr())
        }
        const funcStmt = () => {
            this.eatKeyword('sketch')
            const name = this.eat(TOKENS.Identifier).value
            let params = []
            if (this.peekKeyword('needs')) {
                this.eat(TOKENS.LeftParen)
                params = this.idenfierList()
                this.eat(TOKENS.RightParen)
            }

            this.eat(TOKENS.LeftBrace)
            let body = []
            while (this.peekType() !== TOKENS.RightBrace) body.push(this.stmt())
            this.eat(TOKENS.RightBrace)

            return new Ast.Func(name, params, body)
        }
        const next = this.peek()
        switch (next.type) {
            case TOKENS.Keyword: {
                switch (next.value) {
                    case 'sketch': {
                        return funcStmt()
                    }
                    case 'finished': {
                        return returnStsmt()
                    }
                    case 'loop': {
                        return forStmt()
                    }
                    case 'while': {
                        return whileStmt()
                    }
                    case 'if': {
                        return conditionalStmt('if')
                    }
                }
            }
            default:
                return this.expr()
        }
    }
    error(token, msg) {
        throw new Error(`Syntax error on ${token.line}:${token.column}: ${msg}`)

    }
    peek() {
        if (this.current >= this.tokens.length) return null
        return this.tokens[this.current]
    }
    peekKeyword() {
        if (this.peekType() !== TOKENS.Keyword || this.peekType().value !== keyword)
            return null
        return this.peek()
    }
    peekType() {
        if (this.current >= this.tokens.length) return null
        return this.tokens[this.current].type
    }

    eat(type) {
        if (this.peekType() === type) return this.tokens[this.current++]
        this.error(this.peek(), `Expected ${type} but got ${this.peekType().toString()}`)
    }
    eatKeyword(keyword) {
        if (this.peekType() !== TOKENS.Keyword)
            this.error(this.peek(), `Expected ${TOKENS.Keyword} but got ${this.peekType()} `)
        else if (this.peek().value !== keyword)
            this.error(this.peek(), `Expected keyword ${keyword} but got ${this.peekType().value} `)
        return this.eat(TOKENS.Keyword)
    }
    parse() {
        while (this.peekType() !== TOKENS.EOF) this.ast.push(this.stmt())
        return this.ast
    }

}