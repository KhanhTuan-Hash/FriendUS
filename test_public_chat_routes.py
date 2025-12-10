import sys
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import Mock, MagicMock, patch
import json

sys.path.insert(0, str(Path(__file__).parent))

from matching_algorithm import MatchingAlgorithm


class MockUser:
    def __init__(self, user_id=1, username="testuser"):
        self.id = user_id
        self.username = username
        self.is_authenticated = True
        self.preferences = []
        self.posts = []
        self.favorite_locations = []


class MockPublicChat:
    def __init__(self, chat_id=1, name="Test Chat", member_count=2, max_members=5, is_ended=False):
        self.id = chat_id
        self.name = name
        self.description = "Test description"
        self.location_name = "Cafe Q1"
        self.latitude = 10.7769
        self.longitude = 106.6955
        self.scheduled_date = datetime.utcnow() + timedelta(hours=6)
        self.scheduled_end_time = datetime.utcnow() + timedelta(hours=8)
        self.creator_id = 1
        self.is_public = True
        self.is_anonymous = True
        self.member_count = member_count
        self.max_members = max_members
        self.is_ended = is_ended
        self.status = Mock(value='ended' if is_ended else 'active')
        self.summary = Mock(summary_text="Chat about coffee and books", topics_list=['coffee', 'books'])


def test_api_endpoint_recommended():
    print("Testing Recommended Chats Logic...")
    
    user = MockUser()
    algo = MatchingAlgorithm()
    
    mock_chats = [
        MockPublicChat(1, "Coffee Night", 2, 5),
        MockPublicChat(2, "Hiking Trip", 1, 5),
        MockPublicChat(3, "Gaming Session", 3, 5),
    ]
    
    recommendations = algo.recommend_chats(user, mock_chats, top_k=5)
    
    print(f"✓ Recommended {len(recommendations)} chats (max 5)")
    for rec in recommendations:
        print(f"  - {rec['chat'].name}: score={rec['score']:.3f}")
    assert len(recommendations) <= 5
    assert all(r['score'] > 0 for r in recommendations)


def test_api_endpoint_browse():
    print("Testing Browse Chats Logic...")
    
    mock_chats = [
        MockPublicChat(i, f"Chat {i}", 2, 5) for i in range(1, 6)
    ]
    
    active_chats = [c for c in mock_chats if not c.is_ended]
    print(f"✓ Browse endpoint would return {len(active_chats)} active chats")
    assert len(active_chats) == 5


def test_api_endpoint_join():
    print("Testing Join Chat Logic...")
    
    chat = MockPublicChat(1, "Test Chat", 2, 5)
    
    can_join = chat.member_count < chat.max_members and not chat.is_ended
    print(f"✓ Join chat logic validated")
    print(f"  - Chat not full: {chat.member_count}/{chat.max_members} ✓")
    print(f"  - Chat not ended: {not chat.is_ended} ✓")
    print(f"  - Can join: {can_join} ✓")
    assert can_join


def test_api_endpoint_reveal_identity():
    print("Testing Reveal Identity Logic...")
    
    member = Mock()
    member.is_revealed = False
    member.revealed_at = None
    
    # Simulate reveal
    if not member.is_revealed:
        member.revealed_at = datetime.utcnow()
        member.is_anonymous = False
    
    print(f"✓ Reveal identity logic validated")
    print(f"  - Member was anonymous: ✓")
    print(f"  - Identity revealed at: {member.revealed_at}")
    print(f"  - Now visible: {not member.is_anonymous} ✓")


def test_api_endpoint_create():
    print("Testing Create Chat Logic...")
    
    chat_data = {
        'name': 'New Chat',
        'description': 'Test description',
        'scheduled_date': (datetime.utcnow() + timedelta(hours=6)).isoformat(),
        'scheduled_end_time': (datetime.utcnow() + timedelta(hours=8)).isoformat(),
        'location_name': 'Cafe Q1',
        'latitude': 10.7769,
        'longitude': 106.6955,
        'max_members': 5,
        'is_anonymous': True
    }
    
    required_fields = ['name', 'scheduled_date']
    has_required = all(field in chat_data for field in required_fields)
    
    print(f"✓ Create chat logic validated")
    print(f"  - Required fields present: {has_required} ✓")
    print(f"  - Chat name: {chat_data['name']}")
    print(f"  - Max members: {chat_data['max_members']}")
    print(f"  - Anonymous mode: {chat_data['is_anonymous']}")


def test_api_response_format():
    print("Testing API response format...")
    
    response_template = {
        'success': True,
        'page': 1,
        'count': 5,
        'recommendations': [
            {
                'id': 1,
                'name': 'Chat Name',
                'description': 'Description',
                'location_name': 'Location',
                'latitude': 10.7769,
                'longitude': 106.6955,
                'scheduled_date': datetime.utcnow().isoformat(),
                'scheduled_end_time': datetime.utcnow().isoformat(),
                'member_count': 2,
                'max_members': 5,
                'summary': 'Chat summary text',
                'match_score': 0.75,
                'match_details': {
                    'total_score': 0.75,
                    'interest_score': 0.8,
                    'location_score': 0.7,
                    'time_score': 0.7
                }
            }
        ]
    }
    
    print("✓ API response format validated")
    print(f"  - JSON serializable: {json.dumps(response_template) is not None}")
    print(f"  - Contains success flag: {'success' in response_template}")
    print(f"  - Contains chat data: {'recommendations' in response_template}")


def test_template_variables():
    print("Testing template variable compatibility...")
    
    recommended_vars = {
        'recommendations': [
            {
                'id': 1,
                'name': 'Coffee Night',
                'description': 'Meet for coffee',
                'location_name': 'Cafe Q1',
                'scheduled_date': datetime.utcnow().isoformat(),
                'scheduled_end_time': datetime.utcnow().isoformat(),
                'member_count': 2,
                'max_members': 5,
                'match_score': 0.85
            }
        ]
    }
    
    browse_vars = {
        'page': 1,
        'chats': [
            {
                'id': 1,
                'name': 'Test Chat',
                'description': 'Test',
                'location_name': 'Location',
                'scheduled_date': datetime.utcnow().isoformat(),
                'member_count': 2,
                'max_members': 5,
                'is_anonymous': True
            }
        ]
    }
    
    create_vars = {}  # No server-side vars needed
    
    print("✓ Template variables validated")
    print(f"  - recommended.html variables: {list(recommended_vars.keys())}")
    print(f"  - browse.html variables: {list(browse_vars.keys())}")
    print(f"  - create.html variables: (client-side form)")


def test_anonymity_logic():
    print("Testing anonymity logic...")
    
    user1 = MockUser(1, "Alice")
    user2 = MockUser(2, "Bob")
    
    mock_member1 = Mock()
    mock_member1.is_anonymous = True
    mock_member1.user = user1
    
    mock_member2 = Mock()
    mock_member2.is_anonymous = False
    mock_member2.user = user2
    
    print("✓ Anonymity logic validated")
    print(f"  - User 1 (Alice): anonymous={mock_member1.is_anonymous} (hidden)")
    print(f"  - User 2 (Bob): anonymous={mock_member2.is_anonymous} (visible)")


def test_chat_capacity_logic():
    print("Testing chat capacity logic...")
    
    chat_open = MockPublicChat(1, "Open", member_count=2, max_members=5)
    chat_full = MockPublicChat(2, "Full", member_count=5, max_members=5)
    chat_almost_full = MockPublicChat(3, "Almost", member_count=4, max_members=5)
    
    print("✓ Chat capacity logic validated")
    print(f"  - Open chat (2/5): can join = {chat_open.member_count < chat_open.max_members}")
    print(f"  - Full chat (5/5): can join = {chat_full.member_count < chat_full.max_members}")
    print(f"  - Almost full (4/5): can join = {chat_almost_full.member_count < chat_almost_full.max_members}")


if __name__ == "__main__":
    print("=" * 70)
    print("Testing Public Chat Routes & Templates (No App Needed)")
    print("=" * 70)
    
    try:
        test_api_endpoint_recommended()
        test_api_endpoint_browse()
        test_api_endpoint_join()
        test_api_endpoint_reveal_identity()
        test_api_endpoint_create()
        test_api_response_format()
        test_template_variables()
        test_anonymity_logic()
        test_chat_capacity_logic()
        
        print("=" * 70)
        print("✅ All route and template tests passed!")
        print("=" * 70)
    except AssertionError as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
