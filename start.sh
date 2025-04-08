#!/bin/bash
export FLASK_APP=app.py
export FLASK_ENV=production
export PORT=8080
python -c 'from app import application; application.run(host="0.0.0.0", port=$PORT)'
