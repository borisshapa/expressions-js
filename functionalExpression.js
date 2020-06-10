"use strict";

let pi = () => Math.PI;
let e = () => Math.E;

let CONST = {
    "pi": pi,
    "e": e
};
let VARS = ["x", "y", "z"];

let variable = function(varName) {
    const index = VARS.indexOf(varName);
    return (...values) => values[index];
};
let cnst = (val) => () => val;

let operation = (op) => (...args) => (...vars) => op(...args.map(f => f(...vars)));
let add = operation((a, b) => a + b);
let subtract = operation((a, b) => a - b);
let multiply = operation((a, b) => a * b);
let divide = operation((a, b) => a / b);
let negate = operation((a) => -a);
let med3 = operation((...args) => args.sort((a, b) => a - b)[Math.floor(args.length / 2)]);
let avg5 = operation((...args) => args.reduce((a, b) => a + b) / args.length);

function Operation(name, cntArgs) {
    this.op = name;
    this.cnt = cntArgs;
}

let OPERATIONS = {
    "-" : new Operation(subtract, 2),
    "+" : new Operation(add, 2),
    "/" : new Operation(divide, 2),
    "*" : new Operation(multiply, 2),
    "negate" : new Operation(negate, 1),
    "med3" : new Operation(med3, 3),
    "avg5" : new Operation(avg5, 5)
};

const VARIABLES = {};
for (const vars of VARS) {
    VARIABLES[vars] = variable(vars);
}

function parse(expression) {
    let stack = [];
    let tokens = expression.trim().split(/\s+/);

    for (const token of tokens) {
        if (token in OPERATIONS) {
            let op = OPERATIONS[token];
            stack.push(op.op(...stack.splice(-op.cnt)));
        } else if (token in CONST) {
            stack.push(CONST[token]);
        } else if (token in VARIABLES) {
            stack.push(VARIABLES[token]);
        } else {
            stack.push(cnst(Number(token)));
        }
    }

    return stack.pop();
}