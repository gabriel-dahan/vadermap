from flask_wtf import FlaskForm
from wtforms import (
    StringField, PasswordField, SubmitField
)
from wtforms.validators import (
    DataRequired, Length, EqualTo, ValidationError, Regexp
)

from . import CONF
from .models import User

USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 20

class FormErrors:

    FIELD_REQUIRED = "Ce champ est requis."
    INVALID_LENGTH = "Le nom d'utilisateur doit être compris entre {min} et {max} caractères."
    PASSWORD_DOESNT_MATCH = "Les mots de passes ne correspondent pas."
    USERNAME_ALREADY_EXISTS = "Ce nom d'utilisateur existe déjà."
    USERNAME_DOESNT_EXISTS = "Ce nom d'utilisateur n'existe pas."

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
        ]
    )
    password = PasswordField(
        'Mot de passe', 
        validators = [DataRequired(FormErrors.FIELD_REQUIRED),]
    )
    confirm_password = PasswordField(
        'Confirmer le mot de passe', 
        validators = [
            DataRequired(FormErrors.FIELD_REQUIRED),
            EqualTo('password', FormErrors.PASSWORD_DOESNT_MATCH),
        ]
    )

    master_pwd = PasswordField(
        'Master key',
        validators = [
            DataRequired(FormErrors.FIELD_REQUIRED),
        ]
    )

    submit = SubmitField('S\'enregistrer')

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
        ]
    )

    password = PasswordField(
        'Mot de passe', 
        validators = [DataRequired(FormErrors.FIELD_REQUIRED),]
    )

    submit = SubmitField('Se connecter')

    def validate_username(self, username):
        if not User.query.filter_by(name = username.data).first():
            raise ValidationError(FormErrors.USERNAME_DOESNT_EXISTS)
        
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
        ]
    )

    password = PasswordField(
        'Mot de passe actuel',
        validators = [DataRequired(FormErrors.FIELD_REQUIRED),]
    )

    new_password = PasswordField(
        'Nouveau mot de passe',
    )

    confirm_password = PasswordField(
        'Confirmer le mot de passe', 
        validators = [
            EqualTo('new_password', FormErrors.PASSWORD_DOESNT_MATCH),
        ]
    )

    submit = SubmitField('Modifier le profil')