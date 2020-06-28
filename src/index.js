/*
This example shows how to retrieve a list of local variable names.
*/

const acorn = require("acorn")
const astravel = require("../dist/astravel.debug")

const ignore = Function.prototype

const traveler = astravel.makeTraveler({
  FunctionDeclaration: function FunctionDeclaration(node, state) {
    state.names.push(node.id.name)
  },
  BlockStatement: function BlockStatement(node, state) {
    if (!state.inBlock) {
      state.inBlock = true
      this.super.BlockStatement.call(this, node, state)
      state.inBlock = false
    } else {
      this.super.BlockStatement.call(this, node, state)
    }
  },
  VariableDeclaration: function VariableDeclaration(node, state) {
    if ((state.inBlock && node.kind === "var") || !state.inBlock) {
      state.inDeclaration = true
      // is this just recursion?
      this.super.VariableDeclaration.call(this, node, state)
      state.inDeclaration = false
    }
  },
  VariableDeclarator: function VariableDeclarator(node, state) {
    this.go(node.id, state)
  },
  ObjectPattern: function ObjectPattern(node, state) {
    if (state.inDeclaration) this.super.ObjectPattern.call(this, node, state)
  },
  ArrayPattern: function ArrayPattern(node, state) {
    if (state.inDeclaration) this.super.ArrayPattern.call(this, node, state)
  },
  Property: function Property(node, state) {
    if (state.inDeclaration) this.go(node.value, state)
  },
  Identifier: function Identifier(node, state) {
    if (state.inDeclaration) state.names.push(node.name)
  },
  FunctionExpression: ignore,
  ArrowFunctionExpression: ignore
})

function getLocalVariableNames(raw) {
  const state = {
    inBlock: false,
    inDeclaration: false,
    names: []
  }
  traveler.go(raw, state)
  // Filter duplicate names
  return state.names.filter((value, index, list) => {
    return list.indexOf(value) === index
  })
}

const code =
  [
    "var a = 1, b = 2;",
    "var a = 1;",
    "let {x, y} = {x: 0, y: 0};",
    "const Y = 4",
    "function add(a, b) {return a + b;}",
    "if (a > b) {",
    "   let c = 5;",
    "   var [d] = someArray, {e: f} = someObject;",
    "}",
    "g = a + b;"
  ].join("\n") + "\n"

const ast = acorn.parse(code, { ecmaVersion: 6 })

console.log(code)
console.log("Local variables:", getLocalVariableNames(ast).join(", "))
