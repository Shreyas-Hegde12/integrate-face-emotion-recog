from ytmusicapi import YTMusic

ytmusic = YTMusic()

def get_song_recommendation(emotion):
    """
    music mapper
    """
    emotion_to_query = {
        'starter':'lover',
        'canthearloud': 'calm soothing classical hindustani',
        'happy': 'feels pharrel williams',
        'neutral': 'Enjoy enjaami',
        'joy': 'guruvara sanje song',
        'angry': 'look at me! rap',
        'surprise': 'eye of the tiger survivor',
        'rock': 'rock song',
        'yoyo': 'tauba tauba song',
        'sad': 'male ninthu hoda mele',
        'depressed': 'moye more official video song'
    }
    
    if emotion not in emotion_to_query:
        return {"error": "Invalid emotion"}
    
    search_query = emotion_to_query[emotion]
    search_results = ytmusic.search(search_query, filter="songs", limit=1)
    
    if not search_results:
        return {"error": "No song found for the given emotion"}
    
    # Set the global variable
    mainsong = search_results[0]
    video_id = mainsong.get("videoId")
    if not video_id:
        return {"error": "Unable to retrieve video ID for the main song"}
    artists = ''.join([artist.get("name", "Unknown Artist") for artist in mainsong.get("artists", [])])

    return fetch_related_songs(video_id, artists)

def fetch_related_songs(video_id, songartists):
    # Get main song details
    song_details = ytmusic.get_song(video_id)
    if not song_details:
        return {"error": "Unable to fetch main song details"}
    
    # Get related songs
    watch_playlist = ytmusic.get_watch_playlist(videoId=video_id, limit=4)
    if not watch_playlist or "tracks" not in watch_playlist:
        return {"error": "Unable to fetch related songs"}
    
    tracks = watch_playlist["tracks"]
    
    # Ensure there are at least 3 related songs
    similar_tracks = tracks[1:4]
    while len(similar_tracks) < 3:
        similar_tracks.append({})
    
    # Organize data with keys 'similar1', 'similar2', and 'similar3'
    return {
        "mainsong": {
            "title": song_details['videoDetails'].get("title", "Unknown Title"),
            "artist": songartists,
            "coverart": song_details['videoDetails']['thumbnail'].get("thumbnails", [{}])[-1].get("url", ""),
            "videoid": video_id
        },
        "similar1": format_track(similar_tracks[0]),
        "similar2": format_track(similar_tracks[1]),
        "similar3": format_track(similar_tracks[2])
    }

def format_track(track):
    if not track:
        return {"title": "N/A", "artist": "N/A", "coverart": "", "videoid": ""}

    return {
        "title": track.get("title", "Unknown Title"),
        "artist": ", ".join([artist.get("name", "Unknown Artist") for artist in track.get("artists", [])]),
        "coverart": track['thumbnail'][2].get("url", ""),
        "videoid": track.get("videoId", "")
    }

if __name__ =="__main__":
    hi = get_song_recommendation('happy')
