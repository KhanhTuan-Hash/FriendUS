from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime, timedelta
from matching_algorithm import MatchingAlgorithm
from models_public_chat import (
    PublicChat, PublicChatMember, PublicChatSummary, UserPreference,
    UserChatRequest, PublicChatStatusEnum, PublicChatMemberStatusEnum,
    UserChatActionEnum
)
from ext import db

public_chat_bp = Blueprint('public_chat', __name__, url_prefix='/public-chat')


def _get_recommendation_service():
    return MatchingAlgorithm(max_distance_km=50)


@public_chat_bp.route('/recommended', methods=['GET'])
@login_required
def get_recommended_chats():
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 5, type=int)
        
        active_chats = PublicChat.query.filter(
            PublicChat.status == PublicChatStatusEnum.ACTIVE,
            PublicChat.scheduled_end_time > datetime.utcnow(),
            PublicChat.is_public == True
        ).all()
        
        service = _get_recommendation_service()
        recommendations = service.recommend_chats(current_user, active_chats, top_k=limit)
        
        result = []
        for rec in recommendations:
            chat = rec['chat']
            result.append({
                'id': chat.id,
                'name': chat.name,
                'description': chat.description,
                'location_name': chat.location_name,
                'latitude': chat.latitude,
                'longitude': chat.longitude,
                'scheduled_date': chat.scheduled_date.isoformat(),
                'scheduled_end_time': chat.scheduled_end_time.isoformat(),
                'member_count': chat.member_count,
                'max_members': chat.max_members,
                'summary': chat.summary.summary_text if chat.summary else '',
                'match_score': rec['score'],
                'match_details': rec['details']
            })
        
        return jsonify({
            'success': True,
            'page': page,
            'count': len(result),
            'recommendations': result
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@public_chat_bp.route('/browse', methods=['GET'])
@login_required
def browse_public_chats():
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        filter_topic = request.args.get('filter', '', type=str)
        
        query = PublicChat.query.filter(
            PublicChat.is_public == True,
            PublicChat.status == PublicChatStatusEnum.ACTIVE,
            PublicChat.scheduled_end_time > datetime.utcnow()
        )
        
        if filter_topic:
            query = query.join(PublicChatSummary).filter(
                PublicChatSummary.key_topics.like(f'%{filter_topic}%')
            )
        
        total = query.count()
        chats = query.offset((page - 1) * limit).limit(limit).all()
        
        result = []
        for chat in chats:
            result.append({
                'id': chat.id,
                'name': chat.name,
                'description': chat.description,
                'location_name': chat.location_name,
                'latitude': chat.latitude,
                'longitude': chat.longitude,
                'scheduled_date': chat.scheduled_date.isoformat(),
                'scheduled_end_time': chat.scheduled_end_time.isoformat(),
                'member_count': chat.member_count,
                'max_members': chat.max_members,
                'summary': chat.summary.summary_text if chat.summary else '',
                'creator_id': chat.creator_id,
                'is_anonymous': chat.is_anonymous
            })
        
        return jsonify({
            'success': True,
            'page': page,
            'limit': limit,
            'total': total,
            'chats': result
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@public_chat_bp.route('/<int:chat_id>/join', methods=['POST'])
@login_required
def join_public_chat(chat_id):
    try:
        chat = PublicChat.query.get_or_404(chat_id)
        
        if not chat.is_public or chat.is_ended:
            return jsonify({'success': False, 'error': 'Chat not available'}), 400
        
        if chat.member_count >= chat.max_members:
            return jsonify({'success': False, 'error': 'Chat is full'}), 400
        
        existing = PublicChatMember.query.filter_by(
            public_chat_id=chat_id,
            user_id=current_user.id
        ).first()
        
        if existing and existing.status == PublicChatMemberStatusEnum.JOINED:
            return jsonify({'success': False, 'error': 'Already joined this chat'}), 400
        
        is_anonymous = request.get_json().get('is_anonymous', True) if request.is_json else True
        
        if existing:
            existing.status = PublicChatMemberStatusEnum.JOINED
            existing.is_anonymous = is_anonymous
            existing.joined_at = datetime.utcnow()
        else:
            member = PublicChatMember(
                public_chat_id=chat_id,
                user_id=current_user.id,
                is_anonymous=is_anonymous,
                status=PublicChatMemberStatusEnum.JOINED,
                joined_at=datetime.utcnow()
            )
            db.session.add(member)
        
        request_record = UserChatRequest(
            user_id=current_user.id,
            public_chat_id=chat_id,
            action=UserChatActionEnum.JOINED
        )
        db.session.add(request_record)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Successfully joined chat',
            'chat_id': chat_id,
            'is_anonymous': is_anonymous
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@public_chat_bp.route('/<int:chat_id>/reject', methods=['POST'])
@login_required
def reject_public_chat(chat_id):
    try:
        chat = PublicChat.query.get_or_404(chat_id)
        
        existing = PublicChatMember.query.filter_by(
            public_chat_id=chat_id,
            user_id=current_user.id
        ).first()
        
        if existing:
            existing.status = PublicChatMemberStatusEnum.REJECTED
        else:
            member = PublicChatMember(
                public_chat_id=chat_id,
                user_id=current_user.id,
                status=PublicChatMemberStatusEnum.REJECTED
            )
            db.session.add(member)
        
        reason = request.get_json().get('reason', '') if request.is_json else ''
        request_record = UserChatRequest(
            user_id=current_user.id,
            public_chat_id=chat_id,
            action=UserChatActionEnum.REJECTED,
            reason=reason
        )
        db.session.add(request_record)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Chat rejected'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@public_chat_bp.route('/<int:chat_id>/reveal-identity', methods=['POST'])
@login_required
def reveal_identity(chat_id):
    try:
        member = PublicChatMember.query.filter_by(
            public_chat_id=chat_id,
            user_id=current_user.id,
            status=PublicChatMemberStatusEnum.JOINED
        ).first_or_404()
        
        if member.is_revealed:
            return jsonify({'success': False, 'error': 'Already revealed'}), 400
        
        success = member.reveal_identity()
        
        if success:
            visible_members = PublicChatMember.query.filter_by(
                public_chat_id=chat_id,
                status=PublicChatMemberStatusEnum.JOINED,
                is_anonymous=False
            ).all()
            
            visible_names = [m.user.username for m in visible_members]
            
            return jsonify({
                'success': True,
                'message': 'Identity revealed',
                'now_visible_to': visible_names
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Cannot reveal identity'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@public_chat_bp.route('/<int:chat_id>/summary', methods=['GET'])
@login_required
def get_chat_summary(chat_id):
    try:
        chat = PublicChat.query.get_or_404(chat_id)
        
        summary = chat.summary
        if not summary:
            return jsonify({'success': False, 'error': 'Summary not available'}), 404
        
        return jsonify({
            'success': True,
            'summary': summary.summary_text,
            'topics': summary.topics_list,
            'generated_at': summary.generated_at.isoformat()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@public_chat_bp.route('/create', methods=['POST'])
@login_required
def create_public_chat():
    try:
        data = request.get_json()
        
        if not data.get('name') or not data.get('scheduled_date'):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        scheduled_date = datetime.fromisoformat(data['scheduled_date'])
        scheduled_end_time = datetime.fromisoformat(data.get('scheduled_end_time', 
                                                              (scheduled_date + timedelta(hours=2)).isoformat()))
        
        chat = PublicChat(
            name=data['name'],
            description=data.get('description', ''),
            creator_id=current_user.id,
            location_name=data.get('location_name'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            scheduled_date=scheduled_date,
            scheduled_end_time=scheduled_end_time,
            is_public=True,
            is_anonymous=data.get('is_anonymous', True),
            max_members=data.get('max_members', 5)
        )
        
        creator_member = PublicChatMember(
            public_chat=chat,
            user_id=current_user.id,
            is_anonymous=False,
            status=PublicChatMemberStatusEnum.JOINED,
            joined_at=datetime.utcnow()
        )
        
        db.session.add(chat)
        db.session.add(creator_member)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Chat created successfully',
            'chat_id': chat.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@public_chat_bp.route('/user/active-count', methods=['GET'])
@login_required
def get_user_active_chat_count():
    try:
        count = PublicChatMember.query.filter(
            PublicChatMember.user_id == current_user.id,
            PublicChatMember.status == PublicChatMemberStatusEnum.JOINED,
            PublicChat.status == PublicChatStatusEnum.ACTIVE
        ).join(PublicChat).count()
        
        return jsonify({
            'success': True,
            'active_chat_count': count,
            'max_allowed': 5
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
