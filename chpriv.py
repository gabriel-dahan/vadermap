import argparse
import sys

parser = argparse.ArgumentParser(description='Changes the privileges of a user.')
parser.add_argument("--privilege", type=int, default=0)
parser.add_argument("--user")

args = parser.parse_args()

privilege = args.privilege
username = args.user

from src import __app__, db
from src.models import User

with __app__.app_context():
    user = User.query.filter_by(name = username).first()
    if not user:
        print(f'User \'{username}\' does not exist.')
        sys.exit(0)
    if privilege > 2 or privilege < 0:
        print(f'User privileges must range between 0 and 2 included. Input : {privilege}')
        sys.exit(0)
    user.privileges = privilege
    db.session.commit()
    print(f'User {username}\' privileges were successfuly changed to {privilege}.')