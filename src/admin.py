from flask import redirect, url_for, request

from flask_login import current_user

from flask_admin import Admin, AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView
from flask_admin.contrib.fileadmin import FileAdmin

from . import __app__

class SecuredAdminIndex(AdminIndexView):
    
    def is_accessible(self):
        return current_user.is_authenticated and current_user.privileges == 2

class SecuredModelView(ModelView):

    def is_accessible(self):
        return current_user.is_authenticated and current_user.privileges == 2

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('login', next = request.url))

class SecuredFileView(FileAdmin):

    def is_accessible(self):
        return current_user.is_authenticated and current_user.privileges == 2

admin = Admin(
    __app__, 
    name = 'VaderAdmin', 
    template_mode = 'bootstrap4',
    index_view = SecuredAdminIndex()
)