# This repo is a Best Buy In-Store Monitor that I created that utilizes a custom TLS client to make a request to fetch the stock information at best buy based on zip codes

## How To Install
```
1. git clone https://github.com/senpai0807/bestbuy-instore.git
2. cd bestbuy-instore
3. npm install
4. npm start
```

## Things To Setup Before Running
```
1. Navigate to src -> Dependencies -> JSONs -> proxies.json and add your proxies into the array. It should be in the format of "ip:port:user:pass". To add multiple, simply separate them by comma. Example: ["ip:port:user:pass", "ip:port:user:pass"]
2. Navigate to src -> Dependencies -> JSONs -> zips.json and add your zip code(s) into the array. It should look like this after adding ["44321"], to add multiple, simply separate them by comma. Example: ["44321", "24452"]
3. Navigate to src -> Dependencies -> JSONs -> skus.json and add your SKU(s) into the array. It should look like this after adding ["6609202"], to add multiple, simply separate them by comma. Example: ["6609202", "6548371"]
4. You will then need to navigate to src -> Dependencies -> helpers.js and scroll down to the parseProductDetails function and set your WebhookURL in between the quotes -> const hook = new Webhook("REPLACE WITH WEBHOOK URL");
5. If you want to change the embed details, simply change them
```

## Things To Know
- There is no dynamic parsing for product information, if you add any products that is not stated within the fetchProductInformation function, you will have to state them manually so they can be mapped, just follow the structure to add products.
