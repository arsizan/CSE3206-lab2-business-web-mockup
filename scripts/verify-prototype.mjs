import assert from "node:assert/strict"
import { connectBrowser } from "./browser.mjs"

const browser = await connectBrowser()
const click = async (selector) =>
  browser.evaluate(
    `document.querySelector(${JSON.stringify(selector)}).click()`,
  )
try {
  await browser.size(1440, 1000)
  await browser.open()
  await browser.screenshot("/tmp/northline-desktop.png")
  const home = await browser.evaluate(`({
    heading: document.querySelector('h1').innerText,
    images: [...document.images].every(image => image.complete && image.naturalWidth > 0),
    services: document.querySelectorAll('.service-card').length,
    overflow: document.documentElement.scrollWidth > window.innerWidth
  })`)
  assert.match(home.heading, /Clarity for today/)
  assert.equal(home.images, true)
  assert.equal(home.services, 3)
  assert.equal(home.overflow, false)

  for (const page of ["about", "services", "contact"]) {
    await browser.open(page)
    assert.equal(
      await browser.evaluate('document.querySelectorAll("h1").length'),
      1,
    )
    assert.equal(
      await browser.evaluate(
        'document.querySelector(".main-nav [aria-current=page]").getAttribute("href")',
      ),
      `#${page}`,
    )
    assert.equal(
      await browser.evaluate(
        "document.documentElement.scrollWidth > innerWidth",
      ),
      false,
    )
  }
  await browser.open("services")
  await click(".faq-item:nth-child(2) button")
  assert.equal(
    await browser.evaluate('document.querySelector("#faq-1").hidden'),
    false,
  )
  await click(".faq-item:nth-child(2) button")
  assert.equal(
    await browser.evaluate('document.querySelector("#faq-1").hidden'),
    true,
  )

  await browser.open("contact")
  assert.equal(
    await browser.evaluate('document.querySelector("form").checkValidity()'),
    false,
  )
  await browser.evaluate(`document.querySelector('#contact-name').value = 'Alex Morgan';
    document.querySelector('#contact-email').value = 'alex@example.com';
    document.querySelector('#contact-message').value = 'I would like to discuss our next chapter.';
    document.querySelector('form').requestSubmit();`)
  assert.match(
    await browser.evaluate('document.querySelector(".form-success").innerText'),
    /Alex/,
  )
  assert.match(
    await browser.evaluate('document.querySelector(".form-success").innerText'),
    /not been sent or stored/,
  )
  await click(".form-success button")
  assert.equal(await browser.evaluate('!!document.querySelector("form")'), true)

  await browser.open()
  await click(".toolbar-download")
  assert.equal(
    await browser.evaluate('document.querySelector("dialog").open'),
    true,
  )
  assert.equal(
    await browser.evaluate(
      'document.querySelector("dialog a[download]").getAttribute("href")',
    ),
    "/downloads/northline-lab-02.zip",
  )
  await click(".modal-close")
  assert.equal(
    await browser.evaluate('!!document.querySelector("dialog")'),
    false,
  )

  await click('[aria-label="Mobile preview"]')
  assert.equal(
    await browser.evaluate(
      'Math.round(document.querySelector(".website").getBoundingClientRect().width)',
    ),
    390,
  )
  assert.equal(
    await browser.evaluate(
      'getComputedStyle(document.querySelector(".mobile-menu-button")).display',
    ),
    "flex",
  )
  await click(".wireframe-toggle")
  assert.equal(
    await browser.evaluate(
      'document.querySelector(".website").classList.contains("is-wireframe")',
    ),
    true,
  )
  await click(".wireframe-toggle")

  await browser.size(390, 844)
  await browser.open()
  await browser.screenshot("/tmp/northline-mobile.png")
  await click(".mobile-menu-button")
  assert.equal(
    await browser.evaluate(
      'document.querySelector(".mobile-menu-button").getAttribute("aria-expanded")',
    ),
    "true",
  )
  await click('.main-nav a[href="#about"]')
  assert.match(
    await browser.evaluate('document.querySelector("h1").innerText'),
    /Good people/,
  )
  assert.equal(
    await browser.evaluate(
      'document.querySelector(".mobile-menu-button").getAttribute("aria-expanded")',
    ),
    "false",
  )

  for (const width of [320, 390, 768, 1024, 1440]) {
    await browser.size(width, 900)
    for (const page of ["home", "about", "services", "contact"]) {
      await browser.open(page)
      assert.equal(
        await browser.evaluate(
          "document.documentElement.scrollWidth > innerWidth",
        ),
        false,
        `${page} overflows at ${width}px`,
      )
    }
  }
  assert.deepEqual(browser.errors, [])
  console.log(
    "PASS: all four pages at five viewport sizes; navigation; mobile menu and preview; wireframe mode; FAQ; form validation and demo completion; download dialog; no runtime exceptions.",
  )
} finally {
  await browser.close()
}
