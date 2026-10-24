import { mkdir, readFile, writeFile, cp, rm } from "node:fs/promises"
import { execFileSync } from "node:child_process"
import { connectBrowser } from "./browser.mjs"

// Captures the actual rendered layouts as editable geometry, not page screenshots.
function captureLayout(selector = ".website") {
  const root = document.querySelector(selector)
  if (!root) throw new Error(`Missing layout: ${selector}`)
  const origin = root.getBoundingClientRect()
  const canvas = document.createElement("canvas").getContext("2d")
  const round = (value) => Math.round(value * 100) / 100
  const visibleColor = (color) =>
    color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)"
  const position = (rect) => ({
    x: round(rect.left - origin.left),
    y: round(rect.top - origin.top),
    width: round(rect.width),
    height: round(rect.height),
  })
  const records = []
  let counter = 0
  const grouped =
    "header, footer, section, article, nav, form, .hero-copy, .hero-visual, .perspective-card, .footer-top, .footer-brand, .footer-contact, .contact-info, .contact-form-card, .field, .button, .brand, .about-preview-copy, .service-detail-body"

  function textStyle(style) {
    const family = style.fontFamily.split(",")[0].replace(/['"]/g, "")
    return {
      font: family,
      size: parseFloat(style.fontSize),
      weight: parseInt(style.fontWeight) || 400,
      italic: style.fontStyle === "italic",
      color: style.color,
      lineHeight:
        parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2,
      letterSpacing: parseFloat(style.letterSpacing) || 0,
    }
  }

  function exportText(textNode, output) {
    const style = getComputedStyle(textNode.parentElement)
    if (style.visibility === "hidden" || !textNode.textContent.trim()) return
    const source = textNode.textContent
    const range = document.createRange()
    const lines = []
    let line = null
    for (let index = 0; index < source.length; index++) {
      range.setStart(textNode, index)
      range.setEnd(textNode, index + 1)
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 && /\s/.test(source[index])) continue
      if (!line || Math.abs(line.top - rect.top) > 2) {
        line = {
          text: source[index],
          left: rect.left,
          top: rect.top,
          right: rect.right,
          height: rect.height,
        }
        lines.push(line)
      } else {
        line.text += source[index]
        line.right = Math.max(line.right, rect.right)
      }
    }
    for (const line of lines) {
      if (!line.text.trim()) continue
      const properties = textStyle(style)
      canvas.font = `${
        properties.italic ? "italic " : ""
      }${properties.weight} ${properties.size}px "${properties.font}"`
      const metrics = canvas.measureText(line.text)
      output.push({
        type: "text",
        name: line.text.trim().slice(0, 75),
        text:
          style.textTransform === "uppercase"
            ? line.text.toUpperCase()
            : line.text,
        x: round(line.left - origin.left),
        y: round(line.top - origin.top),
        width: round(Math.max(1, line.right - line.left)),
        height: round(line.height),
        baseline: round(
          metrics.fontBoundingBoxAscent || properties.size * 0.85,
        ),
        ...properties,
      })
    }
  }

  function visit(element, output) {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      rect.width <= 0 ||
      rect.height <= 0 ||
      element.matches(".skip-link, option, script")
    )
      return
    if (rect.bottom < origin.top || rect.top > origin.bottom) return
    const bounds = position(rect)
    let children = output
    if (element !== root && element.matches(grouped)) {
      const name =
        element.getAttribute("aria-label") ||
        element.className?.toString().split(" ")[0] ||
        element.tagName.toLowerCase()
      const group = { type: "group", name, ...bounds, children: [] }
      const href = element.getAttribute("href")
      if (href && /^#(home|about|services|contact)$/.test(href))
        group.link = href.slice(1)
      else if (
        element.matches("button") &&
        /let’s|conversation|next step|let's/i.test(element.innerText)
      )
        group.link = "contact"
      else if (
        element.matches("button") &&
        /services|way forward/i.test(element.innerText)
      )
        group.link = "services"
      children.push(group)
      children = group.children
    }
    if (Number(style.opacity) < 1 && Number(style.opacity) === 0) return
    if (visibleColor(style.backgroundColor)) {
      children.push({
        type: "rect",
        name: "Background",
        ...bounds,
        fill: style.backgroundColor,
        radius: Math.min(
          parseFloat(style.borderTopLeftRadius) || 0,
          rect.height / 2,
          rect.width / 2,
        ),
      })
    }
    for (const [side, edge] of [
      ["Top", "top"],
      ["Bottom", "bottom"],
      ["Left", "left"],
      ["Right", "right"],
    ]) {
      const width = parseFloat(style[`border${side}Width`])
      const color = style[`border${side}Color`]
      if (
        !width ||
        !visibleColor(color) ||
        style[`border${side}Style`] === "none"
      )
        continue
      const vertical = edge === "left" || edge === "right"
      children.push({
        type: "rect",
        name: `Border / ${edge}`,
        fill: color,
        radius: 0,
        x: bounds.x + (edge === "right" ? bounds.width - width : 0),
        y: bounds.y + (edge === "bottom" ? bounds.height - width : 0),
        width: vertical ? width : bounds.width,
        height: vertical ? bounds.height : width,
      })
    }
    if (element.tagName.toLowerCase() === "svg") {
      const svg = element.cloneNode(true)
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
      svg.setAttribute("width", String(bounds.width))
      svg.setAttribute("height", String(bounds.height))
      svg.setAttribute("color", style.color)
      svg.setAttribute(
        "stroke",
        element.getAttribute("stroke") === "none" ? "none" : style.color,
      )
      svg.setAttribute("stroke-width", style.strokeWidth)
      svg.removeAttribute("class")
      const markup = svg.outerHTML.replaceAll("currentColor", style.color)
      children.push({
        type: "svg",
        name: `Icon / ${element.getAttribute("class") || "vector"}`,
        ...bounds,
        svg: markup,
      })
      return
    }
    if (element.tagName === "IMG") {
      if (
        !root.closest(".is-wireframe") &&
        !root.classList.contains("is-wireframe")
      ) {
        children.push({
          type: "image",
          name: element.alt,
          ...bounds,
          asset: element.src.includes("team.jpg") ? "team" : "studio",
          radius:
            parseFloat(
              getComputedStyle(element.parentElement).borderTopLeftRadius,
            ) || 0,
        })
      }
      return
    }
    if (element.matches("input, textarea, select")) {
      const value = element.matches("select")
        ? element.selectedOptions[0]?.textContent
        : element.value || element.placeholder
      const properties = textStyle(style)
      const x = bounds.x + parseFloat(style.paddingLeft) + 1
      let y = bounds.y + parseFloat(style.paddingTop) + 1
      const available =
        bounds.width -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight) -
        2
      canvas.font = `${properties.weight} ${properties.size}px "${properties.font}"`
      let line = ""
      for (const word of (value || "").split(" ")) {
        if (canvas.measureText(`${line} ${word}`).width > available && line) {
          children.push({
            type: "text",
            name: "Field value",
            text: line,
            x,
            y,
            width: available,
            height: properties.lineHeight,
            baseline: properties.size * 0.85,
            ...properties,
          })
          y += properties.lineHeight
          line = word
        } else line = `${line} ${word}`.trim()
      }
      if (line)
        children.push({
          type: "text",
          name: "Field value",
          text: line,
          x,
          y,
          width: available,
          height: properties.lineHeight,
          baseline: properties.size * 0.85,
          ...properties,
          color: element.value ? style.color : "rgb(124, 129, 122)",
        })
      return
    }
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) exportText(child, children)
      else if (child.nodeType === Node.ELEMENT_NODE) visit(child, children)
    }
    if (
      element.matches(".photo") &&
      (root.classList.contains("is-wireframe") || root.closest(".is-wireframe"))
    ) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}"><path d="M0 0L${bounds.width} ${bounds.height}M${bounds.width} 0L0 ${bounds.height}" fill="none" stroke="#cccccc" stroke-width="1"/></svg>`
      children.push({
        type: "svg",
        name: "Image placeholder / diagonal guides",
        ...bounds,
        svg,
      })
      const label = (
        element.dataset.placeholder || "Image placeholder"
      ).toUpperCase()
      children.push({
        type: "text",
        name: "Image placeholder label",
        text: label,
        x: bounds.x + bounds.width / 2 - label.length * 3,
        y: bounds.y + bounds.height / 2 - 6,
        width: label.length * 7,
        height: 12,
        baseline: 9,
        font: "JetBrains Mono",
        size: 10,
        weight: 400,
        italic: false,
        color: "rgb(85, 85, 85)",
        lineHeight: 12,
        letterSpacing: 1,
      })
    }
    counter++
  }
  visit(root, records)
  return {
    width: round(origin.width),
    height: round(origin.height),
    background: getComputedStyle(root).backgroundColor,
    nodes: records,
    elementCount: counter,
  }
}

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")

function toSvg(scene, assets) {
  let unique = 0
  function shape(item) {
    if (item.type === "group")
      return `<g id="${escapeXml(item.name.replace(/[^a-zA-Z0-9-]/g, "-"))}-${++unique}">${item.children.map(shape).join("")}</g>`
    const bounds = `x="${item.x}" y="${item.y}" width="${Math.max(0.01, item.width)}" height="${Math.max(0.01, item.height)}"`
    if (item.type === "rect")
      return `<rect ${bounds} fill="${item.fill}" rx="${item.radius || 0}"/>`
    if (item.type === "image") {
      const id = `clip-${++unique}`
      return `<defs><clipPath id="${id}"><rect ${bounds} rx="${item.radius || 0}"/></clipPath></defs><image ${bounds} href="data:image/jpeg;base64,${assets[item.asset]}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`
    }
    if (item.type === "svg")
      return item.svg.replace("<svg ", `<svg x="${item.x}" y="${item.y}" `)
    if (item.type === "text")
      return `<text x="${item.x}" y="${item.y + item.baseline}" fill="${item.color}" font-family="${escapeXml(item.font)}" font-size="${item.size}" font-weight="${item.weight}" font-style="${
        item.italic ? "italic" : "normal"
      }" letter-spacing="${item.letterSpacing}" xml:space="preserve">${escapeXml(item.text)}</text>`
    return ""
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}"><title>${escapeXml(scene.name)} — Northline</title><rect width="${scene.width}" height="${scene.height}" fill="${scene.background}"/>${scene.nodes.map(shape).join("")}</svg>\n`
}

const browser = await connectBrowser()
const data = { scenes: [], components: [], assets: {} }
const staging = "/tmp/northline-handoff"
try {
  await rm(staging, { recursive: true, force: true })
  await mkdir(`${staging}/svg-layouts`, { recursive: true })
  await mkdir(`${staging}/figma-importer`, { recursive: true })
  for (const asset of ["team", "studio"])
    data.assets[asset] = (
      await readFile(`public/images/${asset}.jpg`)
    ).toString("base64")
  for (const fidelity of ["high-fidelity", "wireframe"]) {
    for (const [device, width] of [
      ["desktop", 1440],
      ["mobile", 390],
    ]) {
      await browser.size(width, 1000)
      for (const page of ["home", "about", "services", "contact"]) {
        await browser.open(page)
        if (fidelity === "wireframe")
          await browser.evaluate(
            `document.querySelector('.wireframe-toggle').click()`,
          )
        await browser.evaluate(
          "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
        )
        const wireframeActive = await browser.evaluate(
          'document.querySelector(".website").classList.contains("is-wireframe")',
        )
        if (wireframeActive !== (fidelity === "wireframe"))
          throw new Error(`Incorrect fidelity for ${page}`)
        const scene = await browser.evaluate(`(${captureLayout.toString()})()`)
        scene.page = page
        scene.device = device
        scene.fidelity = fidelity
        scene.name = `${page[0].toUpperCase() + page.slice(1)} / ${
          device === "desktop" ? "Desktop · 1440" : "Mobile · 390"
        }`
        data.scenes.push(scene)
        await writeFile(
          `${staging}/svg-layouts/${fidelity}-${device}-${page}.svg`,
          toSvg(scene, data.assets),
        )
        if (
          fidelity === "high-fidelity" &&
          device === "desktop" &&
          page === "home"
        ) {
          for (const [selector, name] of [
            [".site-header", "Navigation / Desktop"],
            [".service-card", "Card / Service"],
            [".perspective-card", "Card / Perspective"],
          ]) {
            data.components.push({
              ...(await browser.evaluate(
                `(${captureLayout.toString()})(${JSON.stringify(selector)})`,
              )),
              name,
            })
          }
        }
        if (
          fidelity === "high-fidelity" &&
          device === "desktop" &&
          page === "contact"
        ) {
          data.components.push({
            ...(await browser.evaluate(
              `(${captureLayout.toString()})('.field')`,
            )),
            name: "Field / Text input",
          })
        }
        if (
          fidelity === "high-fidelity" &&
          device === "mobile" &&
          page === "home"
        ) {
          data.components.push({
            ...(await browser.evaluate(
              `(${captureLayout.toString()})('.site-header')`,
            )),
            name: "Navigation / Mobile",
          })
        }
        console.log(
          `Exported ${fidelity} / ${scene.name}: ${scene.width} × ${scene.height}`,
        )
      }
    }
  }
  if (browser.errors.length)
    throw new Error(`Browser errors: ${JSON.stringify(browser.errors)}`)
  const template = await readFile(
    "design/figma-importer/importer.template.js",
    "utf8",
  )
  await writeFile(
    `${staging}/figma-importer/code.js`,
    `// Generated from the verified Northline website layouts. No network access required.\nconst DATA = ${JSON.stringify(data)};\n${template}`,
  )
  await cp(
    "design/figma-importer/manifest.json",
    `${staging}/figma-importer/manifest.json`,
  )
  await cp("design/README.md", `${staging}/README.md`)
  await cp(
    "design/lab-question-2-answer.md",
    `${staging}/lab-question-2-answer.md`,
  )
  await cp("public/images", `${staging}/images`, { recursive: true })
  await cp("public/fonts", `${staging}/fonts`, { recursive: true })
  await writeFile(
    `${staging}/design-tokens.json`,
    JSON.stringify(
      {
        colors: {
          background: "#F6F5F0",
          foreground: "#111615",
          primary: "#0F3D33",
          secondary: "#E9E6DD",
          muted: "#EFECE4",
          mutedForeground: "#5A625E",
          accent: "#C85A32",
          border: "#DCD8CD",
        },
        typography: {
          display: "Instrument Serif",
          body: "Plus Jakarta Sans",
          mono: "JetBrains Mono",
        },
        viewports: { desktop: 1440, mobile: 390 },
        spacing: [4, 8, 12, 16, 20, 24, 32, 48, 64, 80],
      },
      null,
      2,
    ),
  )
  await mkdir("public/downloads", { recursive: true })
  execFileSync("python", [
    "-c",
    'import shutil; shutil.make_archive("public/downloads/northline-lab-02", "zip", "/tmp/northline-handoff")',
  ])
  console.log(
    `Packaged ${data.scenes.length} editable layouts and ${data.components.length} reusable component sources in public/downloads/northline-lab-02.zip`,
  )
} finally {
  await browser.close()
}
