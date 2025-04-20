import koffi from 'koffi';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dllPath = join(__dirname, 'tls.dll');
const tlsClientLibrary = koffi.load(dllPath);
const request = tlsClientLibrary.func('string request(string)');

export const fetch = async (url, options) => {
    const freeMemory = tlsClientLibrary.func('void freeMemory(string)');
    const requestId = options.requestId ? options.requestId : uuidv4();
    const requestPayload = {
        tlsClientIdentifier: options.tlsClientIdentifier ? options.tlsClientIdentifier : 'safari_ios_16_0',
        followRedirects: options.followRedirects,
        withDebug: false,
        insecureSkipVerify: true,
        withoutCookieJar: false,
        withDefaultCookieJar: true,
        isByteRequest: false,
        catchPanics: true,
        forceHttp1: options.forceHttp1 ? options.forceHttp1 : false,
        withRandomTLSExtensionOrder: true,
        sessionId: requestId,
        timeoutSeconds: 120,
        proxyUrl: options.proxyUrl ? options.proxyUrl : '',
        isRotatingProxy: false,
        certificatePinningHosts: {},
        requestUrl: url,
        requestMethod: options.method,
        headerOrder: options.headerOrder ? options.headerOrder : [],
        requestBody: options.body ? options.body : '',
        headers: options.headers ? options.headers : {},
        requestCookies: options.requestCookies ? options.requestCookies : []
    };

    try {
        const rawResponse = request(JSON.stringify(requestPayload));
        const responseObject = JSON.parse(rawResponse);
        freeMemory(responseObject.id);
        return {
            apiResponse: responseObject,
            sessionId: requestId
        };
    } catch (err) {
        return {
            apiResponse: { status: 500, body: '', error: 'TLS Request Failed' },
            sessionId: requestId
        };
    }
}

export const getCookies = async (sessionId, url) => {
    const payload = {
        sessionId: sessionId,
        url: url
    };

    const getCookiesFromSession = tlsClientLibrary.func('string getCookiesFromSession(string)');
    const cookiesResponse = getCookiesFromSession(JSON.stringify(payload));
    const cookies = JSON.parse(cookiesResponse);
    return cookies.cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
};