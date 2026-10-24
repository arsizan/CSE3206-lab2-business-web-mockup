/* The exporter prepends DATA: verified editable scene geometry and local image bytes. */

function rgb(value) {
  if (value.startsWith("#")) {
    const hex = value.slice(1)
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
      a: 1,
    }
  }
  const parts = value.match(/[\d.]+/g).map(Number)
  return {
    r: Math.min(1, parts[0] / 255),
    g: Math.min(1, parts[1] / 255),
    b: Math.min(1, parts[2] / 255),
    a: parts.length > 3 ? parts[3] : 1,
  }
}

/** @returns {SolidPaint[]} */
function fill(value) {
  const color = rgb(value)
  return [
    {
      type: "SOLID",
      color: { r: color.r, g: color.g, b: color.b },
      opacity: color.a,
    },
  ]
}

function decodeBase64(value) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  const clean = value.replace(/=+$/, "")
  const bytes = new Uint8Array(Math.floor((clean.length * 6) / 8))
  let bits = 0,
    buffer = 0,
    offset = 0
  for (let i = 0; i < clean.length; i++) {
    buffer = (buffer << 6) | alphabet.indexOf(clean[i])
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes[offset++] = (buffer >> bits) & 255
    }
  }
  return bytes
}

const fontMap = new Map()
const images = {}
const pendingLinks = []
const importedFrames = {}
let usedFallback = false

function requestedFont(item) {
  return {
    family: item.font || "Plus Jakarta Sans",
    style: item.italic
      ? "Italic"
      : item.weight >= 700
        ? "Bold"
        : item.weight >= 600
          ? "SemiBold"
          : item.weight >= 500
            ? "Medium"
            : "Regular",
  }
}

async function loadFonts() {
  const requested = new Map()
  function visit(items) {
    for (const item of items) {
      if (item.type === "text") {
        const font = requestedFont(item)
        requested.set(`${font.family}/${font.style}`, font)
      }
      if (item.children) visit(item.children)
    }
  }
  for (const scene of DATA.scenes.concat(DATA.components)) visit(scene.nodes)
  for (const font of [
    { family: "Plus Jakarta Sans", style: "Regular" },
    { family: "Plus Jakarta Sans", style: "Medium" },
    { family: "Instrument Serif", style: "Regular" },
    { family: "Instrument Serif", style: "Italic" },
  ]) {
    requested.set(`${font.family}/${font.style}`, font)
  }
  await figma.loadFontAsync({ family: "Inter", style: "Regular" })
  for (const [key, font] of requested) {
    try {
      await figma.loadFontAsync(font)
      fontMap.set(key, font)
    } catch (error) {
      if (font.style === "SemiBold") {
        try {
          const alternate = { family: font.family, style: "Semi Bold" }
          await figma.loadFontAsync(alternate)
          fontMap.set(key, alternate)
          continue
        } catch (ignored) {}
      }
      fontMap.set(key, { family: "Inter", style: "Regular" })
      usedFallback = true
    }
  }
}

function fontFor(item) {
  const requested = requestedFont(item)
  return (
    fontMap.get(`${requested.family}/${requested.style}`) || {
      family: "Inter",
      style: "Regular",
    }
  )
}

function paintRecord(item, parent, originX, originY, device, fidelity) {
  let node
  if (item.type === "group") {
    node = figma.createFrame()
    node.fills = []
    node.clipsContent = false
    node.resize(Math.max(1, item.width), Math.max(1, item.height))
    parent.appendChild(node)
    for (const child of item.children)
      paintRecord(child, node, item.x, item.y, device, fidelity)
    if (item.link)
      pendingLinks.push({ node, target: item.link, device, fidelity })
  } else if (item.type === "rect") {
    node = figma.createRectangle()
    node.resize(Math.max(0.01, item.width), Math.max(0.01, item.height))
    node.fills = fill(item.fill)
    node.cornerRadius = Math.min(
      item.radius || 0,
      item.width / 2,
      item.height / 2,
    )
    parent.appendChild(node)
  } else if (item.type === "image") {
    node = figma.createRectangle()
    node.resize(Math.max(1, item.width), Math.max(1, item.height))
    node.fills = [
      { type: "IMAGE", imageHash: images[item.asset], scaleMode: "FILL" },
    ]
    node.cornerRadius = item.radius || 0
    parent.appendChild(node)
  } else if (item.type === "svg") {
    node = figma.createNodeFromSvg(item.svg)
    node.resize(Math.max(0.01, item.width), Math.max(0.01, item.height))
    parent.appendChild(node)
  } else if (item.type === "text") {
    node = figma.createText()
    node.fontName = fontFor(item)
    node.fontSize = item.size
    node.characters = item.text
    node.fills = fill(item.color)
    node.letterSpacing = { unit: "PIXELS", value: item.letterSpacing || 0 }
    node.lineHeight = { unit: "PIXELS", value: item.height || item.lineHeight }
    node.textAutoResize = "WIDTH_AND_HEIGHT"
    parent.appendChild(node)
  } else return null
  node.name = item.name || item.type
  node.x = item.x - originX
  node.y = item.y - originY
  return node
}

function addText(parent, content, x, y, size, color, family, italic) {
  const node = figma.createText()
  node.fontName = fontFor({
    font: family || "Plus Jakarta Sans",
    weight: 400,
    italic: !!italic,
  })
  node.fontSize = size
  node.characters = content
  node.fills = fill(color || "#0F3D33")
  node.textAutoResize = "WIDTH_AND_HEIGHT"
  node.x = x
  node.y = y
  parent.appendChild(node)
  return node
}

async function addDesignSystem(page) {
  const board = figma.createFrame()
  board.name = "Northline / Brand & reusable components"
  board.resize(1440, 2000)
  board.fills = fill("#F6F5F0")
  page.appendChild(board)
  addText(board, "NORTHLINE / DESIGN SYSTEM", 70, 55, 11)
  addText(
    board,
    "A little perspective.\nA world of possibility.",
    70,
    95,
    70,
    "#0F3D33",
    "Instrument Serif",
  )
  addText(board, "01 / COLOUR PALETTE", 70, 310, 10)
  const palette = [
    ["Forest", "#0F3D33"],
    ["Ivory", "#F6F5F0"],
    ["Terracotta", "#C85A32"],
    ["Warm grey", "#E9E6DD"],
    ["Ink", "#111615"],
    ["Muted text", "#5A625E"],
    ["Border", "#DCD8CD"],
  ]
  for (let index = 0; index < palette.length; index++) {
    const [name, color] = palette[index]
    const style = figma.createPaintStyle()
    style.name = `Northline / ${name}`
    style.paints = fill(color)
    const swatch = figma.createRectangle()
    swatch.name = `Colour / ${name}`
    swatch.resize(160, 95)
    swatch.x = 70 + index * 185
    swatch.y = 350
    swatch.fills = fill(color)
    swatch.strokes = fill("#DCD8CD")
    swatch.strokeWeight = 1
    swatch.cornerRadius = 3
    board.appendChild(swatch)
    addText(board, name, swatch.x, 458, 12)
    addText(board, color, swatch.x, 480, 10, "#5A625E")
  }
  addText(board, "02 / TYPOGRAPHY", 70, 550, 10)
  /** @type {[string, string, string, number, boolean][]} */
  const typography = [
    [
      "Display / Instrument Serif",
      "Clarity for today.",
      "Instrument Serif",
      72,
      false,
    ],
    [
      "Display / Instrument Serif Italic",
      "Confidence for what’s next.",
      "Instrument Serif",
      55,
      true,
    ],
    [
      "Body / Plus Jakarta Sans",
      "Good businesses don’t stand still. We help you find your direction.",
      "Plus Jakarta Sans",
      16,
      false,
    ],
    [
      "Label / Plus Jakarta Sans",
      "A FRESH PERSPECTIVE FOR YOUR BUSINESS",
      "Plus Jakarta Sans",
      10,
      false,
    ],
    [
      "Detail / JetBrains Mono",
      "01 / THOUGHTFULLY DESIGNED",
      "JetBrains Mono",
      10,
      false,
    ],
  ]
  let y = 590
  for (const [name, sample, family, size, italic] of typography) {
    addText(board, name, 70, y, 9, "#5A625E")
    addText(board, sample, 70, y + 24, size, "#0F3D33", family, italic)
    const style = figma.createTextStyle()
    style.name = `Northline / ${name}`
    style.fontName = fontFor({ font: family, weight: 400, italic })
    style.fontSize = size
    style.lineHeight = { unit: "PERCENT", value: 120 }
    y += size + 60
  }
  addText(board, "03 / BUTTONS · REUSABLE VARIANTS", 70, 1180, 10)
  const variants = []
  const variantsData = [
    ["Primary", "#0F3D33", "#F6F5F0"],
    ["Secondary", "#F6F5F0", "#0F3D33"],
    ["Light", "#E9E6DD", "#0F3D33"],
  ]
  for (let index = 0; index < variantsData.length; index++) {
    const [name, background, text] = variantsData[index]
    const component = figma.createComponent()
    component.name = `Variant=${name}`
    component.resize(245, 50)
    component.fills = fill(background)
    component.cornerRadius = 3
    if (name === "Secondary") {
      component.strokes = fill("#DCD8CD")
      component.strokeWeight = 1
    }
    addText(component, "Let’s find your next step", 20, 16, 12, text)
    const arrow = figma.createNodeFromSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${text}" stroke-width="1.5"><path d="M7 17 17 7M7 7h10v10"/></svg>`,
    )
    component.appendChild(arrow)
    arrow.x = 205
    arrow.y = 16
    page.appendChild(component)
    component.x = 70 + index * 285
    component.y = 1220
    variants.push(component)
  }
  const set = figma.combineAsVariants(variants, board)
  set.name = "Button"
  set.x = 70
  set.y = 1220
  set.layoutMode = "HORIZONTAL"
  set.primaryAxisSizingMode = "AUTO"
  set.counterAxisSizingMode = "AUTO"
  set.itemSpacing = 25
  set.paddingTop = 20
  set.paddingBottom = 20
  set.paddingLeft = 20
  set.paddingRight = 20
  addText(
    board,
    "SPACING / 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64 · 80",
    70,
    1380,
    10,
    "#5A625E",
  )
  addText(
    board,
    "VIEWPORTS / Desktop 1440 px · Mobile 390 px",
    70,
    1410,
    10,
    "#5A625E",
  )
  addText(board, "04 / REUSABLE COMPONENT LIBRARY", 70, 1480, 10)
  addText(
    board,
    "Native, editable component masters. Duplicate or create instances to extend the design.",
    70,
    1510,
    12,
    "#5A625E",
  )
  let componentY = 2080
  for (const source of DATA.components) {
    const component = figma.createComponent()
    component.name = source.name
    component.resize(source.width, source.height)
    component.fills = []
    component.clipsContent = false
    page.appendChild(component)
    component.x = 0
    component.y = componentY
    for (const record of source.nodes)
      paintRecord(record, component, 0, 0, "desktop", "component")
    const instance = component.createInstance()
    page.appendChild(instance)
    instance.x = source.width + 130
    instance.y = componentY
    instance.name = `${source.name} / Example instance`
    componentY += Math.max(140, source.height) + 90
  }
  return board
}

async function importDesign() {
  figma.notify("Preparing Northline’s editable layouts…", { timeout: 5000 })
  await loadFonts()
  for (const name of Object.keys(DATA.assets))
    images[name] = figma.createImage(decodeBase64(DATA.assets[name])).hash
  const pages = {}
  for (const [key, name] of [
    ["high-fidelity", "01 — High fidelity"],
    ["wireframe", "02 — Wireframes"],
    ["system", "03 — Design system"],
  ]) {
    pages[key] = figma.createPage()
    pages[key].name = name
  }
  for (const fidelity of ["high-fidelity", "wireframe"]) {
    const sources = DATA.scenes.filter((scene) => scene.fidelity === fidelity)
    const desktopHeight = Math.max(
      ...sources
        .filter((scene) => scene.device === "desktop")
        .map((scene) => scene.height),
    )
    let desktopIndex = 0,
      mobileIndex = 0
    for (const scene of sources) {
      const frame = figma.createFrame()
      frame.name = scene.name
      frame.resize(scene.width, scene.height)
      frame.fills = fill(scene.background)
      frame.clipsContent = true
      pages[fidelity].appendChild(frame)
      frame.x =
        scene.device === "desktop" ? desktopIndex++ * 1580 : mobileIndex++ * 530
      frame.y = scene.device === "desktop" ? 0 : desktopHeight + 240
      frame.setPluginData(
        "northline-source",
        JSON.stringify({ page: scene.page, device: scene.device, fidelity }),
      )
      for (const record of scene.nodes)
        paintRecord(record, frame, 0, 0, scene.device, fidelity)
      importedFrames[`${fidelity}/${scene.device}/${scene.page}`] = frame
    }
  }
  await addDesignSystem(pages.system)
  for (const link of pendingLinks) {
    const destination =
      importedFrames[`${link.fidelity}/${link.device}/${link.target}`]
    if (!destination || typeof link.node.setReactionsAsync !== "function")
      continue
    await link.node.setReactionsAsync([
      {
        trigger: { type: "ON_CLICK" },
        actions: [
          {
            type: "NODE",
            destinationId: destination.id,
            navigation: "NAVIGATE",
            transition: null,
            preserveScrollPosition: false,
          },
        ],
      },
    ])
  }
  await figma.setCurrentPageAsync(pages["high-fidelity"])
  figma.viewport.scrollAndZoomIntoView([
    importedFrames["high-fidelity/desktop/home"],
  ])
  figma.closePlugin(
    `Created 16 editable layouts, shared styles and reusable components.${
      usedFallback ? " Some unavailable fonts were replaced with Inter." : ""
    } Use File → Save local copy to download your .fig file.`,
  )
}

importDesign().catch((error) => {
  console.error(error)
  figma.closePlugin(
    `Import stopped: ${error.message}. Existing file content has not been changed. You can also import the supplied SVG layouts.`,
  )
})
