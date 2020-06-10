let VARS = ["x", "y", "z"];

// Const
const ZERO = new Const(0);
const ONE = new Const(1);
let isOne = (x) => (x instanceof Const && x.evaluate() === 1);
let isZero = (x) => (x instanceof Const && x.evaluate() === 0);

function Const(cnst) {
    this.value = cnst;
}

Const.prototype.evaluate = function () {
    return this.value;
};
Const.prototype.toString = function () {
    return this.value.toString();
};
Const.prototype.diff = function () {
    return ZERO;
};
Const.prototype.simplify = function () {
    return new Const(this.value);
};
Const.prototype.prefix = Const.prototype.toString;
Const.prototype.postfix = Const.prototype.toString;

// Variable
function Variable(varName) {
    this.name = varName;
    this.ind = VARS.indexOf(varName);
}

Variable.prototype.evaluate = function (...args) {
    return args[this.ind];
};
Variable.prototype.toString = function () {
    return this.name;
};
Variable.prototype.diff = function (dVar) {
    return this.name === dVar ? ONE : ZERO;
};
Variable.prototype.simplify = function () {
    return new Variable(this.name);
};

Variable.prototype.prefix = Variable.prototype.toString;
Variable.prototype.postfix = Variable.prototype.toString;

// Operations
function AbstractOperation(args) {
    this.operands = args;
}

AbstractOperation.prototype.evaluate = function (...args) {
    let evaluatedArgs = this.operands.map(arg => arg.evaluate(...args));
    return this.calculate(...evaluatedArgs);
};

AbstractOperation.prototype.toString = function () {
    return this.operands.join(" ") + " " + this.opString;
};

AbstractOperation.prototype.diff = function (diffVar) {
    let curArgs = this.operands;
    return this.doDiff(...curArgs.concat(curArgs.map((arg) => arg.diff(diffVar))));
};

AbstractOperation.prototype.simplify = function () {
    let simplified = this.operands.map(element => element.simplify());
    if (simplified.every((x) => x instanceof Const)) {
        return new Const(this.calculate(...simplified.map(arg => arg.evaluate())));
    }
    return this.doSimplify(...simplified);
};

AbstractOperation.prototype.prefix = function () {
    return "(" + this.opString + " " +
        this.operands.map(e => e.prefix()).join(" ") + ")";
};
AbstractOperation.prototype.postfix = function () {
    return "(" + this.operands.map((e) => e.postfix()).join(" ") + " " + this.opString + ")";
};

function makeOperation(calc, name, diff, simplify) {
    function Operation(...args) {
        AbstractOperation.call(this, [...args]);
    }

    Operation.prototype = Object.create(AbstractOperation.prototype);
    Operation.prototype.calculate = calc;
    Operation.prototype.opString = name;
    Operation.prototype.doDiff = diff;
    Operation.prototype.doSimplify = simplify;
    return Operation;
}

let ArcTan = makeOperation(
    (x) => Math.atan(x),
    "atan",
    function (x, dx) {
        return new Divide(
            dx,
            new Add(ONE, new Multiply(x, x)));
    },
    (x) => new ArcTan(x)
);

let ArcTan2 = makeOperation(
    (y, x) => Math.atan2(y, x),
    "atan2",
    function (x, y, dx, dy) {
        return new Divide(new Subtract(new Multiply(dx, y), new Multiply(x, dy)),
            new Add(new Multiply(x, x), new Multiply(y, y)));
    },
    (x, y) => new ArcTan2(x, y)
);

let Negate = makeOperation(
    (x) => -x,
    "negate",
    (x, dx) => new Negate(dx),
    (x) => new Negate(x)
);

let Add = makeOperation(
    (x, y) => x + y,
    "+",
    (x, y, dx, dy) => new Add(dx, dy),
    function (x, y) {
        if (isZero(x))
            return y;
        if (isZero(y))
            return x;
        return new Add(x, y);
    }
);

let Subtract = makeOperation(
    (x, y) => x - y,
    "-",
    (x, y, dx, dy) => new Subtract(dx, dy),
    function (x, y) {
        if (isZero(x))
            return new Negate(y);
        if (isZero(y))
            return x;
        return new Subtract(x, y);
    }
);

let Multiply = makeOperation(
    (x, y) => x * y,
    "*",
    function (x, y, dx, dy) {
        return new Add(
            new Multiply(dx, y),
            new Multiply(x, dy)
        );
    },
    function (x, y) {
        if (isZero(x) || isZero(y))
            return ZERO;
        if (isOne(x))
            return y;
        if (isOne(y))
            return x;
        return new Multiply(x, y);
    }
);

let Divide = makeOperation(
    (x, y) => x / y,
    "/",
    function (x, y, dx, dy) {
        return new Divide(
            new Subtract(
                new Multiply(dx, y),
                new Multiply(x, dy)
            ),
            new Multiply(y, y)
        );
    },
    function (x, y) {
        if (isZero(x))
            return ZERO;
        if (isOne(y))
            return x;
        return new Divide(x, y);
    }
);

let Exp = makeOperation(
    (x) => Math.exp(x),
    "exp",
    (x, dx) => new Multiply(dx, new Exp(x))
);

let Sumexp = makeOperation(
    function (...args) {
        return args.reduce((s, x) => s + Math.exp(x), 0)
    },
    "sumexp",
    function (...args) {
        return args.slice(0, args.length / 2).map((x, i) => new Multiply(new Exp(x), args[args.length / 2 + i])).reduce((s, x) => new Add(s, x), ZERO)
    }
);

let Softmax = makeOperation(
    (...args) => Math.exp(args[0]) / args.reduce((s, y) => s + Math.pow(Math.E, y), 0),
    "softmax",
    function (...args) {
        let arr = args.slice(0, args.length / 2);
        let result = new Sumexp(...arr);
        return new Divide(new Subtract(new Multiply(new Sumexp(args[0]).doDiff(args[0], args[args.length / 2]), result),
            new Multiply(new Sumexp(args[0]), result.doDiff(...args))), new Multiply(result, result));
    }
);

function Operation(name, cntArgs) {
    this.operation = name;
    this.cnt = cntArgs;
}

let OPERATIONS = {
    "-": new Operation(Subtract, 2),
    "+": new Operation(Add, 2),
    "/": new Operation(Divide, 2),
    "*": new Operation(Multiply, 2),
    "negate": new Operation(Negate, 1),
    "atan": new Operation(ArcTan, 1),
    "atan2": new Operation(ArcTan2, 2),
    "sumexp": new Operation(Sumexp, -1),
    "softmax": new Operation(Softmax, -1)
};

const VARIABLES = {};
for (const vars of VARS) {
    VARIABLES[vars] = new Variable(vars);
}

function parse(expression) {
    let stack = [];
    let tokens = expression.trim().split(/\s+/);

    for (const token of tokens) {
        if (token in OPERATIONS) {
            let op = OPERATIONS[token];
            stack.push(new op.operation(...stack.splice(-op.cnt)));
        } else if (token in VARIABLES) {
            stack.push(VARIABLES[token]);
        } else {
            stack.push(new Const(Number(token)));
        }
    }
    return stack.pop();
}


// Parser exception
function ParserError(expected, found, pos) {
    let expectedMessage = (!expected) ? "" : "Expected " + expected;
    let foundMessage = (!found) ? "" : ((!expected) ? "Found " : ", found ") + found;
    let positionMessage = (pos === undefined) ? "" : " at position " + (pos + 1);
    this.message = expectedMessage + foundMessage + positionMessage;
}

ParserError.prototype = Object.create(Error.prototype);
ParserError.prototype.constructor = ParserError;

// PrefPostfixParser
function parsePrefPost(expr, op) {
    let ind = 0;
    let stack = [];

    if (expr.length === 0) {
        throw new ParserError("expression", "empty input");
    }

    let isWhiteSpace = (ch) => /\s/.test(ch);
    let skipWhitespaces = function () {
        while (isWhiteSpace(expr[ind])) {
            ind++;
        }
    };

    let predicateIdentifier = (ch) => !isWhiteSpace(ch) && ch !== '(' && ch !== ')';
    let getIdentifier = function () {
        let begin = ind;
        while (predicateIdentifier(expr[ind]) && ind < expr.length) {
            ind++;
        }
        return expr.slice(begin, ind);
    };

    let check = (x) => x instanceof Const || x instanceof Variable || x instanceof AbstractOperation;

    let wrap = (str) => "'" + str + "'";

    function Pair(token, pos) {
        this.token = token;
        this.pos = pos;
    }

    function calc() {
        let stackPos = stack.length - 1;
        let tokens = [];
        while (stack[stackPos].token !== '(') {
            tokens.push(stack[stackPos--]);
            if (stackPos === -1) {
                throw new ParserError('(', undefined, 1);
            }
        }
        tokens.reverse();
        if (tokens.length === 0) {
            throw new ParserError("operation", "empty operation", stack[stackPos].pos);
        }

        let operands = op(tokens);
        let currOperation = tokens[0];

        if (!(currOperation.token in OPERATIONS)) {
            throw new ParserError("operation", wrap(currOperation.token), currOperation.pos);
        }
        if (stack[stackPos].token !== '(') {
            throw new ParserError("'('", wrap(stack[stackPos].token), stack[stackPos].pos);
        }

        let operandTokens = operands.map((x) => x.token);
        let indexError = operandTokens.findIndex((x) => !check(x));
        if (indexError !== -1) {
            throw new ParserError("argument", operands[indexError].token, operands[indexError].pos)
        }

        let argCnt = OPERATIONS[currOperation.token].cnt;
        if (argCnt !== -1 && operands.length !== argCnt) {
            let operandString = (cnt) => cnt + ((cnt === 1) ? " operand" : " operands");
            throw new ParserError(operandString(argCnt) + " for operation " + currOperation.token
                + " at position " + (currOperation.pos + 1),
                operandString(operands.length));
        }
        let index = stack[stackPos].pos;
        stack.splice(stackPos);
        stack.push(new Pair(new OPERATIONS[currOperation.token].operation(...operandTokens), index));
    }

    while (true) {
        skipWhitespaces();
        if (ind >= expr.length) {
            break;
        }
        // parse ')'
        if (expr[ind] === ')') {
            calc();
            ind++;
            continue;
        }

        // parse '('
        if (expr[ind] === '(') {
            stack.push(new Pair('(', ind));
            ind++;
            continue;
        }

        // parse operations/variables/numbers
        let idPos = ind;
        let identifier = getIdentifier(predicateIdentifier);
        let number = parseFloat(identifier);
        if (identifier in OPERATIONS) {
            stack.push(new Pair(identifier, idPos));
        } else if (identifier in VARIABLES) {
            stack.push(new Pair(VARIABLES[identifier], idPos));
        } else if (!isNaN(number) && number.toString() === identifier.toString()) {
            stack.push(new Pair(new Const(number), idPos));
        } else {
            throw new ParserError(undefined, "unexpected token " + wrap(identifier), idPos);
        }
    }

    skipWhitespaces();
    if (ind !== expr.length) {
        throw new ParserError("end of expression", wrap(expr[ind]), ind);
    } else if (stack.length > 1) {
        throw new ParserError("expression of the correct form");
    }
    let res = stack.pop();
    if (!check(res.token)) {
        throw new ParserError(undefined, "unexpected token " + wrap(res.token), res.pos);
    }
    return res.token;
}

function parsePrefix(expression) {
    return parsePrefPost(expression, (x) => x.splice(1));
}

function parsePostfix(expression) {
    return parsePrefPost(expression, (x) => x.splice(0, x.length - 1));
}
