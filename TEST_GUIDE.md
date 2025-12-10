# Testing Public Chat System Without Running Full App

## Overview
Bạn có thể test toàn bộ hệ thống matching & public chat **mà không cần chạy app**, chỉ cần Python.

---

## Test Files Created

### 1. **test_matching_algorithm.py** (Matching Logic)
Tests the core matching algorithm with real similarity calculations.

**Run**:
```powershell
python test_matching_algorithm.py
```

**Tests**:
- ✅ Haversine distance calculation (HCM)
- ✅ Interest similarity (TF-IDF cosine)
- ✅ Location similarity
- ✅ Time availability scoring
- ✅ Full match score calculation
- ✅ Recommendation ranking (top K)
- ✅ Filter ended chats
- ✅ Filter full chats

**Sample Output**:
```
✓ Haversine distance (HCM): 1.84 km
✓ Interest similarity: 0.297
✓ Match score: 0.350
✓ Recommendations count: 3
  1. Hiking Adventure: score=0.460
  2. Coffee Evening: score=0.350
  3. Dinner Party: score=0.310
✅ All matching algorithm tests passed!
```

---

### 2. **test_public_chat_routes.py** (Routes & Templates Logic)
Tests endpoint logic and template variable compatibility.

**Run**:
```powershell
python test_public_chat_routes.py
```

**Tests**:
- ✅ Recommended chats logic (top 5)
- ✅ Browse chats filtering
- ✅ Join chat validation
- ✅ Reveal identity logic (irreversible)
- ✅ Create chat validation
- ✅ API response format (JSON)
- ✅ Template variable compatibility
- ✅ Anonymity logic
- ✅ Chat capacity logic (max members)

**Sample Output**:
```
Testing Recommended Chats Logic...
✓ Recommended 3 chats (max 5)
  - Coffee Night: score=0.500
  - Hiking Trip: score=0.500

Testing Join Chat Logic...
✓ Join chat logic validated
  - Chat not full: 2/5 ✓
  - Chat not ended: True ✓

Testing Reveal Identity Logic...
✓ Reveal identity logic validated
  - Member was anonymous: ✓
  - Identity revealed at: 2025-12-10 14:16:27
  - Now visible: True ✓

✅ All route and template tests passed!
```

---

## Running Tests Sequentially

**Option 1: Run both tests**
```powershell
python test_matching_algorithm.py; python test_public_chat_routes.py
```

**Option 2: Run one at a time**
```powershell
# Test matching algorithm
python test_matching_algorithm.py

# Test routes & templates
python test_public_chat_routes.py
```

---

## What Each Test Validates

### Matching Algorithm Test
- **Haversine Distance**: Correctness of geographical distance calculation
- **Interest Similarity**: TF-IDF vectorization and cosine similarity
- **Location Similarity**: Distance-to-similarity conversion
- **Time Similarity**: Time availability scoring (near/far future)
- **Match Score**: Weighted combination of all factors
- **Recommendations**: Top-K ranking and filtering
- **Filtering**: Ended and full chats excluded

### Routes & Templates Test
- **Recommended Logic**: Returns top 5 personalized recommendations
- **Browse Logic**: Pagination and filtering support
- **Join Logic**: Validates chat availability and user not already joined
- **Reveal Identity**: One-way transition from anonymous to visible
- **Create Logic**: Required fields validation
- **API Responses**: Valid JSON structure for frontend
- **Templates**: Variables match what Flask will provide
- **Anonymity**: Users can choose hidden or visible mode
- **Capacity**: Max members enforcement

---

## Test Coverage Matrix

| Feature | Test File | Validated |
|---------|-----------|-----------|
| TF-IDF matching | test_matching_algorithm.py | ✅ |
| Cosine similarity | test_matching_algorithm.py | ✅ |
| Haversine distance | test_matching_algorithm.py | ✅ |
| Match scoring | test_matching_algorithm.py | ✅ |
| Top-K recommendation | test_matching_algorithm.py | ✅ |
| Browse logic | test_public_chat_routes.py | ✅ |
| Join validation | test_public_chat_routes.py | ✅ |
| Anonymity toggle | test_public_chat_routes.py | ✅ |
| Reveal identity | test_public_chat_routes.py | ✅ |
| Chat capacity | test_public_chat_routes.py | ✅ |
| API response format | test_public_chat_routes.py | ✅ |
| Template variables | test_public_chat_routes.py | ✅ |

---

## Key Test Scenarios

### Scenario 1: User Joins Chat
```
Input: User A, Open Chat (2/5), Not ended
Logic:
  1. Check chat exists ✓
  2. Check not ended ✓
  3. Check not full (2 < 5) ✓
  4. Check user not already joined ✓
Output: Join successful, can choose anonymous/visible mode
```

### Scenario 2: Get Recommendations
```
Input: User A with interests in {coffee, hiking}
       List of 5 public chats
Logic:
  1. Filter out ended chats ✓
  2. Filter out full chats ✓
  3. Calculate TF-IDF similarity (interest) ✓
  4. Calculate Haversine distance (location) ✓
  5. Calculate time score (when) ✓
  6. Combine scores (50% interest, 30% location, 20% time) ✓
  7. Return top 5 ✓
Output: Top 3 recommendations: Hiking=0.46, Coffee=0.35, Dinner=0.31
```

### Scenario 3: Reveal Identity
```
Input: User A in Anonymous Chat, clicks "Reveal Identity"
Logic:
  1. Find member record ✓
  2. Check not already revealed ✓
  3. Set revealed_at timestamp ✓
  4. Set is_anonymous = False ✓
  5. Make irreversible (cannot re-hide) ✓
Output: User A now visible to others, cannot hide again
```

---

## Summary

- ✅ **Matching Algorithm**: Full standalone test with 8 test cases
- ✅ **Routes Logic**: Full validation without Flask context
- ✅ **Templates**: Variable compatibility verified
- ✅ **No App Needed**: Both tests run independently
- ✅ **Fast Execution**: <1 second for both tests

All core functionality tested and validated!
