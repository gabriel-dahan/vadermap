from src import __app__, db
from src.models import User

with __app__.app_context():
    User.query.update({ User.patchnote_seen: False })
    db.session.commit()
    print(f'PatchNote was reset to `unseen`.')