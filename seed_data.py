import random
from faker import Faker
from app import create_app, db
from app.models import User, Room, UserTagScore, Post
from werkzeug.security import generate_password_hash

# Khởi tạo Faker và App
fake = Faker()
app = create_app()

# Danh sách tags chuẩn (trùng với TAG_CHOICES trong utils.py)
TAG_LIST = [
    'Travel', 'Food', 'Coffee', 'Music', 'Sports', 'Gaming', 
    'Technology', 'Movies', 'Reading', 'Study', 'Camping', 
    'Shopping', 'Photography', 'Billiards', 'Just Chatting'
]

def seed_database():
    with app.app_context():
        print("🌱 Đang xóa dữ liệu cũ (nếu cần thiết)...")
        # db.drop_all() # Bỏ comment nếu muốn xóa sạch database cũ
        # db.create_all()

        print("👤 Đang tạo User TESTER (Demo User)...")
        # 1. Tạo User Tester (người dùng để đăng nhập và test)
        demo_user = User.query.filter_by(username='demo').first()
        if not demo_user:
            demo_user = User(
                username='demo',
                email='demo@test.com',
                password=generate_password_hash('123456'), # Mật khẩu mặc định
                image_file='default.jpg',
                bio="I love traveling and listening to music!"
            )
            db.session.add(demo_user)
            db.session.commit()
            print(f"   -> Đã tạo user: 'demo' (Pass: 123456)")
        else:
            print(f"   -> User 'demo' đã tồn tại.")

        # 2. Gán điểm sở thích (UserTagScore) cho Demo User
        # Giả sử user này CỰC KỲ thích 'Travel' (20 điểm) và 'Music' (15 điểm)
        # Ghét hoặc không quan tâm 'Sports'
        interests = {
            'Travel': 20.0,
            'Music': 15.0,
            'Photography': 10.0,
            'Coffee': 5.0
        }
        
        print("📊 Đang cập nhật UserTagScore cho 'demo'...")
        # Xóa điểm cũ để test cho chuẩn
        UserTagScore.query.filter_by(user_id=demo_user.id).delete()
        
        for tag, score in interests.items():
            record = UserTagScore(
                user_id=demo_user.id,
                tag=tag,
                score=score
            )
            db.session.add(record)
        db.session.commit()

        # 3. Tạo các User phụ (để làm chủ phòng)
        print("👥 Đang tạo 10 User ngẫu nhiên...")
        random_users = []
        for _ in range(10):
            u = User(
                username=fake.user_name(),
                email=fake.email(),
                password=generate_password_hash('123456')
            )
            db.session.add(u)
            random_users.append(u)
        db.session.commit()
        # Lấy lại ID sau khi commit
        random_users = User.query.filter(User.id != demo_user.id).limit(10).all()

        # 4. Tạo Room theo kịch bản (Scenario)
        print("🏠 Đang tạo Room theo kịch bản...")
        
        # Kịch bản A: Room RẤT PHÙ HỢP (Chứa tags Travel, Music) -> Phải hiện đầu tiên
        match_room = Room(
            name="Amazing Travel & Music",
            description="A place for people who love traveling and listening to mild music.",
            is_private=False,
            tags="Travel,Music,Photography", # Trúng 3 sở thích
            creator=random.choice(random_users)
        )
        
        # Kịch bản B: Room KHÁ PHÙ HỢP (Chứa tag Coffee) -> Hiện giữa
        medium_room = Room(
            name="Coffee Lovers Saigon",
            description="Let's grab a coffee and talk.",
            is_private=False,
            tags="Coffee,Just Chatting", # Trúng 1 sở thích nhẹ
            creator=random.choice(random_users)
        )
        
        # Kịch bản C: Room KHÔNG LIÊN QUAN (Sports, Gaming) -> Hiện cuối
        mismatch_room = Room(
            name="Hardcore Gamers & Football",
            description="Only for gamers and sport fans. No travel allowed!",
            is_private=False,
            tags="Sports,Gaming,Technology", # Không trúng sở thích nào của 'demo'
            creator=random.choice(random_users)
        )

        db.session.add_all([match_room, medium_room, mismatch_room])

        # 5. Tạo thêm 15 Room ngẫu nhiên để làm nhiễu (Test thuật toán sort)
        print("🎲 Đang tạo 15 Room ngẫu nhiên...")
        for _ in range(15):
            # Chọn ngẫu nhiên 2-3 tag
            room_tags = random.sample(TAG_LIST, k=random.randint(2, 3))
            
            room = Room(
                name=f"{fake.city()} {fake.word().title()} Club",
                description=fake.sentence(),
                is_private=False, # Public để hiện lên Lobby
                tags=",".join(room_tags),
                creator=random.choice(random_users)
            )
            db.session.add(room)

        db.session.commit()
        print("✅ Tạo dữ liệu mẫu thành công!")
        print("👉 Hãy chạy server, đăng nhập 'demo' / '123456'")
        print("👉 Vào Lobby, danh sách sẽ lộn xộn.")
        print("👉 Bấm nút 'Find Matching Groups', nhóm 'Amazing Travel & Music' phải lên đầu!")

if __name__ == '__main__':
    seed_database()