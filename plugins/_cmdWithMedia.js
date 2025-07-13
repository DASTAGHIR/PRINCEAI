import { proto, generateWAMessage, areJidsSameUser } from '@whiskeysockets/baileys';
import { webp2png } from '../lib/webp2mp4.js';
import { promises as fsPromises } from 'fs';
import path from 'path';

const globalContentFile = path.join(process.cwd(), './database/globalContent.json');
const localContentFile = path.join(process.cwd(), './database/localContent.json');

async function loadGlobalContent() {
  try {
    if (await fsPromises.access(globalContentFile).then(() => true).catch(() => false)) {
      const data = await fsPromises.readFile(globalContentFile, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (e) {
    console.error(`Error loading globalContent.json: ${e}`);
    return {};
  }
}

async function loadLocalContent() {
  try {
    if (await fsPromises.access(localContentFile).then(() => true).catch(() => false)) {
      const data = await fsPromises.readFile(localContentFile, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (e) {
    console.error(`Failed to load localContent.json: ${e}`);
    return {};
  }
}

export async function all(m, chatUpdate) {
  if (m.isBaileys || m.processed) return;
  m.processed = true; // Mark message as processed

  global.db.data = global.db.data || {};
  global.db.data.sticker = global.db.data.sticker || {};

  console.log(`Message ID: ${m.key.id}, Type: ${m.mtype}, Text: ${m.text}, FileSha256: ${m.msg?.fileSha256 ? Buffer.from(m.msg.fileSha256).toString('base64') : 'N/A'}`);

  // Sticker logic
  if (m.message && m.msg?.fileSha256) {
    const hash = Buffer.from(m.msg.fileSha256).toString('base64');
    if (global.db.data.sticker?.[hash]) {
      const { text, mentionedJid, chat: commandChat } = global.db.data.sticker[hash] || {};
      if (commandChat === m.chat) {
        await this.sendMessage(m.chat, { text, mentions: mentionedJid }, { quoted: m });
      }
      return; // Exit after sticker handling
    }
  }

  // Content matching logic
  if (m.text && !m.isCommand && m.mtype !== 'protocolMessage' && !m.text.startsWith('.')) {
    const textLower = m.text.toLowerCase().trim();
    let content = null;
    let matchedKeywords = '';

    const localContent = await loadLocalContent();
    const chat = localContent[m.chat] || { savedContent: {} };
    const globalContent = await loadGlobalContent();

    // Check local content first
    for (const [key, value] of Object.entries(chat.savedContent)) {
      if (value.keywords?.some(k => textLower.includes(k)) || textLower === key) {
        content = value;
        matchedKeywords = value.keywords?.filter(k => textLower.includes(k)).join(', ') || key;
        break;
      }
    }

    // Only check global if no local match
    if (!content) {
      for (const [key, value] of Object.entries(globalContent)) {
        if (value.keywords?.some(k => textLower.includes(k)) || textLower === key) {
          content = value;
          matchedKeywords = value.keywords?.filter(k => textLower.includes(k)).join(', ') || key;
          break;
        }
      }
    }

    if (!content || typeof content !== 'object' || !content.type) return;
    console.log(`🔥 Keywords detected: "${matchedKeywords}"`);

    try {
      const options = { quoted: m };
      switch (content.type) {
        case 'sticker':
          if (content.data) {
            const stickerBuffer = Buffer.from(content.data, 'base64');
            await this.sendFile(m.chat, stickerBuffer, 'sticker.webp', '', m, content.isAnimated || false, {
              contextInfo: { forwardingScore: 200, isForwarded: false, externalAdReply: { showAdAttribution: false, title: gt, body: vs, mediaType: 2, sourceUrl: accountsgb, thumbnail: imagen1 }}
            });
          }
          break;
        case 'image': case 'video': case 'gif': case 'audio': case 'document':
          if (content.data) {
            const buffer = Buffer.from(content.data, 'base64');
            const message = {
              [content.type === 'gif' ? 'video' : content.type]: buffer,
              caption: content.caption || '',
              ...(content.type === 'gif' ? { gifPlayback: true } : {}),
              ...(content.type === 'document' ? { mimetype: content.mimetype, fileName: content.fileName } : {}),
              ...(content.type === 'audio' ? { ptt: false } : {})
            };
            await this.sendMessage(m.chat, message, options);
          }
          break;
        case 'location':
          await this.sendMessage(m.chat, { location: { degreesLatitude: content.latitude, degreesLongitude: content.longitude, name: content.caption || '' } }, options);
          break;
        case 'contact':
          await this.sendMessage(m.chat, { contacts: { contacts: [{ vcard: content.vcard, displayName: content.caption || '' }] } }, options);
          break;
        case 'buttons':
          if (content.text || content.buttons.length > 0) {
            await this.sendMessage(m.chat, {
              text: content.text || content.caption || '',
              buttons: content.buttons.map(b => ({ buttonId: b.buttonId, buttonText: { displayText: b.buttonText }, type: 1 }),
              headerType: 1
            }, options);
          }
          break;
        case 'link':
          await m.reply(`${content.caption ? content.caption + '\n\n' : ''}${content.url}`, options);
          break;
        case 'text':
          if (content.value) {
            await m.reply(content.value);
          }
          break;
        default:
          return;
      }
    } catch (e) {
      console.error(`Error rendering content: ${e}`);
    }
  }
}
