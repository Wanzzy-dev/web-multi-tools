import { generateEmail, sendDapjiLink, verifyDapjiLink, checkInboxForLink } from '../../utils/api-core';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { action, email, link } = req.body;

    try {
        if (action === 'create_email') {
            const newEmail = await generateEmail();
            return res.status(200).json({ success: true, email: newEmail });
        }
        if (action === 'send_link') {
            await sendDapjiLink(email);
            return res.status(200).json({ success: true, message: "Link sent!" });
        }
        if (action === 'check_inbox') {
            const magicLink = await checkInboxForLink(email);
            return res.status(200).json({ success: true, magicLink: magicLink });
        }
        if (action === 'verify_link') {
            const msg = await verifyDapjiLink(email, link);
            return res.status(200).json({ success: true, message: msg });
        }
        res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export const config = { maxDuration: 30 };
