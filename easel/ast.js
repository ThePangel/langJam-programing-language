export class Literal {
    constructor(value){
        this.type = 'Literal'
        this.value = value
    }
}

export class Var {
    constructor(name, value) {
        this.type = 'Var'
        this.name = name
        this.value = value
    }
}

export class Binary {
    constructor(left, op, right) {
        this.type = 'Binary'
        this.left = left
        this.op = op
        this.right = right
    }
}

export class Array {
    constructor(value) {
        this.type = 'Array'
        this.value = value
    }
}

export default {
    Literal,
    Var,
    Binary,
    Array
}