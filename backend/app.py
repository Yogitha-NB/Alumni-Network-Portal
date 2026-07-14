
# ═══════════════════════════════════════════════════════════════
#  Alumni Network Portal — SQLite Backend
#  No MongoDB needed — runs with just Python + SQLite
#  Features: JWT, RBAC, WebSockets, Rate Limiting, Swagger,
#  Events, Forum, Mentorship, Gallery, Stories, Feedback,
#  Contributions, Opportunities, Contact, Social Links
# ═══════════════════════════════════════════════════════════════

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flasgger import Swagger
from datetime import datetime, timedelta
from functools import wraps
import jwt, csv, io, os

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///alumni_v4.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "alumni_v4_sqlite_secret_2024")

CORS(app, resources={r"/api/*": {"origins": "*"}})
db       = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*")
limiter  = Limiter(get_remote_address, app=app, default_limits=["300 per day","100 per hour"], storage_uri="memory://")
swagger  = Swagger(app, template={"info": {"title": "Alumni Network Portal v4.0", "version": "4.0.0"}})


# ═══════════════════════════════════════════════════════════════
#  MODELS  (OOP with SQLAlchemy)
# ═══════════════════════════════════════════════════════════════

class User(db.Model):
    """Base User — OOP Parent class concept"""
    __tablename__ = "users"
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    email       = db.Column(db.String(120), unique=True, nullable=False)
    password    = db.Column(db.String(200), nullable=False)
    role        = db.Column(db.String(20), nullable=False)   # admin / alumni / student
    is_approved = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "email": self.email,
            "role": self.role, "is_approved": self.is_approved,
            "created_at": self.created_at.strftime("%d %b %Y")
        }


class Alumni(db.Model):
    """Alumni profile — OOP Child class concept"""
    __tablename__ = "alumni"
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True)
    batch_year  = db.Column(db.Integer, default=2020)
    company     = db.Column(db.String(150), default="")
    designation = db.Column(db.String(150), default="")
    location    = db.Column(db.String(100), default="")
    skills      = db.Column(db.String(300), default="")   # comma-separated
    bio         = db.Column(db.Text, default="")
    linkedin    = db.Column(db.String(200), default="")
    twitter     = db.Column(db.String(200), default="")
    facebook    = db.Column(db.String(200), default="")
    instagram   = db.Column(db.String(200), default="")
    user        = db.relationship("User", backref="alumni_profile")

    def get_skills_list(self):
        return [s.strip() for s in self.skills.split(",") if s.strip()]

    def get_skills_set(self):
        """Python set for unique skills"""
        return set(self.get_skills_list())

    def to_dict(self):
        return {
            "id": self.id, "user_id": self.user_id,
            "name": self.user.name if self.user else "",
            "email": self.user.email if self.user else "",
            "is_approved": self.user.is_approved if self.user else False,
            "batch_year": self.batch_year, "company": self.company,
            "designation": self.designation, "location": self.location,
            "skills": self.get_skills_list(), "bio": self.bio,
            "linkedin": self.linkedin, "twitter": self.twitter,
            "facebook": self.facebook, "instagram": self.instagram,
            "created_at": self.user.created_at.strftime("%d %b %Y") if self.user else ""
        }


class Job(db.Model):
    __tablename__ = "jobs"
    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(150), nullable=False)
    company     = db.Column(db.String(150), nullable=False)
    location    = db.Column(db.String(100), default="")
    job_type    = db.Column(db.String(50), default="Full-time")
    description = db.Column(db.Text, default="")
    salary      = db.Column(db.String(80), default="")
    apply_link  = db.Column(db.String(300), default="")
    posted_by   = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    poster      = db.relationship("User", backref="jobs")

    def to_dict(self):
        return {
            "id": self.id, "title": self.title, "company": self.company,
            "location": self.location, "job_type": self.job_type,
            "description": self.description, "salary": self.salary,
            "apply_link": self.apply_link, "posted_by": self.posted_by,
            "poster_name": self.poster.name if self.poster else "",
            "created_at": self.created_at.strftime("%d %b %Y")
        }


class Message(db.Model):
    __tablename__ = "messages"
    id         = db.Column(db.Integer, primary_key=True)
    from_id    = db.Column(db.Integer, db.ForeignKey("users.id"))
    to_id      = db.Column(db.Integer, db.ForeignKey("users.id"))
    subject    = db.Column(db.String(150), default="")
    body       = db.Column(db.Text, nullable=False)
    is_read    = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sender     = db.relationship("User", foreign_keys=[from_id])
    receiver   = db.relationship("User", foreign_keys=[to_id])

    def to_dict(self):
        return {
            "id": self.id, "from_id": self.from_id, "to_id": self.to_id,
            "subject": self.subject, "body": self.body, "is_read": self.is_read,
            "sender_name":   self.sender.name   if self.sender   else "",
            "receiver_name": self.receiver.name if self.receiver else "",
            "created_at": self.created_at.strftime("%d %b %Y, %H:%M")
        }


class Activity(db.Model):
    __tablename__ = "activities"
    id         = db.Column(db.Integer, primary_key=True)
    action     = db.Column(db.String(200))
    category   = db.Column(db.String(30))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        diff = datetime.utcnow() - self.created_at
        m    = int(diff.total_seconds() // 60)
        ago  = "just now" if m < 1 else f"{m} min ago" if m < 60 else f"{m//60} hr ago" if m < 1440 else f"{m//1440} days ago"
        return {"id": self.id, "action": self.action, "category": self.category, "ago": ago}


class Event(db.Model):
    __tablename__ = "events"
    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, default="")
    date        = db.Column(db.DateTime)
    time        = db.Column(db.String(20), default="")
    location    = db.Column(db.String(150), default="")
    event_type  = db.Column(db.String(50), default="General")
    image_url   = db.Column(db.String(300), default="")
    created_by  = db.Column(db.Integer, db.ForeignKey("users.id"))
    rsvps       = db.Column(db.Text, default="")   # comma-separated user IDs
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    creator     = db.relationship("User", backref="events")

    def get_rsvp_list(self):
        return [int(x) for x in self.rsvps.split(",") if x.strip()]

    def to_dict(self, current_user_id=None):
        rsvp_list = self.get_rsvp_list()
        return {
            "id": self.id, "title": self.title, "description": self.description,
            "date": self.date.strftime("%d %b %Y") if self.date else "",
            "date_raw": self.date.isoformat() if self.date else "",
            "time": self.time, "location": self.location, "event_type": self.event_type,
            "image_url": self.image_url,
            "creator_name": self.creator.name if self.creator else "Admin",
            "rsvp_count": len(rsvp_list),
            "is_rsvped": current_user_id in rsvp_list if current_user_id else False,
            "created_at": self.created_at.strftime("%d %b %Y")
        }


class SuccessStory(db.Model):
    __tablename__ = "success_stories"
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"))
    title       = db.Column(db.String(200), nullable=False)
    story       = db.Column(db.Text, nullable=False)
    achievement = db.Column(db.String(200), default="")
    company     = db.Column(db.String(150), default="")
    year        = db.Column(db.String(10), default="")
    image_url   = db.Column(db.String(300), default="")
    is_approved = db.Column(db.Boolean, default=False)
    likes       = db.Column(db.Text, default="")   # comma-separated user IDs
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    author      = db.relationship("User", backref="stories")

    def get_likes_list(self):
        return [int(x) for x in self.likes.split(",") if x.strip()]

    def to_dict(self, current_user_id=None):
        likes_list = self.get_likes_list()
        return {
            "id": self.id, "user_id": self.user_id, "title": self.title,
            "story": self.story, "achievement": self.achievement,
            "company": self.company, "year": self.year, "image_url": self.image_url,
            "is_approved": self.is_approved,
            "author_name": self.author.name if self.author else "",
            "like_count": len(likes_list),
            "is_liked": current_user_id in likes_list if current_user_id else False,
            "created_at": self.created_at.strftime("%d %b %Y")
        }


class Feedback(db.Model):
    __tablename__ = "feedback"
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"))
    category    = db.Column(db.String(50), default="General")
    message     = db.Column(db.Text, nullable=False)
    rating      = db.Column(db.Integer, default=0)
    is_resolved = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    user        = db.relationship("User", backref="feedback")

    def to_dict(self):
        return {
            "id": self.id, "user_id": self.user_id,
            "user_name": self.user.name if self.user else "",
            "category": self.category, "message": self.message,
            "rating": self.rating, "is_resolved": self.is_resolved,
            "created_at": self.created_at.strftime("%d %b %Y")
        }


class ForumPost(db.Model):
    __tablename__ = "forum_posts"
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"))
    title       = db.Column(db.String(200), nullable=False)
    body        = db.Column(db.Text, nullable=False)
    category    = db.Column(db.String(50), default="General")
    tags        = db.Column(db.String(200), default="")
    likes       = db.Column(db.Text, default="")
    is_approved = db.Column(db.Boolean, default=True)
    is_pinned   = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    author      = db.relationship("User", backref="posts")
    comments    = db.relationship("Comment", backref="post", lazy="dynamic")

    def get_likes_list(self):
        return [int(x) for x in self.likes.split(",") if x.strip()]

    def get_tags_list(self):
        return [t.strip() for t in self.tags.split(",") if t.strip()]

    def to_dict(self, current_user_id=None):
        likes_list = self.get_likes_list()
        diff = datetime.utcnow() - self.created_at
        m    = int(diff.total_seconds() // 60)
        ago  = "just now" if m < 1 else f"{m} min ago" if m < 60 else f"{m//60} hr ago" if m < 1440 else f"{m//1440}d ago"
        return {
            "id": self.id, "user_id": self.user_id, "title": self.title,
            "body": self.body, "category": self.category,
            "tags": self.get_tags_list(), "is_pinned": self.is_pinned,
            "author_name": self.author.name if self.author else "",
            "author_role": self.author.role if self.author else "",
            "like_count": len(likes_list),
            "is_liked": current_user_id in likes_list if current_user_id else False,
            "comment_count": self.comments.count(),
            "ago": ago, "created_at": self.created_at.strftime("%d %b %Y")
        }


class Comment(db.Model):
    __tablename__ = "comments"
    id         = db.Column(db.Integer, primary_key=True)
    post_id    = db.Column(db.Integer, db.ForeignKey("forum_posts.id"))
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"))
    body       = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    author     = db.relationship("User", backref="comments")

    def to_dict(self):
        diff = datetime.utcnow() - self.created_at
        m    = int(diff.total_seconds() // 60)
        ago  = "just now" if m < 1 else f"{m} min ago" if m < 60 else f"{m//60} hr ago"
        return {
            "id": self.id, "post_id": self.post_id,
            "body": self.body, "user_id": self.user_id,
            "author_name": self.author.name if self.author else "",
            "author_role": self.author.role if self.author else "",
            "ago": ago, "created_at": self.created_at.strftime("%d %b %Y, %H:%M")
        }


class Mentor(db.Model):
    __tablename__ = "mentors"
    id           = db.Column(db.Integer, primary_key=True)
    mentor_id    = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True)
    domains      = db.Column(db.String(300), default="")
    bio          = db.Column(db.Text, default="")
    availability = db.Column(db.String(100), default="")
    is_active    = db.Column(db.Boolean, default=True)
    request_count= db.Column(db.Integer, default=0)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)
    user         = db.relationship("User", backref="mentor_profile")

    def get_domains_list(self):
        return [d.strip() for d in self.domains.split(",") if d.strip()]

    def to_dict(self):
        alumni = Alumni.query.filter_by(user_id=self.mentor_id).first()
        return {
            "id": self.id, "mentor_id": self.mentor_id,
            "mentor_name": self.user.name if self.user else "",
            "company":     alumni.company     if alumni else "",
            "designation": alumni.designation if alumni else "",
            "skills":      alumni.get_skills_list() if alumni else [],
            "domains": self.get_domains_list(), "bio": self.bio,
            "availability": self.availability, "requests": self.request_count,
            "created_at": self.created_at.strftime("%d %b %Y")
        }


class Gallery(db.Model):
    __tablename__ = "gallery"
    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(150), default="")
    description = db.Column(db.Text, default="")
    url         = db.Column(db.String(300), nullable=False)
    media_type  = db.Column(db.String(20), default="photo")
    event_name  = db.Column(db.String(150), default="")
    uploaded_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "title": self.title, "description": self.description,
            "url": self.url, "media_type": self.media_type,
            "event_name": self.event_name,
            "created_at": self.created_at.strftime("%d %b %Y")
        }


class Contribution(db.Model):
    __tablename__ = "contributions"
    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey("users.id"))
    donor_name   = db.Column(db.String(100), default="")
    amount       = db.Column(db.Float, nullable=False)
    cause        = db.Column(db.String(100), default="General Scholarship")
    message      = db.Column(db.Text, default="")
    is_anonymous = db.Column(db.Boolean, default=False)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "donor_name": "Anonymous" if self.is_anonymous else self.donor_name,
            "amount": self.amount, "cause": self.cause,
            "message": self.message,
            "created_at": self.created_at.strftime("%d %b %Y")
        }


class Opportunity(db.Model):
    __tablename__ = "opportunities"
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"))
    title       = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, default="")
    company     = db.Column(db.String(150), default="")
    location    = db.Column(db.String(100), default="")
    opp_type    = db.Column(db.String(50), default="Job")
    deadline    = db.Column(db.DateTime)
    apply_link  = db.Column(db.String(300), default="")
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    poster      = db.relationship("User", backref="opportunities")

    def to_dict(self):
        return {
            "id": self.id, "title": self.title, "description": self.description,
            "company": self.company, "location": self.location, "opp_type": self.opp_type,
            "deadline": self.deadline.strftime("%d %b %Y") if self.deadline else "",
            "apply_link": self.apply_link, "posted_by": self.user_id,
            "poster_name": self.poster.name if self.poster else "",
            "created_at": self.created_at.strftime("%d %b %Y")
        }


class Contact(db.Model):
    __tablename__ = "contacts"
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    email       = db.Column(db.String(120), nullable=False)
    subject     = db.Column(db.String(150), default="General Inquiry")
    message     = db.Column(db.Text, nullable=False)
    is_resolved = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "email": self.email,
            "subject": self.subject, "message": self.message,
            "is_resolved": self.is_resolved,
            "created_at": self.created_at.strftime("%d %b %Y")
        }


# ═══════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════

def log_activity(action, category):
    act = Activity(action=action, category=category)
    db.session.add(act)
    db.session.commit()
    socketio.emit("new_activity", {"action": action, "category": category, "ago": "just now"})


# ═══════════════════════════════════════════════════════════════
#  JWT + RBAC DECORATORS
# ═══════════════════════════════════════════════════════════════

def gen_token(user_id, role):
    return jwt.encode(
        {"user_id": user_id, "role": role, "exp": datetime.utcnow() + timedelta(hours=24)},
        app.config["SECRET_KEY"], algorithm="HS256"
    )


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token: return jsonify({"error": "Token missing"}), 401
        try:
            request.current_user = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired — please login again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            if request.current_user.get("role") not in roles:
                return jsonify({"error": f"Access denied. Required: {', '.join(roles)}"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


# ═══════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/auth/register", methods=["POST"])
@limiter.limit("10 per hour")
def register():
    d = request.get_json()
    for f in ["name", "email", "password", "role"]:
        if not d.get(f): return jsonify({"error": f"{f} is required"}), 400
    if len(d["password"]) < 6: return jsonify({"error": "Password min 6 characters"}), 400
    if d["role"] not in ["alumni", "student"]: return jsonify({"error": "Invalid role"}), 400
    if User.query.filter_by(email=d["email"].lower().strip()).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(name=d["name"].strip(), email=d["email"].lower().strip(),
                password=d["password"], role=d["role"])
    db.session.add(user)
    db.session.flush()

    if d["role"] == "alumni":
        if not d.get("batch_year"): return jsonify({"error": "batch_year required for alumni"}), 400
        profile = Alumni(
            user_id=user.id, batch_year=int(d["batch_year"]),
            company=d.get("company",""), designation=d.get("designation",""),
            location=d.get("location",""), skills=d.get("skills",""),
            linkedin=d.get("linkedin",""), twitter=d.get("twitter",""),
            facebook=d.get("facebook",""), instagram=d.get("instagram","")
        )
        db.session.add(profile)

    db.session.commit()
    log_activity(f"{d['name']} registered as {d['role']}", "registration")
    return jsonify({"message": "Registered! Awaiting admin approval.", "user_id": user.id}), 201


@app.route("/api/auth/login", methods=["POST"])
@limiter.limit("20 per hour")
def login():
    d = request.get_json()
    if not d.get("email") or not d.get("password"):
        return jsonify({"error": "Email and password required"}), 400
    user = User.query.filter_by(email=d["email"].lower().strip(), password=d["password"]).first()
    if not user: return jsonify({"error": "Invalid email or password"}), 401
    if not user.is_approved and user.role != "admin":
        return jsonify({"error": "Account pending admin approval"}), 403

    token  = gen_token(user.id, user.role)
    result = user.to_dict()

    if user.role == "alumni" and user.alumni_profile:
        p = user.alumni_profile[0]
        result.update({
            "alumni_id": p.id, "batch_year": p.batch_year,
            "company": p.company, "designation": p.designation,
            "skills": p.get_skills_list(),
            "linkedin": p.linkedin, "twitter": p.twitter,
            "facebook": p.facebook, "instagram": p.instagram
        })

    result["unread_count"] = Message.query.filter_by(to_id=user.id, is_read=False).count()
    return jsonify({"message": "Login successful", "token": token, "user": result}), 200


@app.route("/api/auth/seed", methods=["GET", "POST"])
def seed():
    if User.query.filter_by(email="admin@alumni.com").first():
        return jsonify({"message": "Admin already exists"}), 200
    admin = User(name="Admin", email="admin@alumni.com", password="admin123", role="admin", is_approved=True)
    db.session.add(admin)
    db.session.commit()
    return jsonify({"message": "Admin created ✅", "email": "admin@alumni.com", "password": "admin123"}), 201


# ═══════════════════════════════════════════════════════════════
#  ALUMNI ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/alumni", methods=["GET"])
@token_required
def get_alumni():
    query = Alumni.query.join(User).filter(User.is_approved == True)
    if request.args.get("batch_year"): query = query.filter(Alumni.batch_year == int(request.args["batch_year"]))
    if request.args.get("location"):   query = query.filter(Alumni.location.ilike(f"%{request.args['location']}%"))
    if request.args.get("skill"):      query = query.filter(Alumni.skills.ilike(f"%{request.args['skill']}%"))
    if request.args.get("search"):     query = query.filter(User.name.ilike(f"%{request.args['search']}%"))
    alumni_list = query.all()
    all_alumni  = Alumni.query.join(User).filter(User.is_approved == True).all()
    batch_set   = {a.batch_year for a in all_alumni if a.batch_year}   # Python set
    loc_set     = {a.location   for a in all_alumni if a.location}     # Python set
    return jsonify({
        "alumni":      [a.to_dict() for a in alumni_list],
        "count":       len(alumni_list),
        "batch_years": sorted(list(batch_set), reverse=True),
        "locations":   sorted(list(loc_set))
    }), 200


@app.route("/api/alumni/<int:alumni_id>", methods=["GET"])
@token_required
def get_one_alumni(alumni_id):
    a = Alumni.query.get(alumni_id)
    if not a: return jsonify({"error": "Not found"}), 404
    return jsonify(a.to_dict()), 200


@app.route("/api/alumni/<int:alumni_id>", methods=["PUT"])
@token_required
def update_alumni(alumni_id):
    a = Alumni.query.get(alumni_id)
    if not a: return jsonify({"error": "Not found"}), 404
    if a.user_id != request.current_user["user_id"]:
        return jsonify({"error": "Not authorized"}), 403
    d = request.get_json()
    for field in ["company","designation","location","bio","linkedin","twitter","facebook","instagram"]:
        if field in d: setattr(a, field, d[field])
    if "skills" in d:
        a.skills = d["skills"] if isinstance(d["skills"], str) else ", ".join(d["skills"])
    db.session.commit()
    return jsonify({"message": "Profile updated"}), 200


# ═══════════════════════════════════════════════════════════════
#  EVENTS ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/events", methods=["GET"])
@token_required
def get_events():
    uid    = request.current_user["user_id"]
    events = Event.query.order_by(Event.date).all()
    return jsonify({"events": [e.to_dict(current_user_id=uid) for e in events], "count": len(events)}), 200


@app.route("/api/events", methods=["POST"])
@role_required("admin")
def create_event():
    d = request.get_json()
    if not d.get("title"): return jsonify({"error": "title required"}), 400
    e = Event(
        title=d["title"], description=d.get("description",""),
        date=datetime.fromisoformat(d["date"]) if d.get("date") else datetime.utcnow(),
        time=d.get("time",""), location=d.get("location",""),
        event_type=d.get("event_type","General"), image_url=d.get("image_url",""),
        created_by=request.current_user["user_id"]
    )
    db.session.add(e)
    db.session.commit()
    log_activity(f"New event: {d['title']}", "event")
    return jsonify({"message": "Event created!"}), 201


@app.route("/api/events/<int:event_id>", methods=["DELETE"])
@role_required("admin")
def delete_event(event_id):
    e = Event.query.get(event_id)
    if not e: return jsonify({"error": "Not found"}), 404
    db.session.delete(e); db.session.commit()
    return jsonify({"message": "Deleted"}), 200


@app.route("/api/events/<int:event_id>/rsvp", methods=["POST"])
@token_required
def rsvp_event(event_id):
    uid = request.current_user["user_id"]
    e   = Event.query.get(event_id)
    if not e: return jsonify({"error": "Not found"}), 404
    rsvp_list = e.get_rsvp_list()
    if uid in rsvp_list:
        rsvp_list.remove(uid)
        e.rsvps = ",".join(str(x) for x in rsvp_list)
        db.session.commit()
        return jsonify({"message": "RSVP cancelled", "rsvped": False}), 200
    rsvp_list.append(uid)
    e.rsvps = ",".join(str(x) for x in rsvp_list)
    db.session.commit()
    log_activity(f"User RSVP'd to {e.title}", "event")
    return jsonify({"message": "RSVP confirmed!", "rsvped": True}), 200


# ═══════════════════════════════════════════════════════════════
#  SUCCESS STORIES ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/success-stories", methods=["GET"])
@token_required
def get_stories():
    uid      = request.current_user["user_id"]
    approved = request.args.get("approved") != "false"
    q        = SuccessStory.query.filter_by(is_approved=True) if approved else SuccessStory.query
    stories  = q.order_by(SuccessStory.created_at.desc()).all()
    return jsonify({"stories": [s.to_dict(current_user_id=uid) for s in stories], "count": len(stories)}), 200


@app.route("/api/success-stories", methods=["POST"])
@role_required("alumni")
def create_story():
    d = request.get_json()
    if not d.get("title") or not d.get("story"):
        return jsonify({"error": "title and story required"}), 400
    s = SuccessStory(
        user_id=request.current_user["user_id"], title=d["title"], story=d["story"],
        achievement=d.get("achievement",""), company=d.get("company",""),
        year=d.get("year",""), image_url=d.get("image_url","")
    )
    db.session.add(s); db.session.commit()
    log_activity("A new success story was submitted", "story")
    return jsonify({"message": "Story submitted! Awaiting admin approval."}), 201


@app.route("/api/success-stories/<int:story_id>/like", methods=["POST"])
@token_required
def like_story(story_id):
    uid = request.current_user["user_id"]
    s   = SuccessStory.query.get(story_id)
    if not s: return jsonify({"error": "Not found"}), 404
    likes = s.get_likes_list()
    if uid in likes:
        likes.remove(uid); s.likes = ",".join(str(x) for x in likes)
        db.session.commit(); return jsonify({"liked": False}), 200
    likes.append(uid); s.likes = ",".join(str(x) for x in likes)
    db.session.commit(); return jsonify({"liked": True}), 200


@app.route("/api/success-stories/<int:story_id>/approve", methods=["PUT"])
@role_required("admin")
def approve_story(story_id):
    s = SuccessStory.query.get(story_id)
    if not s: return jsonify({"error": "Not found"}), 404
    s.is_approved = True; db.session.commit()
    return jsonify({"message": "Story approved"}), 200


@app.route("/api/success-stories/<int:story_id>", methods=["DELETE"])
@role_required("admin")
def delete_story(story_id):
    s = SuccessStory.query.get(story_id)
    if not s: return jsonify({"error": "Not found"}), 404
    db.session.delete(s); db.session.commit()
    return jsonify({"message": "Deleted"}), 200


# ═══════════════════════════════════════════════════════════════
#  FEEDBACK ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/feedback", methods=["POST"])
@token_required
def submit_feedback():
    d = request.get_json()
    if not d.get("message"): return jsonify({"error": "message required"}), 400
    f = Feedback(user_id=request.current_user["user_id"], category=d.get("category","General"),
                 message=d["message"], rating=int(d.get("rating", 0)))
    db.session.add(f); db.session.commit()
    return jsonify({"message": "Feedback submitted! Thank you."}), 201


@app.route("/api/feedback", methods=["GET"])
@role_required("admin")
def get_feedback():
    fbs = Feedback.query.order_by(Feedback.created_at.desc()).all()
    return jsonify({"feedback": [f.to_dict() for f in fbs], "count": len(fbs)}), 200


@app.route("/api/feedback/<int:fb_id>/resolve", methods=["PUT"])
@role_required("admin")
def resolve_feedback(fb_id):
    f = Feedback.query.get(fb_id)
    if not f: return jsonify({"error": "Not found"}), 404
    f.is_resolved = True; db.session.commit()
    return jsonify({"message": "Resolved"}), 200


# ═══════════════════════════════════════════════════════════════
#  FORUM ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/forum", methods=["GET"])
@token_required
def get_forum():
    uid = request.current_user["user_id"]
    q   = ForumPost.query.filter_by(is_approved=True)
    if request.args.get("category"): q = q.filter_by(category=request.args["category"])
    posts = q.order_by(ForumPost.is_pinned.desc(), ForumPost.created_at.desc()).all()
    return jsonify({"posts": [p.to_dict(current_user_id=uid) for p in posts], "count": len(posts)}), 200


@app.route("/api/forum", methods=["POST"])
@token_required
def create_post():
    d = request.get_json()
    if not d.get("title") or not d.get("body"):
        return jsonify({"error": "title and body required"}), 400
    tags = d.get("tags", [])
    p = ForumPost(
        user_id=request.current_user["user_id"], title=d["title"], body=d["body"],
        category=d.get("category","General"),
        tags=", ".join(tags) if isinstance(tags, list) else tags
    )
    db.session.add(p); db.session.commit()
    user = User.query.get(request.current_user["user_id"])
    log_activity(f"{user.name if user else 'User'} posted: {d['title'][:40]}", "forum")
    return jsonify({"message": "Post created!"}), 201


@app.route("/api/forum/<int:post_id>/like", methods=["POST"])
@token_required
def like_post(post_id):
    uid = request.current_user["user_id"]
    p   = ForumPost.query.get(post_id)
    if not p: return jsonify({"error": "Not found"}), 404
    likes = p.get_likes_list()
    if uid in likes:
        likes.remove(uid); p.likes = ",".join(str(x) for x in likes)
        db.session.commit(); return jsonify({"liked": False}), 200
    likes.append(uid); p.likes = ",".join(str(x) for x in likes)
    db.session.commit(); return jsonify({"liked": True}), 200


@app.route("/api/forum/<int:post_id>/comments", methods=["GET"])
@token_required
def get_comments(post_id):
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at).all()
    return jsonify({"comments": [c.to_dict() for c in comments]}), 200


@app.route("/api/forum/<int:post_id>/comments", methods=["POST"])
@token_required
def add_comment(post_id):
    d = request.get_json()
    if not d.get("body"): return jsonify({"error": "body required"}), 400
    c = Comment(post_id=post_id, user_id=request.current_user["user_id"], body=d["body"])
    db.session.add(c); db.session.commit()
    return jsonify({"message": "Comment added!"}), 201


@app.route("/api/forum/<int:post_id>", methods=["DELETE"])
@token_required
def delete_post(post_id):
    p = ForumPost.query.get(post_id)
    if not p: return jsonify({"error": "Not found"}), 404
    u = request.current_user
    if p.user_id != u["user_id"] and u["role"] != "admin":
        return jsonify({"error": "Not authorized"}), 403
    p.is_approved = False; db.session.commit()
    return jsonify({"message": "Post removed"}), 200


@app.route("/api/forum/<int:post_id>/pin", methods=["PUT"])
@role_required("admin")
def pin_post(post_id):
    p = ForumPost.query.get(post_id)
    if not p: return jsonify({"error": "Not found"}), 404
    p.is_pinned = not p.is_pinned; db.session.commit()
    return jsonify({"message": "Toggled pin"}), 200


# ═══════════════════════════════════════════════════════════════
#  MENTORSHIP ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/mentorship", methods=["GET"])
@token_required
def get_mentors():
    mentors = Mentor.query.filter_by(is_active=True).all()
    return jsonify({"mentors": [m.to_dict() for m in mentors], "count": len(mentors)}), 200


@app.route("/api/mentorship/register", methods=["POST"])
@role_required("alumni")
def register_mentor():
    d   = request.get_json()
    uid = request.current_user["user_id"]
    m   = Mentor.query.filter_by(mentor_id=uid).first()
    domains = d.get("domains", [])
    domains_str = ", ".join(domains) if isinstance(domains, list) else domains
    if m:
        m.domains = domains_str; m.bio = d.get("bio",""); m.availability = d.get("availability",""); m.is_active = True
    else:
        m = Mentor(mentor_id=uid, domains=domains_str, bio=d.get("bio",""), availability=d.get("availability",""))
        db.session.add(m)
    db.session.commit()
    user = User.query.get(uid)
    log_activity(f"{user.name if user else 'Alumni'} registered as mentor", "mentorship")
    return jsonify({"message": "Registered as mentor!"}), 201


@app.route("/api/mentorship/<int:mentor_id>/request", methods=["POST"])
@token_required
def request_mentorship(mentor_id):
    d = request.get_json()
    m = Mentor.query.get(mentor_id)
    if not m: return jsonify({"error": "Mentor not found"}), 404
    m.request_count += 1
    msg = Message(from_id=request.current_user["user_id"], to_id=m.mentor_id,
                  subject="Mentorship Request", body=d.get("message","I would love to connect for mentorship guidance."))
    db.session.add(msg); db.session.commit()
    socketio.emit("new_message", {"to_id": m.mentor_id}, room=str(m.mentor_id))
    return jsonify({"message": "Mentorship request sent!"}), 201


# ═══════════════════════════════════════════════════════════════
#  GALLERY ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/gallery", methods=["GET"])
@token_required
def get_gallery():
    items = Gallery.query.order_by(Gallery.created_at.desc()).all()
    return jsonify({"gallery": [i.to_dict() for i in items], "count": len(items)}), 200


@app.route("/api/gallery", methods=["POST"])
@role_required("admin")
def add_gallery():
    d = request.get_json()
    if not d.get("url"): return jsonify({"error": "url required"}), 400
    g = Gallery(title=d.get("title",""), description=d.get("description",""),
                url=d["url"], media_type=d.get("media_type","photo"),
                event_name=d.get("event_name",""), uploaded_by=request.current_user["user_id"])
    db.session.add(g); db.session.commit()
    return jsonify({"message": "Added to gallery!"}), 201


@app.route("/api/gallery/<int:item_id>", methods=["DELETE"])
@role_required("admin")
def delete_gallery(item_id):
    g = Gallery.query.get(item_id)
    if not g: return jsonify({"error": "Not found"}), 404
    db.session.delete(g); db.session.commit()
    return jsonify({"message": "Deleted"}), 200


# ═══════════════════════════════════════════════════════════════
#  CONTRIBUTIONS ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/contributions", methods=["POST"])
@token_required
def contribute():
    d    = request.get_json()
    user = User.query.get(request.current_user["user_id"])
    if not d.get("amount"): return jsonify({"error": "amount required"}), 400
    c = Contribution(
        user_id=request.current_user["user_id"],
        donor_name=d.get("donor_name", user.name if user else ""),
        amount=float(d["amount"]), cause=d.get("cause","General Scholarship"),
        message=d.get("message",""), is_anonymous=d.get("is_anonymous", False)
    )
    db.session.add(c); db.session.commit()
    log_activity("New contribution received", "contribution")
    return jsonify({"message": "Thank you for your contribution! 🙏"}), 201


@app.route("/api/contributions", methods=["GET"])
@token_required
def get_contributions():
    contribs = Contribution.query.order_by(Contribution.created_at.desc()).all()
    # Python list comprehension + sum for total
    total = sum(c.amount for c in contribs)
    return jsonify({"contributions": [c.to_dict() for c in contribs], "total": round(total, 2), "count": len(contribs)}), 200


# ═══════════════════════════════════════════════════════════════
#  OPPORTUNITIES ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/opportunities", methods=["GET"])
@token_required
def get_opportunities():
    q = Opportunity.query
    if request.args.get("type"): q = q.filter_by(opp_type=request.args["type"])
    opps = q.order_by(Opportunity.created_at.desc()).all()
    return jsonify({"opportunities": [o.to_dict() for o in opps], "count": len(opps)}), 200


@app.route("/api/opportunities", methods=["POST"])
@token_required
def create_opportunity():
    d = request.get_json()
    if not d.get("title"): return jsonify({"error": "title required"}), 400
    o = Opportunity(
        user_id=request.current_user["user_id"], title=d["title"],
        description=d.get("description",""), company=d.get("company",""),
        location=d.get("location",""), opp_type=d.get("opp_type","Job"),
        deadline=datetime.fromisoformat(d["deadline"]) if d.get("deadline") else None,
        apply_link=d.get("apply_link","")
    )
    db.session.add(o); db.session.commit()
    user = User.query.get(request.current_user["user_id"])
    log_activity(f"{user.name if user else 'User'} posted: {d['title'][:40]}", "opportunity")
    return jsonify({"message": "Opportunity posted!"}), 201


@app.route("/api/opportunities/<int:opp_id>", methods=["DELETE"])
@token_required
def delete_opportunity(opp_id):
    o = Opportunity.query.get(opp_id)
    if not o: return jsonify({"error": "Not found"}), 404
    u = request.current_user
    if o.user_id != u["user_id"] and u["role"] != "admin":
        return jsonify({"error": "Not authorized"}), 403
    db.session.delete(o); db.session.commit()
    return jsonify({"message": "Deleted"}), 200


# ═══════════════════════════════════════════════════════════════
#  CONTACT ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/contact", methods=["POST"])
def contact_us():
    d = request.get_json()
    for f in ["name","email","message"]:
        if not d.get(f): return jsonify({"error": f"{f} required"}), 400
    c = Contact(name=d["name"], email=d["email"], subject=d.get("subject","General Inquiry"), message=d["message"])
    db.session.add(c); db.session.commit()
    return jsonify({"message": "Message received! We will get back to you soon."}), 201


@app.route("/api/contact", methods=["GET"])
@role_required("admin")
def get_contacts():
    contacts = Contact.query.order_by(Contact.created_at.desc()).all()
    return jsonify({"contacts": [c.to_dict() for c in contacts], "count": len(contacts)}), 200


@app.route("/api/contact/<int:contact_id>/resolve", methods=["PUT"])
@role_required("admin")
def resolve_contact(contact_id):
    c = Contact.query.get(contact_id)
    if not c: return jsonify({"error": "Not found"}), 404
    c.is_resolved = True; db.session.commit()
    return jsonify({"message": "Resolved"}), 200


# ═══════════════════════════════════════════════════════════════
#  MESSAGES ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/messages", methods=["POST"])
@token_required
@limiter.limit("50 per day")
def send_message():
    d = request.get_json()
    if not d.get("to_id") or not d.get("body"): return jsonify({"error": "to_id and body required"}), 400
    msg = Message(from_id=request.current_user["user_id"], to_id=d["to_id"],
                  subject=d.get("subject","No Subject"), body=d["body"])
    db.session.add(msg); db.session.commit()
    socketio.emit("new_message", {"to_id": d["to_id"]}, room=str(d["to_id"]))
    sender   = User.query.get(request.current_user["user_id"])
    receiver = User.query.get(d["to_id"])
    if sender and receiver:
        log_activity(f"{sender.name} messaged {receiver.name}", "message")
    return jsonify({"message": "Message sent!"}), 201


@app.route("/api/messages/inbox/<int:user_id>", methods=["GET"])
@token_required
def get_inbox(user_id):
    msgs = Message.query.filter_by(to_id=user_id).order_by(Message.created_at.desc()).all()
    return jsonify({"messages": [m.to_dict() for m in msgs], "count": len(msgs)}), 200


@app.route("/api/messages/sent/<int:user_id>", methods=["GET"])
@token_required
def get_sent(user_id):
    msgs = Message.query.filter_by(from_id=user_id).order_by(Message.created_at.desc()).all()
    return jsonify({"messages": [m.to_dict() for m in msgs]}), 200


@app.route("/api/messages/read/<int:msg_id>", methods=["PUT"])
@token_required
def mark_read(msg_id):
    msg = Message.query.get(msg_id)
    if msg: msg.is_read = True; db.session.commit()
    return jsonify({"message": "Marked as read"}), 200


@app.route("/api/messages/unread/<int:user_id>", methods=["GET"])
@token_required
def unread_count(user_id):
    return jsonify({"count": Message.query.filter_by(to_id=user_id, is_read=False).count()}), 200


# ═══════════════════════════════════════════════════════════════
#  ACTIVITIES ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/activities", methods=["GET"])
@token_required
def get_activities():
    acts = Activity.query.order_by(Activity.created_at.desc()).limit(20).all()
    return jsonify({"activities": [a.to_dict() for a in acts]}), 200


# ═══════════════════════════════════════════════════════════════
#  ADMIN ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/admin/pending", methods=["GET"])
@role_required("admin")
def pending_users():
    users = User.query.filter_by(is_approved=False).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200


@app.route("/api/admin/approve/<int:user_id>", methods=["PUT"])
@role_required("admin")
def approve_user(user_id):
    user = User.query.get(user_id)
    if not user: return jsonify({"error": "Not found"}), 404
    user.is_approved = True; db.session.commit()
    log_activity(f"{user.name}'s account was approved", "approval")
    socketio.emit("account_approved", {"user_id": user_id})
    return jsonify({"message": f"{user.name} approved!"}), 200


@app.route("/api/admin/reject/<int:user_id>", methods=["DELETE"])
@role_required("admin")
def reject_user(user_id):
    user = User.query.get(user_id)
    if not user: return jsonify({"error": "Not found"}), 404
    Alumni.query.filter_by(user_id=user_id).delete()
    db.session.delete(user); db.session.commit()
    return jsonify({"message": "Rejected"}), 200


@app.route("/api/admin/stats", methods=["GET"])
@role_required("admin")
def get_stats():
    all_alumni = Alumni.query.join(User).filter(User.is_approved == True).all()
    # Python dicts for aggregation
    companies  = {}
    batch_dict = {}
    for a in all_alumni:
        if a.company:    companies[a.company]       = companies.get(a.company, 0) + 1
        if a.batch_year: batch_dict[a.batch_year]   = batch_dict.get(a.batch_year, 0) + 1
    sorted_batches = sorted(batch_dict.keys())
    total_contrib  = sum(c.amount for c in Contribution.query.all())
    return jsonify({
        "total_alumni":        len(all_alumni),
        "total_students":      User.query.filter_by(role="student", is_approved=True).count(),
        "pending":             User.query.filter_by(is_approved=False).count(),
        "total_jobs":          Job.query.count(),
        "total_messages":      Message.query.count(),
        "total_events":        Event.query.count(),
        "total_stories":       SuccessStory.query.filter_by(is_approved=True).count(),
        "pending_stories":     SuccessStory.query.filter_by(is_approved=False).count(),
        "total_forum_posts":   ForumPost.query.filter_by(is_approved=True).count(),
        "total_mentors":       Mentor.query.filter_by(is_active=True).count(),
        "total_feedback":      Feedback.query.count(),
        "pending_feedback":    Feedback.query.filter_by(is_resolved=False).count(),
        "total_contributions": round(total_contrib, 2),
        "total_opportunities": Opportunity.query.count(),
        "unresolved_contacts": Contact.query.filter_by(is_resolved=False).count(),
        "batch_years":         sorted_batches,
        "batch_counts":        [batch_dict[y] for y in sorted_batches],
        "top_companies":       sorted(companies.items(), key=lambda x: x[1], reverse=True)[:5],
    }), 200


@app.route("/api/admin/export-csv", methods=["GET"])
@role_required("admin")
def export_csv():
    all_alumni = Alumni.query.join(User).filter(User.is_approved == True).all()
    output     = io.StringIO()
    writer     = csv.writer(output)
    writer.writerow(["Name","Email","Batch Year","Company","Designation","Location","Skills","LinkedIn","Twitter","Facebook","Instagram"])
    for a in all_alumni:
        writer.writerow([a.user.name, a.user.email, a.batch_year, a.company,
                         a.designation, a.location, ", ".join(a.get_skills_list()),
                         a.linkedin, a.twitter, a.facebook, a.instagram])
    output.seek(0)
    return Response(output, mimetype="text/csv", headers={"Content-Disposition": "attachment;filename=alumni_directory.csv"})


# ═══════════════════════════════════════════════════════════════
#  GLOBAL SEARCH
# ═══════════════════════════════════════════════════════════════

@app.route("/api/search", methods=["GET"])
@token_required
def global_search():
    q = request.args.get("q","").strip()
    if not q: return jsonify({"alumni":[],"jobs":[],"events":[],"opportunities":[]}), 200
    alumni = Alumni.query.join(User).filter(User.is_approved==True, User.name.ilike(f"%{q}%")).limit(5).all()
    jobs   = Job.query.filter(Job.title.ilike(f"%{q}%") | Job.company.ilike(f"%{q}%")).limit(5).all()
    events = Event.query.filter(Event.title.ilike(f"%{q}%")).limit(3).all()
    opps   = Opportunity.query.filter(Opportunity.title.ilike(f"%{q}%")).limit(3).all()
    return jsonify({
        "alumni":        [{"id": a.id, "name": a.user.name, "company": a.company, "batch_year": a.batch_year} for a in alumni],
        "jobs":          [{"id": j.id, "title": j.title, "company": j.company} for j in jobs],
        "events":        [{"id": e.id, "title": e.title} for e in events],
        "opportunities": [{"id": o.id, "title": o.title, "company": o.company} for o in opps]
    }), 200


# ═══════════════════════════════════════════════════════════════
#  JOBS ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/api/jobs", methods=["GET"])
@token_required
def get_jobs():
    q = Job.query
    if request.args.get("job_type"): q = q.filter_by(job_type=request.args["job_type"])
    if request.args.get("search"):
        s = request.args["search"]
        q = q.filter(Job.title.ilike(f"%{s}%") | Job.company.ilike(f"%{s}%"))
    return jsonify({"jobs": [j.to_dict() for j in q.order_by(Job.created_at.desc()).all()]}), 200


@app.route("/api/jobs", methods=["POST"])
@role_required("alumni")
@limiter.limit("20 per day")
def create_job():
    d = request.get_json()
    if not d.get("title") or not d.get("company"):
        return jsonify({"error": "title and company required"}), 400
    j = Job(title=d["title"], company=d["company"], location=d.get("location",""),
            job_type=d.get("job_type","Full-time"), description=d.get("description",""),
            salary=d.get("salary",""), apply_link=d.get("apply_link",""),
            posted_by=request.current_user["user_id"])
    db.session.add(j); db.session.commit()
    user = User.query.get(request.current_user["user_id"])
    log_activity(f"{d['title']} posted at {d['company']} by {user.name if user else 'Alumni'}", "job")
    return jsonify({"message": "Job posted!"}), 201


@app.route("/api/jobs/<int:job_id>", methods=["DELETE"])
@token_required
def delete_job(job_id):
    j = Job.query.get(job_id)
    if not j: return jsonify({"error": "Not found"}), 404
    u = request.current_user
    if j.posted_by != u["user_id"] and u["role"] != "admin":
        return jsonify({"error": "Not authorized"}), 403
    db.session.delete(j); db.session.commit()
    return jsonify({"message": "Deleted"}), 200


# ═══════════════════════════════════════════════════════════════
#  WEBSOCKET EVENTS
# ═══════════════════════════════════════════════════════════════

@socketio.on("join")
def on_join(data):
    uid = data.get("user_id")
    if uid: join_room(str(uid)); print(f"[WS] User {uid} joined room")

@socketio.on("connect")
def on_connect(): print(f"[WS] Connected: {request.sid}")

@socketio.on("disconnect")
def on_disconnect(): print(f"[WS] Disconnected: {request.sid}")


# ═══════════════════════════════════════════════════════════════
#  START
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("\n" + "="*58)
        print("  🎓 Alumni Network Portal v4.0 — SQLite Backend")
        print("="*58)
        print("  📦 Database:   SQLite (alumni_v4.db) — auto created!")
        print("  🔐 Auth:       JWT + RBAC")
        print("  ⚡ Realtime:  WebSockets")
        print("  🛡️  Security:  Rate Limiting")
        print("  📝 API Docs:  http://localhost:5000/apidocs")
        print("  🌱 Seed:      http://localhost:5000/api/auth/seed")
        print("  ✨ Features:  Events, Forum, Mentorship, Gallery,")
        print("                Stories, Feedback, Contributions,")
        print("                Opportunities, Contact, Social Links")
        print("="*58 + "\n")
    socketio.run(app, debug=True, port=5000)
