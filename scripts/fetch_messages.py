import discord
import json
import os
from datetime import datetime

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True

client = discord.Client(intents=intents)

CHANNEL_ID = int(os.environ['DISCORD_CHANNEL_ID'])

SALE_KEYWORDS = [
    'sprzedam', 'sprzedaż', 'na sprzedaż', 'do sprzedania',
    'cena', 'zł', 'pln', 'kosztuje', 'za', 'tanio',
    'okazja', 'pilnie', 'używane', 'nowe', 'stan'
]

@client.event
async def on_ready():
    print(f'Zalogowano jako {client.user}')
    
    try:
        channel = client.get_channel(CHANNEL_ID)
        if not channel:
            print(f'Nie znaleziono kanału o ID {CHANNEL_ID}')
            await client.close()
            return
        
        print(f'Pobieram wiadomości z kanału: {channel.name}')
        
        messages = []
        async for message in channel.history(limit=100):
            if message.author.bot:
                continue
            
            content_lower = message.content.lower()
            if any(keyword in content_lower for keyword in SALE_KEYWORDS):
                messages.append({
                    'id': str(message.id),
                    'author': str(message.author.display_name),
                    'content': message.content,
                    'timestamp': message.created_at.isoformat(),
                    'url': message.jump_url
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
        await client.close()

token = os.environ['DISCORD_TOKEN']
client.run(token)