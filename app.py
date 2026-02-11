from flask import Flask, send_from_directory, request
import os
import asyncio

app = Flask(__name__, static_folder='.', static_url_path='')


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('.', path)


@app.route('/fetch', methods=['POST', 'GET'])
def fetch_route():
    # Optional simple secret to protect the endpoint (set FETCH_SECRET env var)
    secret = os.environ.get('FETCH_SECRET')
    if secret:
        provided = request.args.get('secret') or request.headers.get('X-FETCH-SECRET')
        if provided != secret:
            return 'Unauthorized', 401

    # Run the fetcher (calls scripts/fetch_messages.fetch_once)
    try:
        import scripts.fetch_messages as fetch_messages
    except Exception as e:
        return f'Import error: {e}', 500

    try:
        asyncio.run(fetch_messages.fetch_once())
    except Exception as e:
        return f'Fetch error: {e}', 500

    return 'OK'


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
