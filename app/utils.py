import os
import secrets
from PIL import Image
from flask import current_app

# [NEW] Helper to save profile pictures
def save_picture(form_picture):
    random_hex = secrets.token_hex(8)
    _, f_ext = os.path.splitext(form_picture.filename)
    picture_fn = random_hex + f_ext
    picture_path = os.path.join(current_app.root_path, 'static/profile_pics', picture_fn)

    output_size = (125, 125)
    i = Image.open(form_picture)
    i.thumbnail(output_size)
    i.save(picture_path)

    return picture_fn

# Helper logic functions
def simplify_debts(transactions):
    pair_balances = {} 

    for t in transactions:
        s_name = t.sender.username
        
        if t.receiver:
            r_name = t.receiver.username
        elif t.outsider:
            r_name = f"{t.outsider.name} (Outside)"
        else:
            continue 

        amount = float(t.amount)
        p1, p2 = sorted((s_name, r_name))
        key = (p1, p2)
        
        if key not in pair_balances: pair_balances[key] = 0.0

        if t.type == 'debt':
            if s_name == p1: pair_balances[key] += amount
            else: pair_balances[key] -= amount
        elif t.type == 'repayment':
            if s_name == p1: pair_balances[key] -= amount
            else: pair_balances[key] += amount

    direct_edges = []
    for (p1, p2), bal in pair_balances.items():
        if bal > 0:
            direct_edges.append({'from': p1, 'to': p2, 'amount': bal, 'label': f"{bal:,.0f}"})
        elif bal < 0:
            direct_edges.append({'from': p2, 'to': p1, 'amount': abs(bal), 'label': f"{abs(bal):,.0f}"})

    return direct_edges

def check_conflicts(activities, constraints):
    conflicts = {} 
    for act in activities:
        act_conflicts = []
        for cons in constraints:
            if cons.type == 'price':
                try:
                    limit = float(cons.value)
                    if act.price > limit:
                        msg = f"Over budget (${limit})"
                        act_conflicts.append({'msg': msg, 'level': 'critical' if cons.intensity == 'rough' else 'warning'})
                except ValueError: pass
            
            if cons.type == 'time':
                if act.start_time and act.start_time < cons.value:
                    msg = f"Too early (Before {cons.value})"
                    act_conflicts.append({'msg': msg, 'level': 'critical' if cons.intensity == 'rough' else 'warning'})

        if act_conflicts:
            conflicts[act.id] = act_conflicts
            
    return conflicts