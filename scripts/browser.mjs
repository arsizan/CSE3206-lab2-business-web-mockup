import { writeFile } from "node:fs/promises"

// Connects to a headless Chromium instance; never starts a development server.
export async function connectBrowser() {
  const target = await fetch("http://localhost:9222/json/new?about:blank", {
    method: "PUT",
  }).then((response) => response.json())
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true })
    socket.addEventListener("error", reject, { once: true })
  })
  let nextId = 0
  let navigationIndex = 0
  const pending = new Map()
  const errors = []
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data)
    if (message.method === "Runtime.exceptionThrown")
      errors.push(message.params.exceptionDetails)
    if (!message.id) return
    const task = pending.get(message.id)
    if (!task) return
    pending.delete(message.id)
    if (message.error) task.reject(new Error(JSON.stringify(message.error)))
    else task.resolve(message.result)
  })
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId
      pending.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params }))
    })
  const evaluate = async (expression) => {
    const result = await call("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description ??
          JSON.stringify(result.exceptionDetails),
      )
    return result.result.value
  }
  await call("Page.enable")
  await call("Runtime.enable")
  return {
    call,
    evaluate,
    errors,
    async size(width, height = 1000) {
      await call("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false,
      })
    },
    async open(hash = "home") {
      const query = `?render=${++navigationIndex}`
      await call("Page.navigate", {
        url: `http://localhost:3000/${query}#${hash}`,
      })
      for (let index = 0; index < 100; index++) {
        const ready = await evaluate(
          `location.search === ${JSON.stringify(query)} && !!document.querySelector(".website h1") && document.querySelector('.main-nav [aria-current="page"]')?.getAttribute('href') === ${JSON.stringify(`#${hash}`)}`,
        ).catch(() => false)
        if (ready) break
        if (index === 99) throw new Error(`The ${hash} page did not render`)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      await evaluate(
        'document.fonts.ready.then(() => Promise.all([...document.images].map(image => { image.loading = "eager"; return image.decode().catch(() => {}) })))',
      )
    },
    async screenshot(path, full = false) {
      const metrics = await call("Page.getLayoutMetrics")
      const result = await call("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: full,
        ...(full
          ? {
              clip: {
                x: 0,
                y: 0,
                width: metrics.cssContentSize.width,
                height: metrics.cssContentSize.height,
                scale: 1,
              },
            }
          : {}),
      })
      await writeFile(path, Buffer.from(result.data, "base64"))
    },
    async close() {
      socket.close()
      await fetch(`http://localhost:9222/json/close/${target.id}`)
    },
  }
}
