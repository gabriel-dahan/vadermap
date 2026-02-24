. ./.venv/bin/activate

python -m gunicorn --workers=5 app:app
