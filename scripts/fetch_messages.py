import discord
import json
import os
import re
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
                # Pobierz zdjęcia z wiadomości
                images = []
                for attachment in message.attachments:
                    if attachment.content_type and attachment.content_type.startswith('image/'):
                        images.append(attachment.url)
                
                # Pobierz avatara użytkownika
                avatar_url = str(message.author.display_avatar.url)
                
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
        await client.close()

token = os.environ['DISCORD_TOKEN']
client.run(token)