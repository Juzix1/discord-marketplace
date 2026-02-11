import discord
import json
import os
import re
import asyncio
from datetime import datetime

SALE_KEYWORDS = [
    'sprzedam', 'sprzedaż', 'na sprzedaż', 'do sprzedania',
    'cena', 'zł', 'pln', 'kosztuje', 'za', 'tanio',
    'okazja', 'pilnie', 'używane', 'nowe', 'stan'
]


def extract_price(text):
    """Wyciąga cenę z tekstu"""
    patterns = [
        r'(\d+(?:\s?\d+)*)\s*(?:zł|pln|złotych)',
        r'cena[:\s]+(\d+(?:\s?\d+)*)',
        r'(\d+(?:\s?\d+)*)\s*do\s*negocjacji',
    ]

    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            price_str = match.group(1).replace(' ', '')
            try:
                return int(price_str)
            except:
                pass
    return None


def extract_location(text):
    """Wyciąga lokalizację z tekstu"""
    patterns = [
        r'lokalizacja[:\s]+(.+?)(?:\n|$)',
        r'miejsce[:\s]+(.+?)(?:\n|$)',
        r'miasto[:\s]+(.+?)(?:\n|$)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return match.group(1).strip()
    return None


class FetchClient(discord.Client):
    def __init__(self, channel_id, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.channel_id = channel_id

    async def on_ready(self):
        print(f'Zalogowano jako {self.user}')
        try:
            channel = self.get_channel(self.channel_id)
            if not channel:
                print(f'Nie znaleziono kanału o ID {self.channel_id}')
                await self.close()
                return

            print(f'Pobieram wiadomości z kanału: {channel.name}')

            messages = []
            async for message in channel.history(limit=100):
                if message.author.bot:
                    continue

                content_lower = message.content.lower()
                if any(keyword in content_lower for keyword in SALE_KEYWORDS):
                    images = []
                    for attachment in message.attachments:
                        if attachment.content_type and attachment.content_type.startswith('image/'):
                            images.append(attachment.url)

                    avatar_url = None
                    try:
                        avatar_url = str(message.author.display_avatar.url)
                    except Exception:
                        avatar_url = ''

                    price = extract_price(message.content)
                    location = extract_location(message.content)

                    messages.append({
                        'id': str(message.id),
                        'author': str(message.author.display_name),
                        'author_id': str(message.author.id),
                        'avatar_url': avatar_url,
                        'content': message.content,
                        'timestamp': message.created_at.isoformat(),
                        'url': message.jump_url,
                        'images': images,
                        'price': price,
                        'location': location
                    })

            data = {
                'last_updated': datetime.now().isoformat(),
                'offers': messages
            }

            with open('offers.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            print(f'Zapisano {len(messages)} ofert')

        except Exception as e:
            print(f'Błąd: {e}')
        finally:
            await self.close()


async def fetch_once():
    token = os.environ.get('DISCORD_TOKEN')
    if not token:
        raise RuntimeError('DISCORD_TOKEN must be set')
    channel_id = int(os.environ['DISCORD_CHANNEL_ID'])

    intents = discord.Intents.default()
    intents.message_content = True
    intents.guilds = True

    client = FetchClient(channel_id, intents=intents)
    await client.start(token)


if __name__ == '__main__':
    asyncio.run(fetch_once())