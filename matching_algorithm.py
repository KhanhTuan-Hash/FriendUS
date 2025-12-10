from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
from math import radians, cos, sin, asin, sqrt
import numpy as np


class MatchingAlgorithm:
    def __init__(self, max_distance_km=50):
        self.max_distance_km = max_distance_km
        self.vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
    
    def haversine_distance(self, lat1, lon1, lat2, lon2):
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
        c = 2 * asin(sqrt(a))
        km = 6371 * c
        return km
    
    def calculate_interest_similarity(self, user_preferences_text, chat_summary_text):
        if not user_preferences_text or not chat_summary_text:
            return 0.0
        
        try:
            texts = [user_preferences_text, chat_summary_text]
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            similarity = cosine_similarity(tfidf_matrix)[0][1]
            return float(similarity)
        except Exception:
            return 0.0
    
    def calculate_location_similarity(self, user_lat, user_lon, chat_lat, chat_lon):
        if not all([user_lat, user_lon, chat_lat, chat_lon]):
            return 0.5
        
        try:
            distance = self.haversine_distance(user_lat, user_lon, chat_lat, chat_lon)
            similarity = max(0, 1 - (distance / self.max_distance_km))
            return float(similarity)
        except Exception:
            return 0.5
    
    def calculate_time_similarity(self, user_available_hours, chat_scheduled_date):
        if not chat_scheduled_date or not user_available_hours:
            return 0.5
        
        try:
            now = datetime.utcnow()
            if chat_scheduled_date < now:
                return 0.0
            
            time_diff_hours = (chat_scheduled_date - now).total_seconds() / 3600
            if time_diff_hours > 168:
                return 0.3
            elif time_diff_hours > 72:
                return 0.6
            elif time_diff_hours > 24:
                return 0.8
            else:
                return 1.0
        except Exception:
            return 0.5
    
    def calculate_match_score(self, user, public_chat, weights=None):
        if weights is None:
            weights = {'interest': 0.5, 'location': 0.3, 'time': 0.2}
        
        user_prefs_text = self._build_user_preferences_text(user)
        chat_summary_text = public_chat.summary.summary_text if public_chat.summary else ""
        
        s_interest = self.calculate_interest_similarity(user_prefs_text, chat_summary_text)
        
        s_location = 0.5
        if user_prefs_text and public_chat.latitude and public_chat.longitude:
            try:
                user_avg_lat = float(user_prefs_text.split(':')[1].split(',')[0]) if ':' in user_prefs_text else 10.7769
                user_avg_lon = float(user_prefs_text.split(',')[1].split(';')[0]) if ',' in user_prefs_text else 106.6955
                s_location = self.calculate_location_similarity(user_avg_lat, user_avg_lon, public_chat.latitude, public_chat.longitude)
            except Exception:
                s_location = 0.5
        
        s_time = self.calculate_time_similarity([8, 9, 10, 14, 15, 16, 17, 18, 19, 20], public_chat.scheduled_date)
        
        final_score = (
            weights['interest'] * s_interest +
            weights['location'] * s_location +
            weights['time'] * s_time
        )
        
        return {
            'total_score': float(final_score),
            'interest_score': float(s_interest),
            'location_score': float(s_location),
            'time_score': float(s_time),
            'breakdown': {
                'interest': weights['interest'],
                'location': weights['location'],
                'time': weights['time']
            }
        }
    
    def recommend_chats(self, user, public_chats_list, top_k=5):
        scores_with_chats = []
        
        for chat in public_chats_list:
            if chat.is_ended or chat.status.value == 'ended' or chat.status.value == 'cancelled':
                continue
            
            if chat.member_count >= chat.max_members:
                continue
            
            score = self.calculate_match_score(user, chat)
            scores_with_chats.append({
                'chat': chat,
                'score': score['total_score'],
                'details': score
            })
        
        scores_with_chats.sort(key=lambda x: x['score'], reverse=True)
        return [item for item in scores_with_chats[:top_k]]
    
    @staticmethod
    def _build_user_preferences_text(user):
        parts = []
        
        if hasattr(user, 'preferences') and user.preferences:
            for pref in user.preferences:
                parts.append(f"{pref.preference_type}:{pref.weight}")
        
        if hasattr(user, 'posts') and user.posts:
            for post in user.posts[:10]:
                if post.body:
                    parts.append(post.body[:50])
        
        if hasattr(user, 'favorite_locations') and user.favorite_locations:
            for loc in user.favorite_locations[:5]:
                if loc.latitude and loc.longitude:
                    parts.append(f"location:{loc.latitude},{loc.longitude}")
        
        return " ".join(parts) if parts else "default user"


def get_recommendation_service():
    return MatchingAlgorithm()
