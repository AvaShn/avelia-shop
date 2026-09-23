const token = process.env.TELEGRAM_BOT_TOKEN;

async function testTelegram(){

const res = await fetch(
`https://api.telegram.org/bot${token}/getMe`
);

const data = await res.json();

console.log(data);

}

testTelegram();