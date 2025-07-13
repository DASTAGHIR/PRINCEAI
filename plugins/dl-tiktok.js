import fetch from 'node-fetch';

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) throw `✳️ TikTok ka link yahan paste karein:\n *${usedPrefix + command}* tiktok url here...`;
    m.react('⏳'); 

    try {
        let res = await fetch(`https://api.apigratis.tech/downloader/tiktok?url=${encodeURIComponent(args[0])}`);
        if (!res.ok) throw `❎ Failed to fetch content details. Please try again later.`;

        let data = await res.json();
        if (!data.status || !data.result) throw `❎ Failed to process content.`;

        let result = data.result;

        if (result.type === 'video') {
            
            let videoUrl = result.download.original || result.download.watermark;
            if (!videoUrl) throw `❎ Video URL not found.`;


            await conn.sendFile(m.chat, videoUrl, 'tiktok.mp4', '', m);
        } else if (result.type === 'image') {

            let images = result.download.images;
            let audioUrl = result.download.music;

            if (images && images.length > 0) {
 
                for (let img of images) {
                    await conn.sendFile(m.chat, img, 'tiktok_image.jpg', '', m);
                }
            } else {
                throw `❎ No images found in the post.`;
            }


            if (audioUrl) {
                await conn.sendFile(m.chat, audioUrl, 'tiktok_audio.mp3', '', m);
            }
        } else {
            throw `❎ Unsupported content type.`;
        }

        m.react('✅');
    } catch (error) {
        console.error(error);
        m.reply(`❎ Error: Unable to download content. Please check the link or try again later.`);
        m.react('❌'); 
    }
};

handler.help = ['tiktok <link>'];
handler.tags = ['downloader'];
handler.command = ['tiktok', 'tk', 'ttdl', 'tk'];

export default handler;
