import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import vm from "node:vm"

// A sandbox smoke test, not a substitute for opening the result in Figma.
const source = await readFile(
  "/tmp/northline-handoff/figma-importer/code.js",
  "utf8",
)
const nodes = []
const pages = []
const styles = []
const fonts = new Set()
let sequence = 0
let finish
const finished = new Promise((resolve) => {
  finish = resolve
})

class Node {
  constructor(type) {
    this.type = type
    this.id = `${++sequence}:1`
    this.children = []
    this.width = 100
    this.height = 100
    this.x = 0
    this.y = 0
    nodes.push(this)
  }
  appendChild(child) {
    if (child.parent)
      child.parent.children = child.parent.children.filter(
        (item) => item !== child,
      )
    child.parent = this
    this.children.push(child)
  }
  resize(width, height) {
    assert.ok(Number.isFinite(width) && width > 0, `Invalid width: ${width}`)
    assert.ok(
      Number.isFinite(height) && height > 0,
      `Invalid height: ${height}`,
    )
    this.width = width
    this.height = height
  }
  set fontName(value) {
    assert.ok(
      fonts.has(`${value.family}/${value.style}`),
      `Font not loaded: ${JSON.stringify(value)}`,
    )
    this._fontName = value
  }
  get fontName() {
    return this._fontName
  }
  set fills(value) {
    for (const paint of value) {
      assert.ok(["SOLID", "IMAGE"].includes(paint.type))
      if (paint.type === "SOLID")
        for (const channel of Object.values(paint.color))
          assert.ok(Number.isFinite(channel) && channel >= 0 && channel <= 1)
      if (paint.type === "IMAGE") assert.ok(paint.imageHash)
    }
    this._fills = value
  }
  get fills() {
    return this._fills || []
  }
  setPluginData(key, value) {
    this[key] = value
  }
  createInstance() {
    const instance = new Node("INSTANCE")
    instance.componentId = this.id
    return instance
  }
  async setReactionsAsync(reactions) {
    for (const reaction of reactions) {
      assert.equal(reaction.trigger.type, "ON_CLICK")
      assert.ok(
        nodes.some((node) => node.id === reaction.actions[0].destinationId),
      )
    }
    this.reactions = reactions
  }
}

const figma = {
  async loadFontAsync(font) {
    fonts.add(`${font.family}/${font.style}`)
  },
  createFrame: () => new Node("FRAME"),
  createRectangle: () => new Node("RECTANGLE"),
  createText: () => new Node("TEXT"),
  createComponent: () => new Node("COMPONENT"),
  createPage() {
    const page = new Node("PAGE")
    pages.push(page)
    return page
  },
  createPaintStyle() {
    const style = { type: "PAINT" }
    styles.push(style)
    return style
  },
  createTextStyle() {
    const style = { type: "TEXT" }
    styles.push(style)
    return style
  },
  createImage(bytes) {
    assert.equal(bytes[0], 255)
    assert.equal(bytes[1], 216)
    return { hash: `image-${bytes.length}` }
  },
  createNodeFromSvg(svg) {
    assert.match(svg, /^<svg /)
    return new Node("SVG")
  },
  combineAsVariants(variants, parent) {
    const set = new Node("COMPONENT_SET")
    parent.appendChild(set)
    for (const variant of variants) set.appendChild(variant)
    return set
  },
  async setCurrentPageAsync(page) {
    figma.currentPage = page
  },
  viewport: { scrollAndZoomIntoView() {} },
  notify() {},
  closePlugin(message) {
    finish(message)
  },
}

const context = vm.createContext({
  figma,
  console,
  Uint8Array,
  Map,
  Math,
  JSON,
})
vm.runInContext(source, context, { timeout: 10000 })
const message = await finished
assert.match(message, /^Created 16 editable layouts/)
assert.equal(pages.length, 3)
assert.equal(pages[0].children.length, 8)
assert.equal(pages[1].children.length, 8)
assert.equal(nodes.filter((node) => node.type === "COMPONENT").length, 8)
assert.equal(nodes.filter((node) => node.type === "INSTANCE").length, 5)
assert.ok(nodes.filter((node) => node.type === "TEXT").length > 1000)
assert.equal(styles.filter((style) => style.type === "PAINT").length, 7)
assert.equal(styles.filter((style) => style.type === "TEXT").length, 5)
assert.ok(nodes.filter((node) => node.reactions?.length).length >= 100)

const data = vm.runInContext("DATA", context)
assert.equal(data.scenes.length, 16)
for (const scene of data.scenes) {
  assert.equal(scene.width, scene.device === "desktop" ? 1440 : 390)
  const records = []
  const flatten = (items) => {
    for (const item of items) {
      records.push(item)
      if (item.children) flatten(item.children)
    }
  }
  flatten(scene.nodes)
  assert.ok(records.some((item) => item.type === "text"))
  assert.equal(
    records.some((item) => item.type === "image"),
    scene.fidelity === "high-fidelity" && scene.page !== "services",
  )
}
console.log(
  `PASS: importer sandbox smoke test; 16 screens across 3 pages; 8 components; 5 instances; ${nodes.filter((node) => node.type === "TEXT").length} editable text nodes; 12 shared styles; prototype links; correct high/low-fidelity separation. Actual Figma import still requires Figma desktop.`,
)
