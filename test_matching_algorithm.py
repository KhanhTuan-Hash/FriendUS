import sys
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).parent))

from matching_algorithm import MatchingAlgorithm


class MockUser:
    def __init__(self, user_id, preferences_text=""):
        self.id = user_id
        self.preferences = []
        self.posts = []
        self.favorite_locations = []
        self.preferences_text = preferences_text


class MockPreference:
    def __init__(self, pref_type, weight=0.5):
        self.preference_type = pref_type
        self.weight = weight


class MockLocation:
    def __init__(self, lat, lon):
        self.latitude = lat
        self.longitude = lon


class MockSummary:
    def __init__(self, summary_text, topics):
        self.summary_text = summary_text
        self.topics_list = topics


class MockPublicChat:
    def __init__(self, chat_id, name, summary_text, lat, lon, scheduled_date, is_ended=False, member_count=2, max_members=5):
        self.id = chat_id
        self.name = name
        self.latitude = lat
        self.longitude = lon
        self.scheduled_date = scheduled_date
        self.summary = MockSummary(summary_text, [])
        self.is_ended = is_ended
        self.status = type('obj', (object,), {'value': 'ended' if is_ended else 'active'})()
        self.member_count = member_count
        self.max_members = max_members


def test_haversine_distance():
    algo = MatchingAlgorithm()
    
    dist = algo.haversine_distance(10.7769, 106.6955, 10.7855, 106.7099)
    print(f"✓ Haversine distance (HCM): {dist:.2f} km")
    assert 1 < dist < 3, f"Expected ~1.84 km, got {dist}"


def test_interest_similarity():
    algo = MatchingAlgorithm()
    
    user_text = "eating coffee cafe restaurant pho"
    chat_text = "lets meet for coffee and pho at quang an coffee shop"
    
    sim = algo.calculate_interest_similarity(user_text, chat_text)
    print(f"✓ Interest similarity: {sim:.3f}")
    assert 0 < sim < 1, f"Expected similarity between 0-1, got {sim}"


def test_location_similarity():
    algo = MatchingAlgorithm()
    
    sim_same = algo.calculate_location_similarity(10.7769, 106.6955, 10.7769, 106.6955)
    print(f"✓ Same location similarity: {sim_same:.3f}")
    assert sim_same > 0.9
    
    sim_far = algo.calculate_location_similarity(10.7769, 106.6955, 20.0, 105.0)
    print(f"✓ Far location similarity: {sim_far:.3f}")
    assert sim_far < 0.1


def test_time_similarity():
    algo = MatchingAlgorithm()
    
    soon = datetime.utcnow() + timedelta(hours=12)
    sim_soon = algo.calculate_time_similarity([8, 9, 10, 14, 15, 16, 17, 18, 19, 20], soon)
    print(f"✓ Time similarity (12h ahead): {sim_soon:.3f}")
    assert sim_soon > 0.8
    
    far = datetime.utcnow() + timedelta(days=10)
    sim_far = algo.calculate_time_similarity([8, 9, 10, 14, 15, 16, 17, 18, 19, 20], far)
    print(f"✓ Time similarity (10d ahead): {sim_far:.3f}")
    assert sim_far < 0.5


def test_match_score_calculation():
    algo = MatchingAlgorithm()
    
    user = MockUser(1, "eating coffee cafe")
    user.preferences = [MockPreference("eating", 0.8), MockPreference("cafe", 0.7)]
    
    chat = MockPublicChat(
        1,
        "Coffee Night",
        "lets hang out and enjoy coffee and food",
        10.7769,
        106.6955,
        datetime.utcnow() + timedelta(hours=12)
    )
    
    score = algo.calculate_match_score(user, chat)
    print(f"✓ Match score: {score['total_score']:.3f}")
    print(f"  - Interest: {score['interest_score']:.3f}")
    print(f"  - Location: {score['location_score']:.3f}")
    print(f"  - Time: {score['time_score']:.3f}")
    assert 0 < score['total_score'] <= 1


def test_recommend_chats():
    algo = MatchingAlgorithm()
    
    user = MockUser(1)
    user.preferences = [MockPreference("eating", 0.8), MockPreference("hiking", 0.6)]
    
    chats = [
        MockPublicChat(1, "Coffee Evening", "coffee and dessert", 10.7769, 106.6955, datetime.utcnow() + timedelta(hours=6), member_count=2),
        MockPublicChat(2, "Hiking Adventure", "mountain hiking at Nui Voi", 10.85, 106.7, datetime.utcnow() + timedelta(hours=24), member_count=1),
        MockPublicChat(3, "Gaming Night", "gaming and chatting", 10.75, 106.68, datetime.utcnow() + timedelta(days=5), member_count=3),
        MockPublicChat(4, "Dinner Party", "expensive restaurant", 10.76, 106.70, datetime.utcnow() + timedelta(hours=48), member_count=4),
        MockPublicChat(5, "Ended Chat", "old chat", 10.7, 106.6, datetime.utcnow() - timedelta(hours=1), is_ended=True),
    ]
    
    recommendations = algo.recommend_chats(user, chats, top_k=3)
    print(f"✓ Recommendations count: {len(recommendations)}")
    assert len(recommendations) <= 3
    
    for i, rec in enumerate(recommendations):
        print(f"  {i+1}. {rec['chat'].name}: score={rec['score']:.3f}")
    
    assert all(rec['chat'].is_ended is False for rec in recommendations)


def test_filter_ended_chats():
    algo = MatchingAlgorithm()
    
    user = MockUser(1)
    
    chats = [
        MockPublicChat(1, "Active Chat", "summary", 10.7769, 106.6955, datetime.utcnow() + timedelta(hours=6), is_ended=False),
        MockPublicChat(2, "Ended Chat", "summary", 10.75, 106.68, datetime.utcnow() - timedelta(hours=1), is_ended=True),
    ]
    
    recommendations = algo.recommend_chats(user, chats, top_k=5)
    print(f"✓ Filtered chats: {len(recommendations)} (should be 1)")
    assert len(recommendations) == 1
    assert recommendations[0]['chat'].name == "Active Chat"


def test_filter_full_chats():
    algo = MatchingAlgorithm()
    
    user = MockUser(1)
    
    chats = [
        MockPublicChat(1, "Open Chat", "summary", 10.7769, 106.6955, datetime.utcnow() + timedelta(hours=6), member_count=2, max_members=5),
        MockPublicChat(2, "Full Chat", "summary", 10.75, 106.68, datetime.utcnow() + timedelta(hours=12), member_count=5, max_members=5),
    ]
    
    recommendations = algo.recommend_chats(user, chats, top_k=5)
    print(f"✓ Filtered full chats: {len(recommendations)} (should be 1)")
    assert len(recommendations) == 1
    assert recommendations[0]['chat'].name == "Open Chat"


if __name__ == "__main__":
    print("=" * 60)
    print("Testing Matching Algorithm (Standalone)")
    print("=" * 60)
    
    try:
        test_haversine_distance()
        test_interest_similarity()
        test_location_similarity()
        test_time_similarity()
        test_match_score_calculation()
        test_recommend_chats()
        test_filter_ended_chats()
        test_filter_full_chats()
        
        print("=" * 60)
        print("✅ All matching algorithm tests passed!")
        print("=" * 60)
    except AssertionError as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
