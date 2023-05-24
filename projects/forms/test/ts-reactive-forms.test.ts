import {JSDOM} from "jsdom";
import * as pkg from "../package.json";

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Test</title>
  </head>
  <body>
    <div>Test</div>
  </body>
</html>`;
// const dom = new JSDOM(html);
const dom = new JSDOM(html, {runScripts: "dangerously", resources: "usable"});
/**
 * version
 * resetSettings
 * isClient
 * htmlCountDown
 * logWithStyle
 * addLeadingZeroes
 * forEachFrom
 * isNumeric
 * isObject
 * randomHex
 * randomInt
 * removeMultipleSpaces
 * removeTrailingSlash
 * roundNumber
 */

describe("ts-reactive-forms test", () => {

    afterEach(() => {
        // console.info("CLEANING UP...");
        (global as any).window = void 0;
        (global as any).document = void 0;
    });

    it("should have the correct version", () => {
        expect("1.0.0").toBe(pkg.version);
    });
})
;
