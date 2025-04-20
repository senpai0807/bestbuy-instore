import fs from "graceful-fs";
import { promisify } from "util";
import Logger from "@ptkdev/logger";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { fetch } from "./Dependencies/TLS/tls.js";
import { 
    fetchNewProxy,
    parseProductDetails
 } from "./Dependencies/helpers.js";

const logger = new Logger();
const readFile = promisify(fs.readFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const skusPath = join(__dirname, "./Dependencies/JSONs/skus.json");
const zipsPath = join(__dirname, "./Dependencies/JSONs/zips.json");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const monitor = async () => {
    const skus = JSON.parse(await readFile(skusPath, "utf-8"));
    const zips = JSON.parse(await readFile(zipsPath, "utf-8"));

    while (true) {
        for (const sku of skus) {
            for (const zip of zips) {
                logger.info(`[${sku} | ${zip}] - Checking In Store Availability On Best Buy ⏳`);
                let success = false;

                for (let attempt = 1; attempt <= 10; attempt++) {
                    await fetchNewProxy()
                        .then((proxyUrl) => {
                            return fetch("https://www.bestbuy.com/productfulfillment/c/api/2.0/storeAvailability", {
                                method: "POST",
                                headers: {
                                    "sec-ch-ua-platform": `"Windows"`,
                                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
                                    "accept": "application/json, text/javascript, */*; q=0.01",
                                    "sec-ch-ua": `"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"`,
                                    "content-type": "application/json",
                                    "sec-ch-ua-mobile": "?0",
                                    "origin": "https://www.bestbuy.com",
                                    "sec-fetch-site": "same-origin",
                                    "sec-fetch-mode": "cors",
                                    "sec-fetch-dest": "empty",
                                    "referer": "https://www.bestbuy.com/",
                                    "accept-encoding": "gzip, deflate, br, zstd",
                                    "accept-language": "en-US,en;q=0.9",
                                    "priority": "u=1, i"
                                },
                                body: JSON.stringify({
                                    locationId: "",
                                    zipCode: zip,
                                    showOnShelf: true,
                                    lookupInStoreQuantity: true,
                                    xboxAllAccess: false,
                                    consolidated: false,
                                    showOnlyOnShelf: false,
                                    showInStore: true,
                                    pickupTypes: ["UPS_ACCESS_POINT", "FEDEX_HAL"],
                                    onlyBestBuyLocations: true,
                                    items: [
                                        {
                                            sku: sku,
                                            condition: null,
                                            quantity: 1,
                                            itemSeqNumber: "1",
                                            reservationToken: null,
                                            selectedServices: [],
                                            requiredAccessories: [],
                                            isTradeIn: false,
                                            isLeased: false,
                                        },
                                    ],
                                }),
                                proxyUrl: proxyUrl,
                                followRedirects: true,
                                tlsClientIdentifier: 'chrome_124'
                            });
                        }).then(async (response) => {
                            if (response.apiResponse.status >= 200 && response.apiResponse.status < 300) {
                                success = true;
                                const body = JSON.parse(response.apiResponse.body);
                                await parseProductDetails(body, sku, logger);
                                return;
                            } else {
                                logger.warn(`[Attempt ${attempt}] - Status Code: ${response.status} ⚠️`);
                                return;
                            }
                        }).catch((err) => {
                            logger.error(`[Attempt ${attempt}] - Error ❌`);
                            logger.debug(err.message || err);
                        });

                    if (success) break;

                    logger.info(`Waiting ${attempt * 10}s Before Retry ⏳`);
                    await sleep(attempt * 10 * 1000);
                };

                if (!success) {
                    logger.error(`❌ Could Not Fetch Information For SKU: [${sku}] At ZIP: [${zip}]`);
                };
            };
        };

        logger.info("Sleeping 10s Before Starting Next Check...");
        await sleep(10 * 1000);
    };
};

monitor();