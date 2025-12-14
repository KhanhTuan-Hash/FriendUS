import google.generativeai as genai
from config import Config
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

GOOGLE_API_KEY = Config.GOOGLE_API_KEY

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# summarize chat
def summarize_chat(chats):
    chat_lines = chats[-40:]
    chat_text = "\n".join(chat_lines)

    short_summary_prompt = f"""Tóm tắt đoạn chat tiếng Việt sau đây thành một bản tóm tắt ngắn gọn, tối đa 30 từ.
    Đảm bảo bản tóm tắt không chứa teencode hoặc icon, không chứa các thông tin riêng tư, và sử dụng ngôn ngữ chuẩn. 
    Đảm bảo không được nhắc đến tên, chỉ nói lại sự việc đã được đề cập ở trong các dòng tin nhắn.
    Đoạn chat:
    {chat_text}
    Chỉ đưa ra bản tóm tắt."""

    full_summary_prompt = f"""Tóm tắt đoạn chat tiếng Việt sau đây thành một bản tóm tắt đầy đủ, tối đa 80 từ.
    Đảm bảo bản tóm tắt không chứa teencode hoặc icon, không chứa các thông tin riêng tư, và sử dụng ngôn ngữ chuẩn.
    Đảm bảo không được nhắc đến tên, chỉ nói lại sự việc đã được đề cập ở trong các dòng tin nhắn.
    Đoạn chat:
    {chat_text}
    Chỉ đưa ra bản tóm tắt chi tiết."""

    try:
        short_summary_response = model.generate_content(short_summary_prompt)
        short_summary = short_summary_response.text
    except Exception as e:
        short_summary = f"Lỗi không thể tóm tắt"

    try:
        full_summary_response = model.generate_content(full_summary_prompt)
        full_summary = full_summary_response.text
    except Exception as e:
        full_summary = f"Lỗi không thể tóm tắt"

    return short_summary, full_summary

#Recommend tag
# calc weight text with list tags
def tag_weight(text, tags):
    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1,2)
    )

    docs = [text] + tags
    tfidf = vectorizer.fit_transform(docs)

    text_vec = tfidf[0]
    tag_vecs = tfidf[1:]

    scores = cosine_similarity(text_vec, tag_vecs)[0]
    return dict(zip(tags, scores))

# calc weight tag with interest
def tag_interest_weight(tag, interest):
    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1,2)
    )

    tfidf = vectorizer.fit_transform([tag, interest])
    score = cosine_similarity(tfidf[0], tfidf[1])[0][0]
    return score

# matrix weight list tags with interest 
def interests_tags_matrix(interests, tags):
    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2)
    )

    docs = interests + tags
    tfidf = vectorizer.fit_transform(docs)

    interest_vecs = tfidf[:len(interests)]
    tag_vecs = tfidf[len(interests):]

    matrix = cosine_similarity(interest_vecs, tag_vecs)
    return matrix

interests_all = [
    "đọc tiểu thuyết",
    "quan tâm xã hội",
    "giải toán",
]

tags_all = [
    "văn học",
    "xã hội",
    "toán học",
]

interest_index = {v: i for i, v in enumerate(interests_all)}
tag_index = {v: i for i, v in enumerate(tags_all)}
W = interests_tags_matrix(interests_all, tags_all)

# calc score form small list tags and small list interests
def score_from_matrix(
    interests_input,
    tags_input,
    W,
    interest_index,
    tag_index
):
    rows = []

    for i in interests_input:
        if i not in interest_index:
            continue
        ii = interest_index[i]

        row = []
        for t in tags_input:
            if t in tag_index:
                row.append(W[ii][tag_index[t]])

        if row:
            rows.append(row)

    if not rows:
        return 0.0

    row_max_sum = 0.0
    for r in rows:
        row_max_sum += max(r)
    score_row = row_max_sum / len(rows)

    num_cols = len(rows[0])
    col_max_sum = 0.0

    for c in range(num_cols):
        col_max = 0.0
        for r in rows:
            if r[c] > col_max:
                col_max = r[c]
        col_max_sum += col_max

    score_col = col_max_sum / num_cols

    return round(max(score_row, score_col) * 100, 2)

user_interests = ["đọc tiểu thuyết", "quan tâm xã hội"]
content_tags = ["văn học", "xã hội"]

final_score = score_from_matrix(
    user_interests,
    content_tags,
    W,
    interest_index,
    tag_index
)

print(final_score)