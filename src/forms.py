from flask_wtf import FlaskForm
from wtforms import (
    StringField, PasswordField, SubmitField
)
from wtforms.validators import (
    DataRequired, Length, EqualTo, ValidationError, Regexp
)
from flask_login import current_user

from passlib.hash import sha256_crypt

from . import CONF
from .models import User

USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 20

class FormErrors:

    FIELD_REQUIRED = "Ce champ est requis."
    INVALID_LENGTH = "Le nom d'utilisateur doit être compris entre {min} et {max} caractères."
    PASSWORD_DOESNT_MATCH = "Les mots de passe ne correspondent pas."
    USERNAME_ALREADY_EXISTS = "Ce nom d'utilisateur existe déjà."
    USERNAME_DOESNT_EXISTS = "Ce nom d'utilisateur n'existe pas."
    INVALID_PASSWORD = "Ce mot de passe est incorrect."

render_kw = dict(
    class_ = 'form-control'
)
render_kw_submit = dict(
    class_ = 'btn btn-primary'
)

class RegistrationForm(FlaskForm):
    username = StringField(
        'Nom d\'utilisateur', 
        validators = [
            DataRequired(FormErrors.FIELD_REQUIRED),
            Length(
                min = USERNAME_MIN_LENGTH, 
                max = USERNAME_MAX_LENGTH, 
                message = FormErrors.INVALID_LENGTH.format(
                    min = USERNAME_MIN_LENGTH, 
                    max = USERNAME_MAX_LENGTH
                )
            ),
            Regexp(
                '^([a-zA-Z0-9]|_)+$', 
                message = 'Le nom d\'utilisateur ne peut que contenir des lettres, chiffres et underscore.'
            )
        ],
        render_kw = render_kw
    )
    password = PasswordField(
        'Mot de passe', 
        validators = [DataRequired(FormErrors.FIELD_REQUIRED),],
        render_kw = render_kw
    )
    confirm_password = PasswordField(
        'Confirmer le mot de passe', 
        validators = [
            DataRequired(FormErrors.FIELD_REQUIRED),
            EqualTo('password', FormErrors.PASSWORD_DOESNT_MATCH),
        ],
        render_kw = render_kw
    )

    master_pwd = PasswordField(
        'Master key',
        validators = [
            DataRequired(FormErrors.FIELD_REQUIRED),
        ],
        render_kw = render_kw
    )

    submit = SubmitField('S\'enregistrer', render_kw = render_kw_submit)

    def validate_username(self, username):
        if user := User.query.filter_by(name = username.data).first():
            raise ValidationError(FormErrors.USERNAME_ALREADY_EXISTS)
        
    def validate_master_pwd(self, master_pwd):
        if master_pwd.data != CONF['MASTER_KEY']:
            raise ValidationError('Mot de passe maître invalide... \n S\'il ne vous a pas été explicitement donné, vous n\'êtes probablement pas le/la bienvenu(e) ici :(')
        
class LoginForm(FlaskForm):
    username = StringField(
        'Nom d\'utilisateur', 
        validators = [
            DataRequired(FormErrors.FIELD_REQUIRED), 
        ],
        render_kw = render_kw
    )

    password = PasswordField(
        'Mot de passe', 
        validators = [DataRequired(FormErrors.FIELD_REQUIRED),],
        render_kw = render_kw
    )

    submit = SubmitField('Se connecter', render_kw = render_kw_submit)
        
    def validate(self, extra_validators = None):
        initial_validation = super(LoginForm, self).validate(extra_validators)
        if not initial_validation:
            return False
        
        user: User = User.query.filter_by(name = self.username.data).first()
        if not user:
            self.username.errors.append(FormErrors.USERNAME_DOESNT_EXISTS)
            return False
        
        if not sha256_crypt.verify(self.password.data, user.passwd):
            self.password.errors.append(FormErrors.INVALID_PASSWORD)
            return False
        return True
        
class EditProfileForm(FlaskForm):
    username = StringField(
        'Nouveau nom d\'utilisateur', 
        validators = [
            Length(
                min = USERNAME_MIN_LENGTH, 
                max = USERNAME_MAX_LENGTH, 
                message = FormErrors.INVALID_LENGTH.format(
                    min = USERNAME_MIN_LENGTH, 
                    max = USERNAME_MAX_LENGTH
                )
            ),
            Regexp(
                '^([a-zA-Z0-9]|_)+$', 
                message = 'Le nouveau nom d\'utilisateur ne peut que contenir des lettres, chiffres et underscore.'
            )
        ],
        render_kw = render_kw
    )

    password = PasswordField(
        'Mot de passe actuel',
        validators = [DataRequired(FormErrors.FIELD_REQUIRED),],
        render_kw = render_kw
    )

    new_password = PasswordField(
        'Nouveau mot de passe',
        render_kw = render_kw
    )

    confirm_password = PasswordField(
        'Confirmer le mot de passe', 
        validators = [
            EqualTo('new_password', FormErrors.PASSWORD_DOESNT_MATCH),
        ],
        render_kw = render_kw
    )

    submit = SubmitField('Modifier le profil', render_kw = render_kw_submit)

    def validate(self, extra_validators = None):
        initial_validation = super(EditProfileForm, self).validate(extra_validators)
        if not initial_validation:
            return False
        
        user: User = User.query.filter_by(id = current_user.get_id()).first()
        if not sha256_crypt.verify(self.password.data, user.passwd):
            self.password.errors.append(FormErrors.INVALID_PASSWORD)
            return False
        return True