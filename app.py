from flask import Flask, request, render_template, jsonify
from musicapi import get_song_recommendation, fetch_related_songs
from yt_dlp import YoutubeDL
from emotionapi import emotion_predict
import logging
import asyncio

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/', methods=['GET'])
def homepage():
    return render_template('index.html')

@app.route('/getsongs', methods=['POST'])
def getsongs():
    try:
        data = request.json
        emotion = data.get('emotion')
        if not emotion:
            return jsonify({'error': 'Emotion is required'}), 400
        logger.info(f"Fetching songs for emotion: {emotion}")
        music_json = get_song_recommendation(emotion)
        return jsonify(music_json), 200
    except Exception as e:
        logger.error(f"Error in getsongs: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/continuesongs', methods=['POST'])
def continuesongs():
    try:
        data = request.json
        videoid = data.get('videoid')
        artists = data.get('artists')
        with open('abcd.txt','w') as abcd:
            abcd.write(artists)

        if not videoid:
            return jsonify({'error': 'videoid is required'}), 400
        logger.info(f"Fetching related songs for videoid: {videoid}")
        musicnext_json = fetch_related_songs(videoid, artists)
        return jsonify(musicnext_json), 200
    except Exception as e:
        logger.error(f"Error in continuesongs: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/songurl', methods=['POST'])
async def songurl():
    try:
        data = request.json
        videoid = data.get('videoid')
        if not videoid:
            return jsonify({'error': 'videoid is required'}), 400

        # Configure yt-dlp options
        ydl_opts = {
            'format': 'bestaudio',
            'noplaylist': True,
            'quiet': True,
            'simulate': True,
            'forceurl': True,
        }

        async def fetch_song_url(videoid):
            loop = asyncio.get_event_loop()
            with YoutubeDL(ydl_opts) as ydl:
                # Run the blocking code in a thread
                return await loop.run_in_executor(None, ydl.extract_info, f'https://youtube.com/watch?v={videoid}')

        # Fetch song URL asynchronously
        song_info = await fetch_song_url(videoid)
        song_url = song_info.get('url', '')
        return jsonify({'songurl': song_url}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/emotion', methods=['POST'])
def emotion():
    data = request.get_json()
    prediction = emotion_predict(data.get('landmarks'))
    if prediction:
        return jsonify({'emotion':prediction})
    else:
        return jsonify({'error':'Prediction Failed'}), 400


    
if __name__ == "__main__":
    # Use threaded=True for handling concurrent requests
    app.run(host='0.0.0.0', debug=True, threaded=True)
