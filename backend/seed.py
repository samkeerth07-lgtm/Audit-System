from database import SessionLocal
from models import Firm, User, Client


db = SessionLocal()


abc = Firm(name="ABC & Co.")
xyz = Firm(name="XYZ & Co.")

db.add_all([abc, xyz])
db.commit()


ravi = User(
    firm_id=abc.id,
    name="Ravi",
    email="ravi@abc.com",
    password_hash="demo",
    role="STAFF"
)

anil = User(
    firm_id=abc.id,
    name="Anil",
    email="anil@abc.com",
    password_hash="demo",
    role="REVIEWER"
)

priya = User(
    firm_id=xyz.id,
    name="Priya",
    email="priya@xyz.com",
    password_hash="demo",
    role="STAFF"
)

meena = User(
    firm_id=xyz.id,
    name="Meena",
    email="meena@xyz.com",
    password_hash="demo",
    role="REVIEWER"
)

db.add_all([ravi, anil, priya, meena])
db.commit()


abc_client = Client(
    firm_id=abc.id,
    name="ABC Traders Pvt. Ltd."
)

xyz_client = Client(
    firm_id=xyz.id,
    name="XYZ Enterprises Pvt. Ltd."
)

db.add_all([abc_client, xyz_client])
db.commit()


db.close()

print("Sample data created successfully!")