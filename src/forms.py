from flask_wtf import FlaskForm
from flask_login import current_user
from wtforms import (
    StringField, PasswordField, SubmitField,
    BooleanField
)
from wtforms.validators import (
    DataRequired, Length, EqualTo, ValidationError,
)

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
    submit = SubmitField('S\'enregistrer')

    def validate_username(self, username):
        if user := User.query.filter_by(name = username.data).first():
            raise ValidationError(FormErrors.USERNAME_ALREADY_EXISTS)
        
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