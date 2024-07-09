
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
    call() {
        let expr = this.simple()
        while (true) {
            if (this.peekType() === TOKENS.LeftParen) {
                this.eat(TOKENS.LeftParen)
                let args = []
                if (this.peekType() !== TOKENS.RightParen) args = this.exprList()
                this.eat(TOKENS.RightParen)
                expr = new Ast.Call(expr, args)
            }   else if (this.peekType() === TOKENS.LeftBracket) {
                this.eat(TOKENS.LeftBracket)
                const property = this.expr()
                this.eat(TOKENS.RightBracket)
                expr = new Ast.Get(expr, property, true)
            } else if (this.peekType() === TOKENS.Period) {
                this.eat(TOKENS.Period)
                const property = this.eat(TOKENS.Identifier).value()
                expr = new Ast.Get(expr, property)
            } else break
        }
    }
    simple() {
        const token = this.eat(this.peekType())
        switch (token.type) {
            case TOKENS.Keyword: {
                 if (token.value === 'prepare') {
                    const id = this.eat(TOKENS.Identifier).value

                    this.eat(TOKENS.LeftParen)
                    let members = {}
                    while (this.peekType() !== TOKENS.RightParen) {
                        const member = this.eat(TOKENS.Identifier).value
                        this.eat(TOKENS.Colon)
                        members[member] = this.expr()
                        if (this.peekType() === TOKENS.Comma) this.eat(TOKENS.Comma)
                    }
                    this.eat(TOKENS.RightParen)

                    return new Ast.Istance(id, members)
                 }
                 break
            }
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
    unary() {
        if (this.peekType() === TOKENS.Not) {
            const op = this.eat(this.peekType()).value
            return new Ast.Unary(op, this.unary())
        }
        return this.call()
    }
    expr() {
        const left = this.unary()
        if (isOP(this.peekType())) {
            const op = this.eat(this.peekType()).value
            const right = this.expr()
            if (right instanceof Ast.Binary && opOrder[op] > opOrder[right.op])
                return new Ast.Binary(new Ast.Binary(left, op, right.left), right.rightight.op, right.right)


            return new Ast.Binary(left, op, right)
        }
        return this.call()
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
        const strucStmt = () => {
            this.eatKeyword('brush')
            const name = this.eat(TOKENS.Identifier).value
            this.eatKeyword('has')
            this.eat(TOKENS.LeftBrace)
            const members = this.idenfierList()
            this.eat(Tokens.RightBrace)
            return new Ast.Struct(name, members)
        }
        const assignStmt = () => {
            this.eatKeyword('prepare')
            const name = this.eat(TOKENS.Identifier).value
            if (this.peekType() === TOKENS.Period) {
                this.eat(TOKENS.Period)
                const property = this.eat(TOKENS.Identifier).value
                this.eatKeyword('as')
                const value = this.expr()
                return new Ast.Set(name, property, value)
            }

            this.eatKeyword('as')
            const value = this.expr()
            return new Ast.Var(name, property, value)
        }
        const conditionalStmt = keyword => {
            this.eatKeyword(keyword)

            let condition = new Ast.Literal(true)
            if (keyword !== 'else') {
                this.eatKeyword(TOKENS.LeftParen)
                condition = this.expr()
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

            this.eat(TOKENS.LeftParen)
            const range = this.exprList()
            if (range.length !== 2)
                this.error(range[range.length - 1], 'Expected (start, end) but recieved more arguments')
            this.eat(TOKENS.RightParen)

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
                this.eatKeyword('needs')
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
                    case 'prepare': {
                        return assignStmt()
                    }
                    case 'struct': {
                        return strucStmt() 
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
        if (this.peekType() !== TOKENS.Keyword || this.peek().value !== keyword)  return null
           
        return this.peek()
    }
    peekType() {
        if (this.current >= this.tokens.length) return null
        return this.tokens[this.current].type
    }

    eat(type) {
        if (this.peekType() === type) return this.tokens[this.current++]
        this.error(this.peek(), `Expected ${type} but go tt ${this.peekType().toString()}`)
    }
    eatKeyword(keyword) {
        if (this.peekType() !== TOKENS.Keyword)
            this.error(this.peek(), `Expected ${TOKENS.Keyword} but  test got ${this.peekType()} `)
        else if (this.peek().value !== keyword)
            this.error(this.peek(), `Expected keyword ${keyword} but got ${this.peekType().value} `)
        return this.eat(TOKENS.Keyword)
    }
    parse() {
        while (this.peekType() !== TOKENS.EOF) this.ast.push(this.stmt())
        return this.ast
    }

}