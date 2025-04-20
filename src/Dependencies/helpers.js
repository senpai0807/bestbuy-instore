import fs from "graceful-fs";
import { promisify } from "util";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Webhook, MessageBuilder } from  "discord-webhook-node";

const readFile = promisify(fs.readFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const proxiesPath = join(__dirname, "./JSONs/proxies.json");

const QuantityCache = new Map();
const QuantityLock = {
    read: async (key) => QuantityCache.get(key),
    write: async (key, value) => QuantityCache.set(key, value)
};

export const fetchNewProxy = async () => {
    return readFile(proxiesPath, "utf-8")
        .then(JSON.parse)
        .then((proxies) => {
            if (!Array.isArray(proxies) || proxies.length === 0) {
                return Promise.reject("no proxies available");
            };

            const selectedProxy = proxies[Math.floor(Math.random() * proxies.length)];
            const parts = selectedProxy.split(":");

            if (parts.length !== 4) {
                return Promise.reject("invalid proxy format");
            };

            const [ip, port, user, pass] = parts;
            return `http://${user}:${pass}@${ip}:${port}`;
        });
};

const fetchProductInformation = async (sku) => {
    const products = {
        "6557811": {
            price: "$49.99",
            name: "Pokémon: Scarlet & Violet Paradox Rift Elite Trainer Box",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6557/6557811_rd.jpg;maxHeight=1920;maxWidth=900?format=webp"
        },
        "6598558": {
            price: "$160.99",
            name: "Pokémon: Scarlet & Violet - Surging Sparks Booster Box - 36 Packs",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6195acce-e5c1-402c-87a1-e644e270b865.jpg"
        },
        "6606082": {
            price: "$49.99",
            name: "Pokémon: Scarlet & Violet - Prismatic Evolutions Elite Trainer Box",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/7fc8c738-8c50-4773-8002-639de5676e48.jpg"
        },
        "6568006": {
            price: "$26.94",
            name: "Pokémon: Scarlet & Violet—Paldean Fates 6pk Booster Bundle",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6568/6568006_sd.jpg"
        },
        "6595705": {
            price: "$23.94",
            name: "Pokémon: Crown Zenith 6 Pk Booster Bundle",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/d226d512-df26-4258-9e2c-14d31e5f0a96.jpg"
        },
        "6546727": {
            price: "$26.94",
            name: "Pokémon: Scarlet & Violet Obsidian Flames 6pk Booster Bundle",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6546/6546727_sd.jpg"
        },
        "6598561": {
            price: "$26.94",
            name: "Pokémon: Scarlet & Violet - Surging Sparks 6 Pk Booster Bundle",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/2768b57f-6e51-4ead-8162-67c60a7dbf6f.jpg"
        },
        "6548371": {
            price: "$26.94",
            name: "Pokémon: 151 6pk Booster Bundle",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6548/6548371_sd.jpg"
        },
        "6608206": {
            price: "$26.94",
            name: "Pokémon: Scarlet & Violet - Prismatic Evolutions Booster Bundle",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/f89aea71-efa5-459a-92f3-d2532e1e5f05.jpg"
        },
        "6584432": {
            price: "$26.94",
            name: "Pokémon: Scarlet & Violet - Shrouded Fable 6pk Booster Bundle",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6584/6584432_sd.jpg"
        },
        "6614267": {
            price: "$49.99",
            name: "Pokémon: Scarlet & Violet Journey Together Elite Trainer Box",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/1edd2862-a885-4256-bb56-514e0ba1978e.jpg"
        },
        "6614264": {
            price: "$26.94",
            name: "Pokémon: Scarlet & Violet Journey Together Booster Bundle 6 Pk",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/e9304dfc-e6e2-422a-a03d-deed3b109f50.jpg"
        },
        "6614260": {
            price: "$13.99",
            name: "Pokémon: Scarlet & Violet Journey Together 3 Pk Booster",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/eb72949a-a5cb-4496-b464-d5a33e363b7b.jpg"
        },
        "6609202": {
            price: "$29.99",
            name: "Pokémon: Scarlet & Violet - Prismatic Evolutions Accessory Pouch",
            image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/1eed402f-077f-427a-854a-647ea5956e7a.jpg"
        }
    };

    const product = products[sku];
    if (!product) {
        return { name: "", image: "", price: "", error: true };
    };

    return {
        name: product.name,
        image: product.image,
        price: product.price,
        error: false
    };
};

export const parseProductDetails = async (body, sku, logger) => {
    if (!body?.ispu?.locations || !body?.ispu?.items || body.ispu.items.length === 0) {
        logger.error(`[${sku}] - No ISPU Data Was Found In Response ❌`);
        return;
    }

    logger.debug(`[${sku}] - Parsing ${body.ispu.items[0]?.locations?.length || 0} Locations...`);

    const locationMap = {};
    for (const loc of body.ispu.locations) {
        locationMap[loc.id] = loc;
    };

    const item = body.ispu.items[0];
    for (const loc of item.locations) {
        const store = locationMap[loc.locationId];
        if (!store) {
            logger.debug(`[${sku}] - Skipping Unknown Store ID: ${loc.locationId}...`);
            continue;
        };

        const avail = loc.availability;
        if (!avail || avail.fulfillmentType !== "PICKUP" || avail.availablePickupQuantity == null) {
            logger.debug(`[${sku}] - Store ${store.name} Has No Stock Available For Pickup...`);
            continue;
        };

        const quantity = avail.availablePickupQuantity;
        const cacheKey = `${sku}:${loc.locationId}`;

        const lastQuantity = await QuantityLock.read(cacheKey);
        if (lastQuantity === quantity) {
            logger.warning(`[${sku}] - Store ${store.name} Has Unchanged Quantity (${quantity}), Skipping...`);
            continue;
        };

        await QuantityLock.write(cacheKey, quantity);
        logger.info(`[${sku}] - Found New Quantity At ${store.name}: ${quantity}...`);

        const storeAddress = `${store.address}, ${store.city}, ${store.state} ${store.zipCode}`;
        const { name, image, price, error } = await fetchProductInformation(sku);

        if (error) {
            logger.error(`[${sku}] - Failed To Fetch Product Information ❌`);
            continue;
        }

        logger.info(`[${sku}] - Sending Discord Webhook For ${name}...`);

        const hook = new Webhook("REPLACE WITH WEBHOOK URL");
        hook.setUsername('Best Buy Monitor');
        hook.setAvatar("https://i.imgur.com/wpELuHW.jpeg");

        const embed = new MessageBuilder()
            .setTitle(name)
            .addField('Store', "Best Buy", true)
            .addField('Price', price, true)
            .addField('PID', sku, true)
            .addField('Quantity', quantity.toString(), true)
            .addField('Fulfillment Type', 'Pick Up', true)
            .addField('Store', storeAddress, true)
            .setColor('#5665da')
            .setThumbnail(image)
            .setFooter('Best Buy Monitor', 'https://i.imgur.com/wpELuHW.jpeg')
            .setTimestamp();

        hook.send(embed);
    }
};
