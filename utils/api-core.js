import axios from 'axios';
import crypto from 'crypto';

const SECMAIL_DOMAINS = ['1secmail.com', '1secmail.org', '1secmail.net', 'wwwnew.eu', 'iszhy.com', 'vjuum.com'];
const API_URL = 'https://am.dapjimption.my.id';

export async function generateEmail(provider = '1secmail') {
    if (provider === '1secmail') {
        const domain = SECMAIL_DOMAINS[Math.floor(Math.random() * SECMAIL_DOMAINS.length)];
        const name = crypto.randomBytes(5).toString('hex');
        return `${name}@${domain}`;
    } else {
        const res = await axios.post('https://api.internal.temp-mail.io/api/v3/email/new', { min_name_length: 10, max_name_length: 10 });
        return res.data.email;
    }
}

export async function checkInboxForLink(email) {
    const domain = email.split('@')[1];
    const login = email.split('@')[0];

    if (SECMAIL_DOMAINS.includes(domain)) {
        try {
            const res = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
            if (res.data && res.data.length > 0) {
                for (const m of res.data) {
                    const msgDetail = await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${m.id}`);
                    const body = msgDetail.data.textBody || msgDetail.data.htmlBody || "";
                    const match = body.match(/https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:alightcreative\.com|alight\.link|alightmotion\.com|firebaseapp\.com)\/[^\s"'>\\]+/);
                    if (match) return match[0].replace(/&amp;/g, '&').replace(/\\u0026/g, '&');
                }
            }
        } catch (e) { return null; }
    }
    return null;
}

export async function sendDapjiLink(email) {
    const { data } = await axios.post(API_URL, { action: 'send', email: email }, { headers: { 'Content-Type': 'application/json' } });
    if (data && data.status === false) throw new Error(data.msg || "Gagal kirim link");
    return data;
}

export async function verifyDapjiLink(email, link) {
    const { data } = await axios.post(API_URL, { action: 'verify', email: email, link: link }, { headers: { 'Content-Type': 'application/json' } });
    if (data && data.status === false) throw new Error(data.msg || "Gagal verifikasi");
    return data.msg || "Sukses";
}
