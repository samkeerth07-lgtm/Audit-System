from database import SessionLocal
from models import Firm, User, Client


def _normalize_name(value):
    return (value or "").strip().lower()


def seed_data():
    db = SessionLocal()

    try:
        firms = {
            "ABC & Co.": None,
            "XYZ & Co.": None,
        }

        for firm_name in firms:
            firm = db.query(Firm).filter(Firm.name == firm_name).first()
            if firm is None:
                firm = Firm(name=firm_name)
                db.add(firm)
                db.flush()
            firms[firm_name] = firm

        db.commit()

        demo_users = {
            "ravi@abc.com": {"name": "Ravi", "firm_id": firms["ABC & Co."].id, "password_hash": "demo", "role": "STAFF"},
            "anil@abc.com": {"name": "Anil", "firm_id": firms["ABC & Co."].id, "password_hash": "demo", "role": "REVIEWER"},
            "priya@xyz.com": {"name": "Priya", "firm_id": firms["XYZ & Co."].id, "password_hash": "demo", "role": "STAFF"},
            "meena@xyz.com": {"name": "Meena", "firm_id": firms["XYZ & Co."].id, "password_hash": "demo", "role": "REVIEWER"},
        }

        existing_users = {
            _normalize_name(user.email): user
            for user in db.query(User).filter(User.email.in_([email for email in demo_users])).all()
        }

        for email, details in demo_users.items():
            key = _normalize_name(email)
            user = existing_users.get(key)

            if user is None:
                db.add(
                    User(
                        firm_id=details["firm_id"],
                        name=details["name"],
                        email=email,
                        password_hash=details["password_hash"],
                        role=details["role"],
                    )
                )
                continue

            if (
                user.name != details["name"]
                or user.firm_id != details["firm_id"]
                or user.password_hash != details["password_hash"]
                or user.role != details["role"]
                or _normalize_name(user.email) != key
            ):
                user.name = details["name"]
                user.firm_id = details["firm_id"]
                user.password_hash = details["password_hash"]
                user.role = details["role"]
                user.email = email

        db.commit()

        client_map = {
            "ABC Traders Pvt. Ltd.": firms["ABC & Co."].id,
            "XYZ Enterprises Pvt. Ltd.": firms["XYZ & Co."].id,
        }

        existing_clients = {
            (client.name, client.firm_id): client
            for client in db.query(Client).filter(Client.name.in_(list(client_map.keys()))).all()
        }

        for client_name, firm_id in client_map.items():
            key = (client_name, firm_id)
            if key not in existing_clients:
                db.add(Client(firm_id=firm_id, name=client_name))

        db.commit()

        firm_count = db.query(Firm).count()
        user_count = db.query(User).count()
        client_count = db.query(Client).count()

        print("Database initialized")
        print(f"Demo users verified: {user_count} users, {firm_count} firms, {client_count} clients")
        print("Demo data seed completed")

        return {
            "firms": firm_count,
            "users": user_count,
            "clients": client_count,
        }

    finally:
        db.close()
