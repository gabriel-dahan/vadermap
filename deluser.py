import argparse
import sys

parser = argparse.ArgumentParser(description='Deletes a user.')
parser.add_argument("--user")

args = parser.parse_args()

username = args.user

from src import __app__, db
from src.models import User

with __app__.app_context():
    user = User.query.filter_by(name = username).first()
    if not user:
        print(f'User \'{username}\' does not exist.')
        sys.exit(0)
    nbverif = 3
    for i in range(nbverif):
        v = input(f'Confirmation {i + 1}/{nbverif} (y/n) : ')
        if v.lower() != 'y':
            sys.exit(0)
    db.session.delete(user)
    db.session.commit()
    print(f'User \'{username}\' was successfuly deleted.')