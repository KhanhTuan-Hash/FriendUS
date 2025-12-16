from flask import Blueprint, redirect, url_for, flash, render_template, request, jsonify
from flask_login import current_user, login_required
from app.extensions import db
from app.models import Room, Activity, Constraint
from app.forms import ActivityForm, ConstraintForm
from app.blueprints.weather import weather_service # Import service thời tiết
from datetime import datetime

planner_bp = Blueprint('planner', __name__)

# =========================================================
# HELPER: PHÂN TÍCH TÁC ĐỘNG THỜI TIẾT (CORE LOGIC)
# =========================================================
def analyze_weather_impact(activities, weather_data):
    """
    Input: Danh sách Activities, Dữ liệu dự báo 5 ngày
    Output: Dict { activity_id: [List of Warnings] }
    """
    impacts = {}
    
    if not weather_data or 'five_day_forecast' not in weather_data:
        return impacts

    forecast_list = weather_data['five_day_forecast']

    for act in activities:
        act_warnings = []
        
        # 1. Tìm dự báo thời tiết khớp với ngày của Activity
        # Giả sử act.start_time là chuỗi 'YYYY-MM-DD HH:MM' hoặc object datetime
        # Ở đây tôi xử lý linh hoạt
        act_date_str = ""
        if isinstance(act.start_time, str):
             # Cắt chuỗi lấy ngày (ví dụ 2025-10-20)
             act_date_str = act.start_time.split(' ')[0] 
        
        # Tìm ngày tương ứng trong dự báo
        matched_day = next((day for day in forecast_list if day['date'] == act_date_str), None)

        if matched_day:
            risks = matched_day.get('risks', [])
            weather_desc = matched_day.get('weather_desc', '')

            # 2. Logic cảnh báo dựa trên loại hoạt động (Cơ bản)
            # Nếu tên hoạt động chứa từ khóa ngoài trời
            keywords_outdoor = ['picnic', 'dạo', 'chạy', 'công viên', 'park', 'outdoor', 'leo núi', 'bơi']
            is_outdoor = any(k in act.name.lower() for k in keywords_outdoor)

            # --- Check Mưa ---
            if 'RISK_HEAVY_RAIN' in risks:
                msg = f"☔ Mưa lớn vào ngày này ({matched_day['precipitation_sum']}mm). Không tốt cho hoạt động ngoài trời."
                act_warnings.append({'level': 'critical', 'msg': msg})
            elif 'WARNING_LIGHT_RAIN' in risks and is_outdoor:
                msg = f"🌧️ Có mưa nhẹ. Nhớ mang dù nếu đi {act.name}."
                act_warnings.append({'level': 'warning', 'msg': msg})

            # --- Check Nắng Nóng ---
            if 'RISK_EXTREME_HEAT' in risks:
                msg = "☀️ Nắng nóng gay gắt (>35°C). Cẩn thận say nắng."
                act_warnings.append({'level': 'warning', 'msg': msg})
            
            # --- Check Gió ---
            if 'RISK_HIGH_WIND' in risks:
                msg = "💨 Gió rất mạnh. Cẩn thận khi di chuyển."
                act_warnings.append({'level': 'warning', 'msg': msg})

        if act_warnings:
            impacts[act.id] = act_warnings

    return impacts

# ... (Hàm check_conflicts giữ nguyên như cũ) ...
def check_conflicts(activities, constraints):
    conflicts = {} 
    # ... (Code cũ của bạn về check budget/time) ...
    # Để ngắn gọn tôi không paste lại đoạn check budget ở đây, bạn giữ nguyên nhé
    return conflicts

# =========================================================
# ROUTES
# =========================================================

@planner_bp.route('/room/<int:room_id>/plan')
@login_required
def view_planner(room_id):
    room = Room.query.get_or_404(room_id)
    
    # 1. Load Data
    activities = Activity.query.filter_by(room_id=room.id).order_by(Activity.start_time).all()
    constraints = Constraint.query.filter_by(room_id=room.id, user_id=current_user.id).all()
    act_form = ActivityForm()
    cons_form = ConstraintForm()
    
    # 2. Weather Data (Lấy dự báo 5-7 ngày để cover hết kế hoạch)
    try:
        # Tạm thời hardcode tọa độ HCM, sau này lấy từ Room.location
        raw_weather = weather_service.get_full_forecast(lat=10.762622, lon=106.660172, days=7)
        weather_data = weather_service.process_forecast_data(raw_weather)
    except Exception as e:
        print(f"Weather Error: {e}")
        weather_data = None

    # 3. Chạy logic kiểm tra
    # Kiểm tra xung đột tiền/giờ
    conflicts = check_conflicts(activities, constraints)
    
    # [NEW] Kiểm tra tác động thời tiết
    weather_impacts = analyze_weather_impact(activities, weather_data)

    return render_template(
        'planner.html',
        room=room,
        activities=activities,
        constraints=constraints,
        act_form=act_form,
        cons_form=cons_form,
        conflicts=conflicts,
        weather=weather_data,
        weather_impacts=weather_impacts # <--- Truyền thêm biến này
    )

@planner_bp.route('/room/<int:room_id>/add_constraint', methods=['POST'])
@login_required
def add_room_constraint(room_id):
    room = Room.query.get_or_404(room_id)
    form = ConstraintForm()
    
    if form.validate_on_submit():
        new_cons = Constraint(
            type=form.type.data, 
            intensity=form.intensity.data, 
            value=form.value.data,
            user=current_user, 
            room_id=room.id
        )
        db.session.add(new_cons)
        db.session.commit()
        flash('Constraint added successfully.', 'success')
    else:
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"Error in {field}: {error}", 'danger')
                
    return redirect(url_for('planner.view_planner', room_id=room.id))

@planner_bp.route('/room/<int:room_id>/add_activity', methods=['POST'])
@login_required
def add_room_activity(room_id):
    room = Room.query.get_or_404(room_id)
    form = ActivityForm()
    
    if form.validate_on_submit():
        new_act = Activity(
            name=form.name.data, location=form.location.data, price=form.price.data,
            start_time=form.start_time.data, end_time=form.end_time.data,
            rating=form.rating.data if form.rating.data else 0, room=room
        )
        db.session.add(new_act)
        db.session.commit()
        flash('Activity added!', 'success')
    else:
        flash('Error adding activity. Check inputs.', 'danger')
    
    # [QUAN TRỌNG] Chuyển hướng về lại trang Planner (Reload trang)
    # Thay vì trả về JSON, ta trả về lệnh chuyển trang
    return redirect(url_for('chat.chat_room', room_name=room.name))

@planner_bp.route('/delete_activity/<int:id>')
@login_required
def delete_activity(id):
    act = Activity.query.get_or_404(id)
    
    # [BƯỚC SỬA QUAN TRỌNG]
    # Bạn phải lấy tên phòng và gán vào biến room_name TRƯỚC KHI xóa
    room_name = act.room.name 
    
    db.session.delete(act)
    db.session.commit()
    
    # Lúc này biến room_name đã có giá trị để sử dụng
    return redirect(url_for('chat.chat_room', room_name=room_name))

@planner_bp.route('/delete_constraint/<int:id>')
@login_required
def delete_constraint(id):
    cons = Constraint.query.get_or_404(id)
    room_id = cons.room.id
    if cons.user_id == current_user.id:
        db.session.delete(cons)
        db.session.commit()
    return redirect(url_for('planner.view_planner', room_id=room_id))