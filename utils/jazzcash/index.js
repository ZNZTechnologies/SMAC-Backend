
const generateTimeValues = (data) => {
    let now = new Date();
    let timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    data.pp_TxnRefNo = `T${timestamp}`;
    data.pp_TxnDateTime = timestamp;
    now.setDate(now.getDate() + 1);
    timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    data.pp_TxnExpiryDateTime = timestamp;
    return data;
}

const sortAndGenerateHASH = (data) => {
    let sortedBody = Object.keys(data)
        .filter(key => data[key] !== '' && data[key] !== null && data[key] !== undefined).sort().reduce((acc, key) => {
            acc[key] = data[key];
            return acc;
        }, {});
    let concatenatedString = Object.values(sortedBody).join('&');
    concatenatedString = `${process.env.JAZZCASH_INTEGRITY_SALT}&` + concatenatedString;
    const { createHmac } = require('node:crypto');
    const hash = createHmac('sha256', process.env.JAZZCASH_INTEGRITY_SALT).update(concatenatedString).digest('hex').toUpperCase();
    data.pp_SecureHash = hash;
    return data;
}

const pingAPI = async (url, payload) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    return response;
}

const parseResponse = async (res) => {
    const r = res.getReader();
    const d = new TextDecoder();
    let result = '';
    while (true) {
        const { done, value } = await r.read();
        if (done) break;
        result += d.decode(value, { stream: true });
    }
    return JSON.parse(result);
}

const makeWalletPayment = async (data) => {
    let payLoad = {
        pp_Amount: data.Amount,
        pp_MobileNumber: data.MobileNumber,
        pp_CNIC: data.CNIC,
        pp_Description: data.Description,
        //
        pp_BillReference: 'billRef',
        pp_Language: 'EN',
        pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
        pp_Password: process.env.JAZZCASH_PASSWORD,
        pp_TxnCurrency: 'PKR'
    }
    //
    payLoad = generateTimeValues(payLoad);
    payLoad = sortAndGenerateHASH(payLoad);
    //
    let response = await pingAPI(process.env.JAZZCASH_MWALLET_URL, payLoad);
    return response;
}

module.exports = {
    parseResponse,
    makeWalletPayment,
    generateTimeValues,
    sortAndGenerateHASH,
    pingAPI,
    parseResponse
}
